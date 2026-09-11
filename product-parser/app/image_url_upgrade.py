from __future__ import annotations

import re
from urllib.parse import urlparse, urlunparse

MAGENTO_CACHE = re.compile(r'/media/catalog/product/cache/[a-f0-9]{20,}/', re.I)
OPTI_WEBP = re.compile(r'/media/opti_image/webp/', re.I)


def upgrade_product_image_url(url: str) -> str:
    """Magento/Kazar: usuń segment cache i webp — pełny rozmiar z /catalog/product/."""
    if not url:
        return url

    if 'static.zara.net/assets/public/' in url.lower():
        parsed = urlparse(url)
        if not parsed.query:
            return f'{url}?w=1920'
        if 'w=' not in parsed.query:
            sep = '&' if parsed.query else ''
            return f'{url}{sep}w=1920'
        return url

    parsed = urlparse(url)
    path = parsed.path or ''

    path = MAGENTO_CACHE.sub('/media/catalog/product/', path)
    path = OPTI_WEBP.sub('/media/catalog/product/', path)

    if path.lower().endswith('.webp'):
        path = path[:-5] + '.jpg'

    return urlunparse(parsed._replace(path=path))
