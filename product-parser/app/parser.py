from __future__ import annotations

import json
import re
from html import unescape
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from .image_filter import filter_product_image_urls
from .image_url_upgrade import upgrade_product_image_url
from .magento_gallery import extract_magento_gallery_urls
from .nike_gallery import extract_nike_gallery_urls
from .shopify_gallery import extract_shopify_gallery_urls
from .product_sku import (
    extract_primary_sku,
    is_model_shot_url,
    is_packshot_url,
    should_apply_sku_filter,
    url_belongs_to_sku,
)
from .season_detect import detect_season_from_text
from .store_profiles import DEFAULT_PROFILE, resolve_store_image_profile
from .zara_gallery import extract_zara_gallery_urls
CURRENCY_MAP = {
    'PLN': 'PLN',
    'ZŁ': 'PLN',
    'ZL': 'PLN',
    'EUR': 'EUR',
    '€': 'EUR',
    'USD': 'USD',
    'US$': 'USD',
    '$': 'USD',
    'GBP': 'GBP',
    '£': 'GBP',
    'CHF': 'CHF',
    'CZK': 'CZK',
}


def _clean_text(value: str | None, max_len: int = 2000) -> str | None:
    if not value or not isinstance(value, str):
        return None
    text = unescape(re.sub(r'\s+', ' ', value)).strip()
    if not text:
        return None
    return text[:max_len] if len(text) > max_len else text


def _resolve_url(candidate: str | None, base: str) -> str | None:
    if not candidate or not isinstance(candidate, str):
        return None
    candidate = candidate.strip()
    if not candidate:
        return None
    if candidate.startswith('//'):
        parsed = urlparse(base)
        return f'{parsed.scheme}:{candidate}'
    return urljoin(base, candidate)


def _meta_content(soup: BeautifulSoup, *keys: str) -> str | None:
    for key in keys:
        tag = soup.find('meta', property=key) or soup.find('meta', attrs={'name': key})
        if tag and tag.get('content'):
            return _clean_text(tag['content'])
    return None


def _json_ld_objects(soup: BeautifulSoup) -> list[dict[str, Any]]:
    objects: list[dict[str, Any]] = []
    for script in soup.find_all('script', type='application/ld+json'):
        raw = script.string or script.get_text()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    objects.append(item)
        elif isinstance(data, dict):
            if '@graph' in data and isinstance(data['@graph'], list):
                for item in data['@graph']:
                    if isinstance(item, dict):
                        objects.append(item)
            objects.append(data)
    return objects


def _is_product_type(obj: dict[str, Any]) -> bool:
    t = obj.get('@type')
    if isinstance(t, str):
        return 'product' in t.lower()
    if isinstance(t, list):
        return any(isinstance(x, str) and 'product' in x.lower() for x in t)
    return False


def _pick_product_ld(objects: list[dict[str, Any]]) -> dict[str, Any] | None:
    for obj in objects:
        if _is_product_type(obj):
            return obj
    for obj in objects:
        if obj.get('name') and (obj.get('offers') or obj.get('image')):
            return obj
    return None


def _brand_from_ld(product: dict[str, Any]) -> str | None:
    brand = product.get('brand')
    if isinstance(brand, str):
        return _clean_text(brand, 128)
    if isinstance(brand, dict):
        return _clean_text(brand.get('name') or brand.get('@id'), 128)
    return None


def _images_from_ld(product: dict[str, Any], base: str) -> list[str]:
    urls: list[str] = []
    image = product.get('image')
    if isinstance(image, str):
        urls.append(image)
    elif isinstance(image, list):
        for item in image:
            if isinstance(item, str):
                urls.append(item)
            elif isinstance(item, dict) and item.get('url'):
                urls.append(str(item['url']))
    elif isinstance(image, dict) and image.get('url'):
        urls.append(str(image['url']))
    return [
        upgrade_product_image_url(resolved)
        for u in urls
        if (resolved := _resolve_url(u, base))
    ]


