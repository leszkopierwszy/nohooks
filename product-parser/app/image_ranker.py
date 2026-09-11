from __future__ import annotations

import asyncio
import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse

import httpx

from .http_fetch import CHROME_USER_AGENT

from .image_classify import image_matches_product_class
from .image_catalog_trace import build_ranked_catalog
from .image_filter import filter_product_image_urls_with_trace, is_junk_image_url
from .image_pixels import PixelAnalysis, analyze_image_pixels
from .ollama_vision import analyze_product_image, ollama_available, ollama_enabled
from .product_class import ProductClass, detect_product_class
from .product_sku import (
    is_model_shot_url,
    packshot_index,
    preferred_cover_index,
    url_belongs_to_sku,
)
from .shoe_pair import pair_detection_confidence, resolve_shoe_is_pair
from .image_url_upgrade import upgrade_product_image_url
from .telemetry import flush, span, update_observation

logger = logging.getLogger(__name__)

MAX_CANDIDATES = int(os.getenv('PRODUCT_IMAGE_MAX_CANDIDATES', '16'))
MAX_OUTPUT = int(os.getenv('PRODUCT_IMAGE_MAX_OUTPUT', '4'))
MAX_CATALOG_OUTPUT = int(os.getenv('PRODUCT_IMAGE_MAX_CATALOG', '16'))
MAX_DOWNLOAD_BYTES = int(os.getenv('PRODUCT_IMAGE_MAX_BYTES', '12000000'))
OLLAMA_UNCERTAIN_MAX = int(os.getenv('OLLAMA_UNCERTAIN_MAX', '3'))
OLLAMA_PAIR_CHECK_MAX = int(os.getenv('OLLAMA_PAIR_CHECK_MAX', '6'))
PIXEL_CONFIDENCE_SKIP = float(os.getenv('PIXEL_CONFIDENCE_SKIP_OLLAMA', '0.82'))

SHOE_KEYWORDS = re.compile(
    r'\b(shoe|shoes|sneaker|sneakers|boot|boots|buty|obuw|obuwie|sandal|'
    r'sandals|loafer|loafers|trainer|trainers|footwear|espadrille|mokasyn)\b',
    re.I,
)

MODEL_URL_PATTERNS = re.compile(
    r'(\bmodel(?:ka|ki)?\b|lookbook|lifestyle|on-?body|worn|wearing|outfit|'
    r'editorial|campaign|runway|mannequin(?!-off)|\bperson\b|styling|hero|'
    r'fit-?pic|styled|carry|carrying|holding)',
    re.I,
)

PRODUCT_URL_PATTERNS = re.compile(
    r'(product|packshot|flat|ghost|isolated|detail|zoom|still|'
    r'item|sku|cutout|plain|studio)',
    re.I,
)

SHOE_GOOD_URL = re.compile(
    r'(side|profile|angle|3-?4|three-?quarter|quarter|lateral|bok|oblique)',
    re.I,
)

SHOE_BAD_URL = re.compile(
    r'(top-?view|overhead|sole|bottom|on-?foot|worn|lifestyle|model|'
    r'pair-?top|birds?.?eye|lookbook)',
    re.I,
)

SHOE_VIEW_SCORES = {
    'pair_side_angle': 85,
    'pair_side': 75,
    'pair_front': 65,
    'pair': 55,
    'side_angle': 45,
    'side': 30,
    'front': 0,
    'single_side': -35,
    'single_front': -25,
    'unknown': 0,
    'pair_top': -15,
    'top': -40,
    'on_foot': -55,
}


@dataclass
class ScoredImage:
    url: str
    score: float
    has_model: bool = False
    is_product_only: bool = False
    shoe_side_angle: bool = False
    shoe_is_pair: bool = False
    pair_confidence: float = 0.0
    shoe_view_hint: str = 'unknown'
    confidence_no_model: float = 0.0
    analysis: dict[str, Any] | None = None
    pixels: PixelAnalysis | None = None
    debug: str = field(default='')


