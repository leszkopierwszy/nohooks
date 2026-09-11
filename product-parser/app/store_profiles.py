from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

from bs4 import BeautifulSoup


@dataclass(frozen=True)
class StoreImageProfile:
    """Reguły pobierania zdjęć produktu — profil Magento/Kazar vs domyślny."""

    id: str
    use_magento_gallery: bool = False
    use_packshot_sku_filter: bool = False
    use_packshot_sort: bool = False
    gallery_selectors: tuple[str, ...] = field(default_factory=tuple)
    prefer_cover_index_footwear: int = 3
    prefer_cover_index_default: int = 1


MAGENTO_GALLERY_SELECTORS = (
    '.splide__slide img',
    '.splide__slide source',
    '.splide__slide picture source',
    '.thumb-slider img',
    '.product-media img',
    '.product-media source',
    '[data-gallery-role="gallery-placeholder"] img',
    '[data-gallery-role="gallery-placeholder"] source',
    '.fotorama__stage img',
    '.fotorama__stage source',
    '.fotorama__nav__frame img',
    'img[itemprop="image"]',
    '[class*="gallery" i] img',
    '[data-gallery] img',
    '[data-product-image] img',
    '.productView-images img',
    '.product-detail-gallery img',
)

KAZAR_PROFILE = StoreImageProfile(
    id='kazar',
    use_magento_gallery=True,
    use_packshot_sku_filter=True,
    use_packshot_sort=True,
    gallery_selectors=MAGENTO_GALLERY_SELECTORS,
)

MAGENTO_PROFILE = StoreImageProfile(
    id='magento',
    use_magento_gallery=True,
    use_packshot_sku_filter=True,
    use_packshot_sort=True,
    gallery_selectors=MAGENTO_GALLERY_SELECTORS,
)

SHOPIFY_PROFILE = StoreImageProfile(
    id='shopify',
    use_magento_gallery=False,
    use_packshot_sku_filter=False,
    use_packshot_sort=False,
    gallery_selectors=(
        '.product__media img',
        '.product-gallery img',
        '[data-product-media] img',
        '.media-gallery img',
        'media-gallery img',
    ),
)

NIKE_GALLERY_SELECTORS = (
    '[data-testid="ImageCarousel"] img',
    '[data-testid^="Thumbnail"] img',
    '[data-testid="HeroImage"] img',
    '.product-imagery img',
    'img[src*="static.nike.com"]',
)

NIKE_PROFILE = StoreImageProfile(
    id='nike',
    use_magento_gallery=False,
    use_packshot_sku_filter=False,
    use_packshot_sort=False,
    gallery_selectors=NIKE_GALLERY_SELECTORS,
)

ZARA_GALLERY_SELECTORS = (
    'picture img',
    '[data-qa-qualifier="media-image"] img',
    '.product-detail-images img',
    'img[src*="static.zara.net"]',
)

ZARA_PROFILE = StoreImageProfile(
    id='zara',
    use_magento_gallery=False,
    use_packshot_sku_filter=False,
    use_packshot_sort=False,
    gallery_selectors=ZARA_GALLERY_SELECTORS,
)

DEFAULT_PROFILE = StoreImageProfile(
    id='default',
    use_magento_gallery=False,
    use_packshot_sku_filter=False,
    use_packshot_sort=False,
    gallery_selectors=(
        '.splide__slide img',
        '[data-gallery] img',
        '[class*="gallery" i] img',
        'img[itemprop="image"]',
    ),
)

# Hosty z potwierdzonym Magento / packshotami typu Kazar
_KAZAR_HOST = re.compile(r'(?:^|\.)kazar\.', re.I)

_NIKE_HOST = re.compile(
    r'(?:^|\.)(?:nike\.com|nike\.pl|nike\.de|nike\.fr|nike\.es|nike\.it|nike\.nl|nike\.be|nike\.gr)$',
    re.I,
)

_ZARA_HOST = re.compile(r'(?:^|\.)zara\.(?:com|net)$', re.I)

_MAGENTO_HOST = re.compile(
    r'(?:^|\.)(?:'
    r'wittchen|lomer|ginorossi|wojas|rylko|rylko-pl|'
    r'lasocki|ccc\.|modivo|eobuwie|'
    r'answear|showroom|bonprix|born2be|'
    r'medicine|sinsay|reserved|housebrand|cropp|mohito|'
    r')\.[a-z.]+$',
    re.I,
)

_SHOPIFY_HOST = re.compile(
    r'(?:^|\.)(?:'
    r'myshopify\.com|shopify\.com'
    r')$',
    re.I,
)

_MAGENTO_HTML_MARKERS = (
    'mage/gallery/gallery',
    '[data-gallery-role=gallery-placeholder]',
    'Magento_Catalog/js/product-gallery',
    'media/catalog/product',
)


def _html_looks_like_magento(html: str) -> bool:
    return any(marker in html for marker in _MAGENTO_HTML_MARKERS)


def resolve_store_image_profile(url: str, html: str, soup: BeautifulSoup) -> StoreImageProfile:
    host = (urlparse(url).netloc or '').lower()

    if _KAZAR_HOST.search(host):
        return KAZAR_PROFILE

    if _NIKE_HOST.search(host) or 'static.nike.com/a/images' in html:
        return NIKE_PROFILE

    if _ZARA_HOST.search(host) or 'static.zara.net/assets/public' in html:
        return ZARA_PROFILE

    if _SHOPIFY_HOST.search(host) or 'cdn.shopify.com' in html:
        return SHOPIFY_PROFILE

    if _MAGENTO_HOST.search(host) or _html_looks_like_magento(html):
        return MAGENTO_PROFILE

    if soup.select('[data-gallery-role="gallery-placeholder"], .splide__slide, .fotorama__stage'):
        return MAGENTO_PROFILE

    return DEFAULT_PROFILE