def _parse_price_value(raw: Any) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw) if raw > 0 else None
    if not isinstance(raw, str):
        return None
    text = raw.replace('\xa0', ' ').strip()
    match = re.search(r'(\d[\d\s.,]*)', text)
    if not match:
        return None
    num = match.group(1).replace(' ', '').replace(',', '.')
    parts = num.split('.')
    if len(parts) > 2:
        num = ''.join(parts[:-1]) + '.' + parts[-1]
    try:
        value = float(num)
        return value if value > 0 else None
    except ValueError:
        return None


def _currency_from_text(text: str | None) -> str | None:
    if not text:
        return None
    upper = text.upper()
    for token, code in CURRENCY_MAP.items():
        if token in upper:
            return code
    if re.search(r'\bPLN\b', upper):
        return 'PLN'
    if re.search(r'\bEUR\b', upper) or '€' in text:
        return 'EUR'
    if re.search(r'\bUSD\b', upper):
        return 'USD'
    return None


def _offers_from_ld(product: dict[str, Any]) -> tuple[float | None, str | None]:
    offers = product.get('offers')
    if isinstance(offers, list) and offers:
        offers = offers[0]
    if not isinstance(offers, dict):
        return None, None
    price = _parse_price_value(offers.get('price') or offers.get('lowPrice') or offers.get('highPrice'))
    currency = _clean_text(str(offers.get('priceCurrency') or ''), 8)
    if currency:
        currency = currency.upper()
    return price, currency


def _breadcrumb_parts(soup: BeautifulSoup) -> list[str]:
    crumb = soup.select_one('nav[aria-label*="breadcrumb" i], .breadcrumb, [class*="breadcrumb" i]')
    if not crumb:
        return []
    parts = [_clean_text(el.get_text(), 64) for el in crumb.find_all(['a', 'span', 'li'])]
    return [p for p in parts if p]


def _product_attribute_text(soup: BeautifulSoup) -> str:
    chunks: list[str] = []
    for row in soup.select(
        'table tr, .additional-attributes tr, '
        '[class*="product-attribute" i] tr, dl.product-details dt, dl.product-details dd'
    ):
        text = _clean_text(row.get_text(), 200)
        if text:
            chunks.append(text)
    for block in soup.select('[class*="attribute" i], [data-attribute-code]'):
        text = _clean_text(block.get_text(), 120)
        if text and len(text) < 80:
            chunks.append(text)
    return ' '.join(chunks[:40])


def _color_from_page(soup: BeautifulSoup, product_ld: dict[str, Any] | None) -> str | None:
    if product_ld:
        color = product_ld.get('color')
        if isinstance(color, str):
            cleaned = _clean_text(color, 64)
            if cleaned:
                return cleaned

    attr_hay = _product_attribute_text(soup).lower()
    for pattern in (
        r'kolor[:\s]+([a-ząćęłńóśźż0-9 /\-]+)',
        r'colour[:\s]+([a-z0-9 /\-]+)',
        r'color[:\s]+([a-z0-9 /\-]+)',
    ):
        match = re.search(pattern, attr_hay, re.I)
        if match:
            return _clean_text(match.group(1), 64)

    for el in soup.select('[class*="swatch" i][aria-label], [class*="color" i][title]'):
        label = el.get('aria-label') or el.get('title')
        cleaned = _clean_text(str(label or ''), 64)
        if cleaned and len(cleaned) < 40:
            return cleaned

    return None


def _season_from_page(
    soup: BeautifulSoup,
    *,
    name: str | None,
    description: str | None,
    category: str | None,
    url: str,
) -> str | None:
    crumbs = _breadcrumb_parts(soup)
    attrs = _product_attribute_text(soup)
    return detect_season_from_text(name, description, category, url, ' '.join(crumbs), attrs)