def is_shoe_product(
    category: str | None,
    name: str | None,
    description: str | None,
) -> bool:
    text = ' '.join(filter(None, [category, name, description]))
    return bool(SHOE_KEYWORDS.search(text))


def _heuristic_url_score(url: str, *, is_shoe: bool) -> float:
    path = (urlparse(url).path or '') + ' ' + (urlparse(url).query or '')
    score = 0.0

    if is_model_shot_url(url):
        score -= 200

    if is_shoe:
        idx = packshot_index(url)
        if idx is not None:
            prefer = preferred_cover_index(True)
            score += max(0, 40 - abs(idx - prefer) * 12)

    if MODEL_URL_PATTERNS.search(path):
        score -= 80
    if PRODUCT_URL_PATTERNS.search(path):
        score += 15

    if is_shoe:
        if SHOE_GOOD_URL.search(path):
            score += 35
        if SHOE_BAD_URL.search(path):
            score -= 45

    if re.search(r'(?:thumb|thumbnail|icon|sprite|badge|logo|swatch|_\d{1,2}x\d{1,2})', path, re.I):
        score -= 40
    if re.search(r'(?:large|xlarge|xl|1200|1500|2000|original|master)', path, re.I):
        score += 10

    return score


def _pixels_need_ollama(pixels: PixelAnalysis | None) -> bool:
    if not pixels or pixels.fg_ratio < 0.05:
        return True
    if pixels.is_product_only and pixels.confidence >= PIXEL_CONFIDENCE_SKIP:
        return False
    if pixels.has_person and pixels.confidence >= PIXEL_CONFIDENCE_SKIP:
        return False
    if pixels.portrait_model and pixels.confidence >= 0.75:
        return False
    return True


def _pixels_need_pair_ollama(pixels: PixelAnalysis | None, *, is_shoe: bool) -> bool:
    """Dopytaj Ollamę o PAIR — packshoty obuwia z niepewną liczbą butów."""
    if not is_shoe or not pixels or not pixels.is_product_only:
        return False
    if pixels.pair_confidence >= 0.85:
        return False
    if pixels.uniform_bg_ratio > 0.32 and pixels.fg_ratio > 0.08:
        return True
    return False


def _merge_detection(
    url: str,
    pixels: PixelAnalysis | None,
    ollama: dict[str, Any] | None,
    *,
    is_shoe: bool,
) -> tuple[bool, bool, bool, float, str]:
    has_model = False
    product_only = False
    shoe_side = False
    conf = 0.35
    parts: list[str] = []

    path = urlparse(url).path or ''
    if MODEL_URL_PATTERNS.search(path):
        has_model = True
        conf = max(conf, 0.8)
        parts.append('url:model')

    px_person = False
    px_packshot = False
    if pixels and pixels.fg_ratio > 0.05:
        px_person = pixels.has_person or pixels.portrait_model
        px_packshot = pixels.is_product_only
        if px_person:
            has_model = True
            conf = max(conf, pixels.confidence)
            tag = 'px:portrait' if pixels.portrait_model and not pixels.has_person else 'px:person'
            parts.append(f'{tag},skin={pixels.skin_ratio:.3f}')
        if px_packshot:
            product_only = True
            conf = max(conf, pixels.confidence)
            parts.append(f'px:packshot,bg={pixels.uniform_bg_ratio:.2f}')
        if pixels.shoe_side_angle:
            shoe_side = True
        if is_shoe and pixels.shoe_view_hint in ('side_angle', 'side'):
            shoe_side = True
            parts.append(f'px:{pixels.shoe_view_hint}')

    if ollama:
        ollama_person = bool(ollama.get('has_person_or_model'))
        ollama_product = bool(ollama.get('is_product_only'))
        view = ollama.get('shoe_view', 'unknown')

        if ollama_person:
            parts.append('ollama:person')
        if ollama_product:
            parts.append('ollama:product')
        if view != 'unknown':
            parts.append(f'ollama:{view}')

        if px_person:
            has_model = True
            product_only = False
            parts.append('merge:px-person-wins')
        elif px_packshot and pixels and pixels.skin_ratio < 0.025:
            has_model = False
            product_only = True
            parts.append('merge:px-packshot-wins')
        else:
            if ollama_person:
                has_model = True
                conf = max(conf, 0.85)
            if ollama_product and not ollama_person:
                product_only = True
                has_model = False
                conf = max(conf, 0.85)

        if view in ('side_angle', 'side') and not has_model:
            shoe_side = True
        if view == 'on_foot':
            has_model = True
            product_only = False
            shoe_side = False

    elif px_packshot:
        has_model = False
        product_only = True
    elif px_person:
        has_model = True
        product_only = False

    if product_only and has_model:
        if pixels and (pixels.is_product_only or pixels.skin_ratio < 0.02):
            has_model = False
            parts.append('merge:clear-model-flag')

    if not has_model and not product_only and pixels:
        if pixels.uniform_bg_ratio > 0.4 and pixels.skin_ratio < 0.018:
            product_only = True
            conf = max(conf, 0.7)
            parts.append('merge:weak-packshot')

    confidence_no_model = conf if not has_model else max(0.1, 1.0 - conf)

    if is_shoe and shoe_side:
        parts.append('shoe-side')

    return has_model, product_only, shoe_side, confidence_no_model, '|'.join(parts)


