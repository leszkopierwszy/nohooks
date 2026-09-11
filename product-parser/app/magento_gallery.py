from __future__ import annotations

import json
import re
from html import unescape
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .image_url_upgrade import upgrade_product_image_url

# Pełne URL-e i ścieżki względne z galerii Magento
_CATALOG_URL_ABS = re.compile(
    r'https?://[^"\s\'<>]+/media/catalog/product/[^"\s\'<>?#]+\.(?:jpe?g|png|webp)',
    re.I,
)
_CATALOG_PATH_REL = re.compile(
    r'(?:"|\\/)(/media/catalog/product/[^"\s\'<>?#]+\.(?:jpe?g|png|webp))',
    re.I,
)
_OPTI_WEBP_PATH = re.compile(
    r'(?:"|\\/)(/media/opti_image/webp/[^"\s\'<>?#]+\.(?:webp|jpe?g|png))',
    re.I,
)

# Klucze JSON galerii Magento (full > img > thumb)
_IMAGE_JSON_KEYS = ('full', 'img', 'large', 'main', 'zoom', 'image', 'thumb')


def _resolve_catalog_url(raw: str, base: str) -> str | None:
    if not raw or raw.startswith('data:'):
        return None
    cleaned = unescape(raw).strip().replace('\\/', '/')
    if cleaned.startswith('//'):
        cleaned = 'https:' + cleaned
    resolved = urljoin(base, cleaned) if not cleaned.startswith('http') else cleaned
    if '/media/catalog/product/' not in resolved.lower() and '/media/opti_image/' not in resolved.lower():
        return None
    return upgrade_product_image_url(resolved)


def _urls_from_json_value(value: Any, base: str, out: list[str]) -> None:
    if isinstance(value, str):
        url = _resolve_catalog_url(value, base)
        if url:
            out.append(url)
        return
    if isinstance(value, list):
        for item in value:
            _urls_from_json_value(item, base, out)
        return
    if not isinstance(value, dict):
        return

    for key in _IMAGE_JSON_KEYS:
        if key in value:
            _urls_from_json_value(value[key], base, out)

    if 'data' in value and isinstance(value['data'], list):
        for item in value['data']:
            _urls_from_json_value(item, base, out)

    if 'images' in value:
        _urls_from_json_value(value['images'], base, out)

    for nested in value.values():
        if isinstance(nested, (dict, list)):
            _urls_from_json_value(nested, base, out)


def _parse_magento_init_scripts(soup: BeautifulSoup, base: str) -> list[str]:
    urls: list[str] = []
    for script in soup.find_all('script', type='text/x-magento-init'):
        text = script.string or script.get_text() or ''
        if 'gallery' not in text and 'catalog/product' not in text:
            continue
        try:
            data = json.loads(text)
            _urls_from_json_value(data, base, urls)
        except json.JSONDecodeError:
            for match in _CATALOG_URL_ABS.finditer(text):
                url = _resolve_catalog_url(match.group(0), base)
                if url:
                    urls.append(url)
            for match in _CATALOG_PATH_REL.finditer(text):
                url = _resolve_catalog_url(match.group(1), base)
                if url:
                    urls.append(url)
    return urls


def _parse_inline_gallery_json(html: str, base: str) -> list[str]:
    urls: list[str] = []

    for match in _CATALOG_URL_ABS.finditer(html):
        url = _resolve_catalog_url(match.group(0), base)
        if url:
            urls.append(url)

    for match in _CATALOG_PATH_REL.finditer(html):
        url = _resolve_catalog_url(match.group(1), base)
        if url:
            urls.append(url)

    for match in _OPTI_WEBP_PATH.finditer(html):
        url = _resolve_catalog_url(match.group(1), base)
        if url:
            urls.append(url)

    # Bloki "images":[{...}] w skryptach (jsonConfig, spConfig)
    for block in re.finditer(
        r'"images"\s*:\s*(\[[\s\S]{20,8000}?\])',
        html,
        re.I,
    ):
        try:
            images = json.loads(block.group(1))
            _urls_from_json_value(images, base, urls)
        except json.JSONDecodeError:
            continue

    return urls


def _parse_data_attribute_gallery(soup: BeautifulSoup, base: str) -> list[str]:
    urls: list[str] = []
    for el in soup.select('[data-gallery-role="gallery-placeholder"], [data-mage-init]'):
        for attr in ('data-mage-init', 'data-gallery-images'):
            raw = el.get(attr)
            if not raw:
                continue
            try:
                data = json.loads(raw)
                _urls_from_json_value(data, base, urls)
            except json.JSONDecodeError:
                for match in _CATALOG_PATH_REL.finditer(raw):
                    url = _resolve_catalog_url(match.group(1), base)
                    if url:
                        urls.append(url)
    return urls


def extract_magento_gallery_urls(html: str, soup: BeautifulSoup, base: str) -> list[str]:
    """Wszystkie packshoty z galerii Magento (pełny rozmiar, bez cache)."""
    seen: set[str] = set()
    ordered: list[str] = []

    def add(url: str | None) -> None:
        if not url or url in seen:
            return
        seen.add(url)
        ordered.append(url)

    for source in (
        _parse_magento_init_scripts(soup, base),
        _parse_data_attribute_gallery(soup, base),
        _parse_inline_gallery_json(html, base),
    ):
        for url in source:
            add(url)

    return ordered