def _category_from_ld(product: dict[str, Any], soup: BeautifulSoup) -> str | None:
    cat = product.get('category')
    if isinstance(cat, str):
        return _clean_text(cat, 255)
    if isinstance(cat, list) and cat:
        return _clean_text(str(cat[-1]), 255)
    crumb = soup.select_one('nav[aria-label*="breadcrumb" i], .breadcrumb, [class*="breadcrumb" i]')
    if crumb:
        parts = [_clean_text(el.get_text(), 64) for el in crumb.find_all(['a', 'span', 'li'])]
        parts = [p for p in parts if p]
        if parts:
            return parts[-1]
    return None


def _h1_name(soup: BeautifulSoup) -> str | None:
    h1 = soup.find('h1')
    if h1:
        return _clean_text(h1.get_text(), 255)
    return None


def _largest_from_srcset(srcset: str, base: str) -> str | None:
    best_url: str | None = None
    best_w = -1
    for part in srcset.split(','):
        chunk = part.strip()
        if not chunk:
            continue
        tokens = chunk.split()
        candidate = _resolve_url(tokens[0], base)
        if not candidate:
            continue
        width = 0
        for token in tokens[1:]:
            if token.endswith('w'):
                try:
                    width = int(token[:-1])
                except ValueError:
                    width = 0
                break
        if width > best_w:
            best_w = width
            best_url = candidate
    return best_url


def _image_src_from_tag(tag, base: str) -> str | None:
    zoom = tag.get('data-zoom-image')
    if zoom:
        resolved = _resolve_url(zoom, base)
        if resolved:
            return upgrade_product_image_url(resolved)

    srcset = tag.get('data-srcset') or tag.get('srcset')
    if srcset:
        largest = _largest_from_srcset(srcset, base)
        if largest:
            return upgrade_product_image_url(largest)

    for attr in ('data-original', 'data-src', 'data-lazy-src', 'src'):
        raw = tag.get(attr)
        if raw:
            resolved = _resolve_url(raw, base)
            if resolved:
                return upgrade_product_image_url(resolved)
    return None


def _alt_from_tag(tag) -> str | None:
    for attr in ('alt', 'title', 'aria-label', 'data-alt'):
        value = tag.get(attr)
        if value and isinstance(value, str):
            cleaned = _clean_text(value, 200)
            if cleaned:
                return cleaned
    return None


RELATED_ANCESTOR = re.compile(
    r'(product-item-photo|product-item-info|products-related|products-upsell|'
    r'products-crosssell|block-related|block-upsell|block-crosssell|'
    r'product-items|widget-product-grid|complete-the-look|lookbook-grid|'
    r'product-recommendations|carousel-products)',
    re.I,
)

FALLBACK_SELECTORS = (
    '.product-info-main img',
    '.column.main .product-info-main img',
    '[class*="product" i] img',
)


def _tag_in_related_block(tag) -> bool:
    parent = tag.parent
    depth = 0
    while parent is not None and depth < 12:
        classes = ' '.join(parent.get('class') or [])
        element_id = parent.get('id') or ''
        hay = f'{classes} {element_id}'
        if RELATED_ANCESTOR.search(hay):
            return True
        parent = parent.parent
        depth += 1
    return False


def _collect_from_tags(tags, base: str, seen: set[str]) -> list[dict[str, str | None]]:
    entries: list[dict[str, str | None]] = []
    for tag in tags:
        if _tag_in_related_block(tag):
            continue
        resolved = _image_src_from_tag(tag, base)
        if not resolved or resolved in seen:
            continue
        path = (urlparse(resolved).path or '').lower()
        if re.search(r'(logo|icon|sprite|badge|payment|trust|banner|avatar|pixel)', path):
            continue
        if not re.search(r'\.(jpe?g|png|webp)(?:\?|$)', path, re.I):
            continue
        seen.add(resolved)
        entries.append({'url': resolved, 'alt': _alt_from_tag(tag)})
    return entries