def _compute_score(
    heuristic: float,
    *,
    has_model: bool,
    is_product_only: bool,
    shoe_side: bool,
    is_shoe: bool,
    ollama: dict[str, Any] | None,
    pixels: PixelAnalysis | None = None,
) -> float:
    score = heuristic

    if is_product_only and not has_model:
        score += 120
    elif not has_model:
        score += 35
    else:
        score -= 150

    if is_shoe:
        if shoe_side:
            score += 55
        view = (
            (pixels.shoe_view_hint if pixels else None)
            or (ollama.get('shoe_view') if ollama else None)
            or 'unknown'
        )
        score += SHOE_VIEW_SCORES.get(view, 0)
        if pixels and pixels.shoe_is_pair:
            score += 55
        elif pixels and pixels.is_product_only and view in ('side', 'side_angle', 'front'):
            score -= 35
        if has_model:
            score -= 40
        if is_product_only and shoe_side:
            score += 25

    if ollama and not has_model:
        try:
            cover = float(ollama.get('cover_suitability', 50))
        except (TypeError, ValueError):
            cover = 50.0
        score += (cover - 50) * 0.5

    return score


def _view_family(view_hint: str) -> str:
    return (view_hint or 'unknown').replace('pair_', '')


def _pick_diverse_shoe_images(items: list[ScoredImage], limit: int) -> list[ScoredImage]:
    """Różne ujęcia (bok, przód, para…) — nie 4× ten sam kadr."""
    if len(items) <= limit:
        return items

    picked: list[ScoredImage] = []
    used_views: set[str] = set()

    for preferred_pair in (True, False):
        for item in items:
            if len(picked) >= limit:
                break
            if item.shoe_is_pair != preferred_pair:
                continue
            family = _view_family(item.shoe_view_hint)
            if family in used_views and len(picked) >= 1:
                continue
            picked.append(item)
            used_views.add(family)

    for item in items:
        if len(picked) >= limit:
            break
        if item not in picked:
            picked.append(item)

    return picked[:limit]


def _order_scored(items: list[ScoredImage]) -> list[ScoredImage]:
    non_model = [x for x in items if not x.has_model]
    with_model = [x for x in items if x.has_model]

    if non_model:
        non_model.sort(key=lambda x: -x.score)
        with_model.sort(key=lambda x: -x.score)
        return non_model + with_model

    return sorted(items, key=lambda x: -x.score)


async def _download_image(client: httpx.AsyncClient, url: str) -> bytes | None:
    try:
        response = await client.get(url)
        response.raise_for_status()
        content_type = (response.headers.get('content-type') or '').lower()
        if 'image' not in content_type and 'octet-stream' not in content_type:
            return None
        body = response.content
        if len(body) > MAX_DOWNLOAD_BYTES:
            logger.warning('Image too large (%d bytes), skipping: %s', len(body), url[:80])
            return None
        if len(body) < 500:
            return None
        return body
    except Exception:
        return None


