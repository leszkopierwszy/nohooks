from __future__ import annotations

import json
import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

_SHOPIFY_CDN = re.compile(
    r'https?://[^"\s\'<>]+/cdn/shop/(?:files|products)/[^"\s\'<>?#]+\.(?:jpe?g|png|webp)',
    re.I,
)


def extract_shopify_gallery_urls(html: str, soup: BeautifulSoup, base: str) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []

    def add(raw: str) -> None:
        url = urljoin(base, raw.strip())
        if 'cdn.shop' not in url.lower() or url in seen:
            return
        seen.add(url)
        ordered.append(url)

    for match in _SHOPIFY_CDN.finditer(html):
        add(match.group(0))

    for script in soup.find_all('script', type='application/json'):
        text = script.string or ''
        if 'cdn.shop' not in text and 'product' not in text.lower():
            continue
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        _walk_shopify_json(data, add)

    return ordered


def _walk_shopify_json(value, add) -> None:
    if isinstance(value, str):
        if 'cdn.shop' in value:
            add(value)
        return
    if isinstance(value, list):
        for item in value:
            _walk_shopify_json(item, add)
        return
    if isinstance(value, dict):
        for key in ('src', 'url', 'preview_image', 'featured_image'):
            if key in value and isinstance(value[key], str):
                add(value[key])
        for item in value.values():
            _walk_shopify_json(item, add)