def _images_from_dom(
    soup: BeautifulSoup,
    base: str,
    *,
    gallery_selectors: tuple[str, ...],
) -> list[dict[str, str | None]]:
    seen: set[str] = set()
    entries: list[dict[str, str | None]] = []

    for selector in gallery_selectors:
        tags = soup.select(selector)
        if tags:
            entries.extend(_collect_from_tags(tags, base, seen))

    if len(entries) < 2:
        for selector in FALLBACK_SELECTORS:
            entries.extend(_collect_from_tags(soup.select(selector), base, seen))

    return entries


def _filter_entries_for_product(
    entries: list[dict[str, str | None]],
    *,
    primary_sku: str | None,
    packshots_only: bool = True,
) -> list[dict[str, str | None]]:
    out: list[dict[str, str | None]] = []
    for entry in entries:
        url = entry.get('url')
        if not url:
            continue
        if primary_sku and not url_belongs_to_sku(url, primary_sku):
            continue
        if packshots_only and is_model_shot_url(url):
            continue
        if packshots_only and primary_sku and not is_packshot_url(url) and not is_model_shot_url(url):
            # inne ujęcia tego samego SKU (np. bez _01) — zostaw
            pass
        out.append(entry)
    return out


def _sort_packshot_entries(entries: list[dict[str, str | None]], *, is_footwear: bool) -> list[dict[str, str | None]]:
    from .product_sku import packshot_index, preferred_cover_index

    prefer = preferred_cover_index(is_footwear)

    def sort_key(entry: dict[str, str | None]) -> tuple[int, int]:
        url = entry.get('url') or ''
        idx = packshot_index(url)
        if idx is None:
            return (2, 99)
        dist = abs(idx - prefer)
        return (0, dist)

    packshots = [e for e in entries if is_packshot_url(e.get('url') or '')]
    if len(packshots) >= 2:
        return sorted(packshots, key=sort_key)
    if packshots:
        non_model = [
            e for e in entries if not is_model_shot_url(e.get('url') or '')
        ]
        return sorted(non_model or packshots, key=sort_key)
    return entries


def _merge_image_entries(entries: list[dict[str, str | None]]) -> list[dict[str, str | None]]:
    by_url: dict[str, dict[str, str | None]] = {}
    for entry in entries:
        url = entry.get('url')
        if not url:
            continue
        alt = entry.get('alt')
        if url not in by_url:
            by_url[url] = {'url': url, 'alt': alt}
        elif alt and not by_url[url].get('alt'):
            by_url[url]['alt'] = alt
    return list(by_url.values())


def _unique_urls(urls: list[str], limit: int = 16) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        out.append(url)
        if len(out) >= limit:
            break
    return out