def _filter_by_sku(candidates: list[str], primary_sku: str | None) -> list[str]:
    if not primary_sku:
        return candidates
    kept = [u for u in candidates if url_belongs_to_sku(u, primary_sku)]
    if kept:
        return kept
    logger.warning('SKU filter removed all images for %s', primary_sku)
    return candidates


def _filter_by_product_class(
    candidates: list[str],
    product_class: ProductClass,
    pixel_results: dict[str, tuple[PixelAnalysis | None, bytes | None]],
    image_alts: dict[str, str | None] | None,
    *,
    primary_sku: str | None = None,
) -> list[str]:
    if product_class == ProductClass.UNKNOWN:
        return candidates

    kept: list[str] = []
    for url in candidates:
        if primary_sku and not url_belongs_to_sku(url, primary_sku):
            logger.info('Class filter skip (sku): %s', url[:90])
            continue
        if is_model_shot_url(url):
            logger.info('Class filter skip (model-file): %s', url[:90])
            continue
        pixels, _ = pixel_results.get(url, (None, None))
        alt = (image_alts or {}).get(url)
        ok, reason = image_matches_product_class(
            url,
            product_class,
            alt=alt,
            pixels=pixels,
        )
        if ok:
            kept.append(url)
        else:
            logger.info('Class filter skip (%s): %s', reason, url[:90])

    if kept:
        return kept

    logger.warning(
        'Class filter removed all %d images for %s — keeping originals',
        len(candidates),
        product_class.value,
    )
    return candidates


async def rank_product_images(
    urls: list[str],
    *,
    category: str | None = None,
    name: str | None = None,
    description: str | None = None,
    is_footwear: bool = False,
    product_class: ProductClass | None = None,
    image_alts: dict[str, str | None] | None = None,
    source_url: str | None = None,
    primary_sku: str | None = None,
    max_output: int | None = None,
) -> tuple[list[str], list[dict[str, Any]], dict[str, Any]]:
    if not urls:
        return [], [], {
            'has_pair_image': False,
            'pair_image_urls': [],
            'pair_image_count': 0,
            'image_catalog': {'raw_count': 0, 'catalog_output_count': 0, 'all_scored': []},
        }

    resolved_class = product_class or detect_product_class(
        url=source_url,
        category=category,
        name=name,
        description=description,
        is_footwear=is_footwear,
    )
    is_shoe = resolved_class == ProductClass.FOOTWEAR or is_shoe_product(
        category, name, description
    )
    deduped_urls, dedupe_dropped = filter_product_image_urls_with_trace(urls)
    candidates = [u for u in deduped_urls if not is_model_shot_url(u)][:MAX_CANDIDATES]
    candidates = _filter_by_sku(candidates, primary_sku)

    use_ollama = ollama_enabled() and await ollama_available()

    with span(
        'rank_product_images',
        input={
            'candidate_count': len(candidates),
            'filtered_from': len(urls),
            'is_shoe': is_shoe,
            'product_class': resolved_class.value,
            'use_ollama': use_ollama,
        },
    ) as rank_span:
        output_limit = max(1, min(max_output if max_output is not None else MAX_OUTPUT, MAX_CATALOG_OUTPUT))
        urls_out, meta, pair_summary = await _rank_product_images_impl(
            candidates,
            is_shoe=is_shoe,
            use_ollama=use_ollama,
            product_class=resolved_class,
            image_alts=image_alts,
            primary_sku=primary_sku,
            max_output=output_limit,
            raw_urls=urls,
            dedupe_dropped=dedupe_dropped,
        )
        update_observation(
            rank_span,
            output={
                'urls': urls_out,
                'count': len(urls_out),
                'has_pair_image': pair_summary.get('has_pair_image'),
                'pair_image_count': pair_summary.get('pair_image_count'),
                'image_catalog': pair_summary.get('image_catalog'),
            },
        )
        flush()
        return urls_out, meta, pair_summary


