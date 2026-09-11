from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

from .image_filter import _canonical_image_key, filter_product_image_urls_with_trace

NIKE_LAYER_UUID = re.compile(r'fl_layer_apply/([a-f0-9-]{36})/', re.I)


def image_layer_id(url: str) -> str | None:
    if not url:
        return None
    match = NIKE_LAYER_UUID.search(url)
    if match:
        return match.group(1).lower()
    path = urlparse(url).path or ''
    name = path.rsplit('/', 1)[-1]
    return name[:48] if name else None


def summarize_url(url: str, *, max_len: int = 96) -> str:
    if not url:
        return ''
    if len(url) <= max_len:
        return url
    return f'…{url[-max_len + 1 :]}'


def build_ranked_catalog(
    scored_items: list[Any],
    *,
    picked_urls: list[str],
    raw_urls: list[str],
    dedupe_dropped: list[dict[str, Any]],
) -> dict[str, Any]:
    """Katalog zdjęć do Langfuse — indeksy, UUID warstwy, co weszło do outputu."""
    picked_set = set(picked_urls)
    raw_index = {u: i + 1 for i, u in enumerate(raw_urls)}

    ranked = sorted(scored_items, key=lambda x: -float(getattr(x, 'score', 0)))

    images: list[dict[str, Any]] = []
    for rank_pos, item in enumerate(ranked, start=1):
        url = getattr(item, 'url', '') or ''
        images.append(
            {
                'rank': rank_pos,
                'raw_index': raw_index.get(url),
                'in_catalog_output': url in picked_set,
                'catalog_output_index': (
                    picked_urls.index(url) + 1 if url in picked_set else None
                ),
                'layer_id': image_layer_id(url),
                'dedupe_key': _canonical_image_key(url),
                'view_hint': getattr(item, 'shoe_view_hint', None),
                'is_pair': bool(getattr(item, 'shoe_is_pair', False)),
                'pair_confidence': round(float(getattr(item, 'pair_confidence', 0)), 2),
                'score': round(float(getattr(item, 'score', 0)), 2),
                'has_model': bool(getattr(item, 'has_model', False)),
                'is_product_only': bool(getattr(item, 'is_product_only', False)),
                'url_tail': summarize_url(url),
            }
        )

    output_list = [
        {
            'output_index': i + 1,
            'rank': next((img['rank'] for img in images if img.get('url_tail') == summarize_url(u)), None),
            'raw_index': raw_index.get(u),
            'layer_id': image_layer_id(u),
            'url_tail': summarize_url(u),
        }
        for i, u in enumerate(picked_urls)
    ]

    return {
        'raw_count': len(raw_urls),
        'after_dedupe_count': None,
        'scored_count': len(ranked),
        'catalog_output_count': len(picked_urls),
        'dedupe_dropped_count': len(dedupe_dropped),
        'dedupe_dropped': dedupe_dropped[:24],
        'catalog_output': output_list,
        'all_scored': images,
    }