def parse_product_page(url: str, html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, 'lxml')
    profile = resolve_store_image_profile(url, html, soup)
    ld_objects = _json_ld_objects(soup)
    product_ld = _pick_product_ld(ld_objects)

    name = _meta_content(soup, 'og:title', 'twitter:title') or _h1_name(soup)
    description = _meta_content(soup, 'og:description', 'description', 'twitter:description')
    brand = None
    image_entries: list[dict[str, str | None]] = []
    price: float | None = None
    currency: str | None = None
    size: str | None = None
    category: str | None = None

    if product_ld:
        name = _clean_text(str(product_ld.get('name') or ''), 255) or name
        description = _clean_text(str(product_ld.get('description') or ''), 2000) or description
        brand = _brand_from_ld(product_ld)
        for img_url in _images_from_ld(product_ld, url):
            image_entries.append({'url': img_url, 'alt': None})
        price, currency = _offers_from_ld(product_ld)
        category = _category_from_ld(product_ld, soup)
        sku = product_ld.get('sku') or product_ld.get('mpn')
        if sku and not size:
            size = _clean_text(str(sku), 16)

    if profile.use_magento_gallery:
        for img_url in extract_magento_gallery_urls(html, soup, url):
            image_entries.append({'url': img_url, 'alt': None})
    elif profile.id == 'shopify':
        for img_url in extract_shopify_gallery_urls(html, soup, url):
            image_entries.append({'url': img_url, 'alt': None})
    elif profile.id == 'nike':
        for img_url in extract_nike_gallery_urls(html, soup, url):
            image_entries.append({'url': img_url, 'alt': None})
    elif profile.id == 'zara':
        for img_url in extract_zara_gallery_urls(html, url):
            image_entries.append({'url': img_url, 'alt': None})

    if profile.id != 'zara' or len(image_entries) < 2:
        image_entries.extend(
            _images_from_dom(soup, url, gallery_selectors=profile.gallery_selectors)
        )

    # og:image tylko gdy brak galerii (Nike/Magento mają pełną listę w JSON)
    if profile.id not in ('nike', 'magento', 'kazar', 'zara'):
        og_image = _meta_content(soup, 'og:image', 'og:image:secure_url', 'twitter:image')
        if og_image:
            resolved = _resolve_url(og_image, url)
            if resolved and resolved not in {e['url'] for e in image_entries if e.get('url')}:
                image_entries.append({'url': resolved, 'alt': None})
    elif profile.id == 'nike':
        og_image = _meta_content(soup, 'og:image', 'og:image:secure_url', 'twitter:image')
        if og_image and len(image_entries) < 2:
            from .nike_gallery import upgrade_nike_image_url

            resolved = upgrade_nike_image_url(_resolve_url(og_image, url) or '')
            if resolved and resolved not in {e['url'] for e in image_entries if e.get('url')}:
                image_entries.append({'url': resolved, 'alt': None})

    image_entries = _merge_image_entries(image_entries)
    image_urls = [e['url'] for e in image_entries if e.get('url')]

    ld_sku = None
    if product_ld:
        raw_sku = product_ld.get('sku') or product_ld.get('mpn')
        if raw_sku:
            ld_sku = _clean_text(str(raw_sku), 32)

    primary_sku = extract_primary_sku(url, ld_sku=ld_sku, image_urls=image_urls)
    sku_for_filter = (
        primary_sku
        if profile.use_packshot_sku_filter
        and should_apply_sku_filter(image_entries, primary_sku)
        else None
    )
    is_footwear_page = bool(
        re.search(
            r'\b(buty|obuw|shoe|sneaker|boot|szpilki|półbuty|sandal|loafer)\b',
            ' '.join(filter(None, [name, description, category, url])),
            re.I,
        )
    )
    image_entries = _filter_entries_for_product(
        image_entries,
        primary_sku=sku_for_filter,
        packshots_only=profile.use_packshot_sku_filter,
    )
    if profile.use_packshot_sort:
        image_entries = _sort_packshot_entries(image_entries, is_footwear=is_footwear_page)
    image_urls = [e['url'] for e in image_entries if e.get('url')]

    if not price:
        price_meta = _meta_content(soup, 'product:price:amount', 'og:price:amount')
        price = _parse_price_value(price_meta)
    if not currency:
        currency = _currency_from_text(
            _meta_content(soup, 'product:price:currency', 'og:price:currency') or ''
        )

    if name and brand and name.lower().startswith(brand.lower()):
        name = _clean_text(name[len(brand) :].lstrip(' -|–'), 255)

    if profile.id == 'zara' and not brand:
        brand = 'Zara'

    color = _color_from_page(soup, product_ld)
    season = _season_from_page(
        soup,
        name=name,
        description=description,
        category=category,
        url=url,
    )

    return {
        'source_url': url,
        'name': name,
        'brand': brand,
        'description': description,
        'color': color,
        'size': size,
        'category': category,
        'season': season,
        'purchase_price': price,
        'purchase_currency': currency,
        'current_value': price,
        'primary_sku': primary_sku,
        'store_profile': profile.id,
        'image_entries': image_entries[:16],
        'image_urls': [
            upgrade_product_image_url(u)
            for u in filter_product_image_urls(_unique_urls(image_urls, 16))[:16]
        ],
    }
