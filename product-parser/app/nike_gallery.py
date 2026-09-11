from __future__ import annotations

import json
import re
from typing import Any
from urllib.parse import urlparse

from bs4 import BeautifulSoup

# Pełny rozmiar PDP (zamiast t_default / miniaturek)
_NIKE_SIZE_TOKEN = re.compile(r'/t_[^/]+/', re.I)
_NIKE_WIDTH_CAP = re.compile(r',c_scale,w_\d+', re.I)

_SQUARISH_IN_JSON = re.compile(
    r'"squarish"\s*:\s*\{[^{}]*"url"\s*:\s*"(https://static\.nike\.com/a/images/[^"]+)"',
    re.I,
)
_SQUARISH_IMG_KEY = re.compile(
    r'"squarishImg"\s*:\s*"(https://static\.nike\.com/a/images/[^"]+)"',
    re.I,
)
_LAYER_APPLY_URL = re.compile(
    r'https://static\.nike\.com/a/images/[^"\s\'\\]+fl_layer_apply/[^"\s\'\\]+\.(?:png|jpe?g|webp)',
    re.I,
)
_IMAGE_UUID = re.compile(r'fl_layer_apply/([a-f0-9-]{36})/', re.I)


def upgrade_nike_image_url(url: str) -> str:
    if not url or 'static.nike.com' not in url:
        return url
    # f_png zamiast f_auto — unikamy AVIF (trudny import w PHP / przeglądarce)
    upgraded = _NIKE_SIZE_TOKEN.sub('/t_PDP_1728_v1/f_png,q_auto:eco,', url, count=1)
    upgraded = _NIKE_WIDTH_CAP.sub('', upgraded)
    return upgraded


def _image_dedupe_key(url: str) -> str:
    match = _IMAGE_UUID.search(url)
    if match:
        return match.group(1).lower()
    path = urlparse(url).path or url
    return path.rsplit('/', 1)[-1].lower()


def _add_url(url: str | None, seen: set[str], ordered: list[str]) -> None:
    if not url or 'static.nike.com' not in url:
        return
    if '/a/images/' not in url:
        return
    if 'fl_layer_apply' not in url and '/t_PDP_' not in url:
        return
    upgraded = upgrade_nike_image_url(url)
    key = _image_dedupe_key(upgraded)
    if key in seen:
        return
    seen.add(key)
    ordered.append(upgraded)


def _urls_from_content_images(items: list[Any], seen: set[str], ordered: list[str]) -> None:
    for item in items:
        if not isinstance(item, dict):
            continue
        if item.get('cardType') and item.get('cardType') != 'image':
            continue
        props = item.get('properties') or {}
        if not isinstance(props, dict):
            continue
        squarish = props.get('squarish') or {}
        portrait = props.get('portrait') or {}
        if isinstance(squarish, dict) and squarish.get('url'):
            _add_url(str(squarish['url']), seen, ordered)
        elif isinstance(portrait, dict) and portrait.get('url'):
            _add_url(str(portrait['url']), seen, ordered)


def _urls_from_selected_product(product: dict[str, Any] | None, seen: set[str], ordered: list[str]) -> None:
    if not product or not isinstance(product, dict):
        return
    content = product.get('contentImages')
    if isinstance(content, list):
        _urls_from_content_images(content, seen, ordered)


def _urls_from_page_props(page_props: dict[str, Any], style_color: str | None, seen: set[str], ordered: list[str]) -> None:
    _urls_from_selected_product(page_props.get('selectedProduct'), seen, ordered)

    if len(ordered) >= 4:
        return

    groups = page_props.get('productGroups')
    if isinstance(groups, list) and style_color:
        for group in groups:
            if not isinstance(group, dict):
                continue
            products = group.get('products')
            if not isinstance(products, list):
                continue
            for product in products:
                if not isinstance(product, dict):
                    continue
                if product.get('styleColor') != style_color:
                    continue
                _urls_from_selected_product(product, seen, ordered)


def _parse_next_data(soup: BeautifulSoup) -> dict[str, Any] | None:
    script = soup.find('script', id='__NEXT_DATA__', type='application/json')
    if not script:
        return None
    text = script.string or script.get_text() or ''
    if not text.strip():
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def _style_color_from_url(page_url: str) -> str | None:
    path = urlparse(page_url).path or ''
    match = re.search(r'/([A-Z0-9]{2,10}-\d{3})(?:/|$)', path, re.I)
    if match:
        return match.group(1).upper()
    return None


def _regex_fallback_urls(html: str, seen: set[str], ordered: list[str]) -> None:
    for pattern in (_SQUARISH_IN_JSON, _SQUARISH_IMG_KEY, _LAYER_APPLY_URL):
        for match in pattern.finditer(html):
            _add_url(match.group(1) if match.lastindex else match.group(0), seen, ordered)


def extract_nike_gallery_urls(html: str, soup: BeautifulSoup, page_url: str) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    style_color = _style_color_from_url(page_url)

    data = _parse_next_data(soup)
    if data:
        page_props = (data.get('props') or {}).get('pageProps') or {}
        if isinstance(page_props, dict):
            if not style_color and isinstance(page_props.get('styleColor'), str):
                style_color = page_props['styleColor'].upper()
            _urls_from_page_props(page_props, style_color, seen, ordered)

    if len(ordered) < 2:
        _regex_fallback_urls(html, seen, ordered)

    return ordered[:16]