async def _rank_product_images_impl(
    candidates: list[str],
    *,
    is_shoe: bool,
    use_ollama: bool,
    product_class: ProductClass = ProductClass.UNKNOWN,
    image_alts: dict[str, str | None] | None = None,
    primary_sku: str | None = None,
    max_output: int = MAX_OUTPUT,
    raw_urls: list[str] | None = None,
    dedupe_dropped: list[dict[str, Any]] | None = None,
) -> tuple[list[str], list[dict[str, Any]], dict[str, Any]]:
    logger.info(
        'Ranking %d images (class=%s, sku=%s, shoe=%s, ollama=%s, ollama_max=%d, max_out=%d)',
        len(candidates),
        product_class.value,
        primary_sku or '-',
        is_shoe,
        use_ollama,
        OLLAMA_UNCERTAIN_MAX,
        max_output,
    )

    semaphore = asyncio.Semaphore(6)
    scored: list[ScoredImage] = []
    pixel_results: dict[str, tuple[PixelAnalysis | None, bytes | None]] = {}

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(15.0, connect=8.0),
        headers={
            'User-Agent': CHROME_USER_AGENT,
            'Accept': 'image/*,*/*;q=0.8',
            'Referer': 'https://www.zara.com/',
        },
    ) as client:

        async def fetch_and_pixels(url: str) -> None:
            async with semaphore:
                raw = await _download_image(client, url)
                pixels = analyze_image_pixels(raw) if raw else None
                pixel_results[url] = (pixels, raw)

        await asyncio.gather(*(fetch_and_pixels(url) for url in candidates))

        candidates = _filter_by_product_class(
            candidates,
            product_class,
            pixel_results,
            image_alts,
            primary_sku=primary_sku,
        )

        uncertain_urls: list[str] = []
        pair_check_urls: list[str] = []
        for url in candidates:
            pixels, _ = pixel_results[url]
            if not use_ollama:
                continue
            if _pixels_need_ollama(pixels):
                uncertain_urls.append(url)
            elif is_shoe and pixels and pixels.is_product_only:
                pair_check_urls.append(url)
            elif is_shoe and _pixels_need_pair_ollama(pixels, is_shoe=True):
                pair_check_urls.append(url)
        uncertain_urls = list(dict.fromkeys(uncertain_urls))[:OLLAMA_UNCERTAIN_MAX]
        pair_check_urls = [
            u for u in pair_check_urls if u not in uncertain_urls
        ][:OLLAMA_PAIR_CHECK_MAX]
        ollama_urls = list(dict.fromkeys(uncertain_urls + pair_check_urls))
        if uncertain_urls:
            logger.info('Ollama for %d uncertain images (of %d)', len(uncertain_urls), len(candidates))

        ollama_results: dict[str, dict[str, Any] | None] = {}

        async def run_ollama(url: str) -> None:
            _, raw = pixel_results[url]
            if raw:
                ollama_results[url] = await analyze_product_image(raw, is_shoe_hint=is_shoe)
            else:
                ollama_results[url] = None

        if ollama_urls:
            await asyncio.gather(*(run_ollama(url) for url in ollama_urls))

        for url in candidates:
            if is_junk_image_url(url) or is_model_shot_url(url):
                continue
            pixels, _ = pixel_results[url]
            ollama = ollama_results.get(url) if url in ollama_urls else None
            heuristic = _heuristic_url_score(url, is_shoe=is_shoe)

            has_model, product_only, shoe_side, conf, debug = _merge_detection(
                url, pixels, ollama, is_shoe=is_shoe
            )
            score = _compute_score(
                heuristic,
                has_model=has_model,
                is_product_only=product_only,
                shoe_side=shoe_side,
                is_shoe=is_shoe,
                ollama=ollama,
                pixels=pixels,
            )

            is_pair = resolve_shoe_is_pair(pixels, ollama)
            pair_conf = pair_detection_confidence(pixels, ollama)
            px_view = pixels.shoe_view_hint if pixels else 'unknown'
            if not is_pair and px_view.startswith('pair_'):
                px_view = px_view[5:] or 'unknown'
            elif is_pair and px_view in ('side', 'side_angle', 'front', 'top', 'unknown'):
                if 'pair' not in px_view:
                    px_view = f'pair_{px_view}' if px_view != 'unknown' else 'pair'

            scored.append(
                ScoredImage(
                    url=url,
                    score=score,
                    has_model=has_model,
                    is_product_only=product_only,
                    shoe_side_angle=shoe_side,
                    shoe_is_pair=is_pair,
                    pair_confidence=pair_conf,
                    shoe_view_hint=px_view,
                    confidence_no_model=conf,
                    analysis=ollama,
                    pixels=pixels,
                    debug=debug + ('|fast:px-only' if url not in uncertain_urls else ''),
                )
            )
            logger.info(
                'Image score=%.0f pair=%s (%.2f) view=%s model=%s url=%s (%s)',
                score,
                is_pair,
                pair_conf,
                px_view,
                has_model,
                url[:85],
                debug,
            )

    ordered = _order_scored(scored)
    without_model = [x for x in ordered if not x.has_model]
    product_only = [x for x in without_model if x.is_product_only]
    final = product_only if product_only else (without_model if without_model else ordered)

    if is_shoe and final:
        prefer = preferred_cover_index(True)

        def shoe_sort_key(x: ScoredImage) -> tuple:
            view = _view_family(x.shoe_view_hint)
            view_rank = {
                'side_angle': 0,
                'side': 1,
                'pair_side_angle': 2,
                'pair_side': 3,
                'front': 4,
                'pair_front': 5,
                'pair': 6,
                'top': 7,
                'unknown': 8,
            }.get(view, 9)
            return (
                0 if x.shoe_is_pair else 1,
                0 if x.is_product_only else 1,
                view_rank,
                abs((packshot_index(x.url) or 99) - prefer),
                -x.score,
            )

        final.sort(key=shoe_sort_key)

    if final:
        top = final[0]
        logger.info(
            'Cover pick: pair=%s view=%s model=%s url=%s',
            top.shoe_is_pair,
            top.shoe_view_hint,
            top.has_model,
            top.url[:100],
        )

    if is_shoe and max_output <= MAX_OUTPUT:
        picked_items = _pick_diverse_shoe_images(final, max_output)
    else:
        picked_items = final[:max_output]
    picked = picked_items

    pair_candidates = [
        x
        for x in picked
        if x.shoe_is_pair and not x.has_model and x.is_product_only
    ]
    pair_image_urls = [upgrade_product_image_url(x.url) for x in pair_candidates]
    has_pair_image = len(pair_image_urls) > 0

    if is_shoe and has_pair_image:
        logger.info(
            'Pair in output (%d): %s',
            len(pair_image_urls),
            ', '.join(u[:60] for u in pair_image_urls[:3]),
        )
    elif is_shoe:
        logger.warning('No pair packshot in %d picked images (scored %d)', len(picked), len(scored))
    urls_out = [upgrade_product_image_url(x.url) for x in picked]
    meta = [
        {
            'url': upgrade_product_image_url(x.url),
            'view_hint': x.shoe_view_hint,
            'is_pair': x.shoe_is_pair,
            'pair_confidence': round(x.pair_confidence, 2),
            'is_product_only': x.is_product_only,
        }
        for x in picked
    ]
    pair_summary = {
        'has_pair_image': has_pair_image,
        'pair_image_urls': pair_image_urls[:12],
        'pair_image_count': len(pair_image_urls),
    }
    catalog = build_ranked_catalog(
        scored,
        picked_urls=urls_out,
        raw_urls=raw_urls or candidates,
        dedupe_dropped=dedupe_dropped or [],
    )
    catalog['after_dedupe_count'] = len(candidates)
    pair_summary['image_catalog'] = catalog

    with span(
        'image_catalog',
        input={'scored': len(scored), 'output': len(urls_out)},
        metadata={'dedupe_dropped': len(dedupe_dropped or [])},
    ) as cat_span:
        update_observation(cat_span, output=catalog)

    return urls_out, meta, pair_summary
