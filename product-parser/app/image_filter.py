from __future__ import annotations

import re
from urllib.parse import urlparse

JUNK_URL = re.compile(
    r'(facebook\.com|google-analytics|doubleclick|hotjar|pixel|'
    r'favicon|logo\.|/logo[./]|\.svg(?:\?|$)|tracking|'
    r'noscript|spacer|blank\.|badge|payment|trustpilot|'
    r'sprite|icon/|/icons/|widget|banner|'
    r'transparent-background|stdstatic/.*/images/)',
    re.I,
)

MODEL_PATH = re.compile(
    r'(model|modelka|lookbook|lifestyle|on-?body|worn|wearing|'
    r'editorial|campaign|styling|hero)',
    re.I,
)

PRODUCT_PATH = re.compile(
    r'(packshot|product|gallery|zoom|detail|catalog/product)',
    re.I,
)

# Magento / podobne: ten sam plik pod różnym hashem cache
CACHE_HASH = re.compile(r'/cache/[a-f0-9]{20,}/', re.I)

# Nike CDN: wiele ujęć tego samego produktu, ta sama nazwa pliku .png
NIKE_LAYER_UUID = re.compile(r'fl_layer_apply/([a-f0-9-]{36})/', re.I)


def is_junk_image_url(url: str) -> bool:
    parsed = urlparse(url)
    path = (parsed.path or '') + (parsed.query or '')
    if not path or path.endswith('/'):
        return True
    if JUNK_URL.search(path) or JUNK_URL.search(parsed.netloc or ''):
        return True
    ext = path.rsplit('.', 1)[-1].lower() if '.' in path else ''
    if ext in ('svg', 'gif', 'ico', 'webp') and 'product' not in path.lower():
        if ext == 'svg' or 'logo' in path.lower():
            return True
    return False


def image_dedupe_key(url: str) -> str:
    """Klucz do deduplikacji — ignoruje hash cache w ścieżce."""
    path = urlparse(url).path or ''
    path = CACHE_HASH.sub('/cache/_/', path)
    return path.lower()


def _canonical_image_key(url: str) -> str:
    """Jeden plik — klucz po nazwie (jpg > webp); Nike po UUID warstwy."""
    if 'static.nike.com' in url.lower():
        match = NIKE_LAYER_UUID.search(url)
        if match:
            return f'nike:{match.group(1).lower()}'

    path = urlparse(url).path or ''
    path = CACHE_HASH.sub('/cache/_/', path)
    name = path.rsplit('/', 1)[-1].lower()
    name = re.sub(r'\.webp$', '.jpg', name, flags=re.I)
    return name


def filter_product_image_urls(urls: list[str]) -> list[str]:
    filtered, _ = filter_product_image_urls_with_trace(urls)
    return filtered


def filter_product_image_urls_with_trace(
    urls: list[str],
) -> tuple[list[str], list[dict]]:
    """Deduplikacja z listą zastąpień (ten sam dedupe_key → znika wcześniejszy URL)."""
    best: dict[str, tuple[str, int]] = {}
    dropped: list[dict] = []

    for index, url in enumerate(urls):
        if not url or is_junk_image_url(url):
            continue
        key = _canonical_image_key(url)
        if key not in best:
            best[key] = (url, index)
            continue
        prev_url, prev_index = best[key]
        prev_is_webp = prev_url.lower().split('?')[0].endswith('.webp')
        cur_is_webp = url.lower().split('?')[0].endswith('.webp')
        if prev_is_webp and not cur_is_webp:
            dropped.append(
                {
                    'dedupe_key': key,
                    'replaced_raw_index': prev_index + 1,
                    'kept_raw_index': index + 1,
                    'dropped_url_tail': prev_url[-72:],
                    'kept_url_tail': url[-72:],
                }
            )
            best[key] = (url, prev_index)
        else:
            dropped.append(
                {
                    'dedupe_key': key,
                    'replaced_raw_index': index + 1,
                    'kept_raw_index': prev_index + 1,
                    'dropped_url_tail': url[-72:],
                    'kept_url_tail': prev_url[-72:],
                }
            )

    filtered = [url for url, _ in sorted(best.values(), key=lambda item: item[1])]
    return filtered, dropped
