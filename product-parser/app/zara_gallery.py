from __future__ import annotations

import re

ZARA_PRODUCT_REF = re.compile(r'/p(\d+)\.html', re.I)

ZARA_GALLERY_JPG = re.compile(
    r'https://static\.zara\.net/assets/public/'
    r'[a-f0-9/]+?/(?P<shot>[0-9]+-[a-z0-9-]+)/(?P=shot)\.jpg',
    re.I,
)


def zara_product_ref(page_url: str) -> str | None:
    match = ZARA_PRODUCT_REF.search(page_url)
    return match.group(1) if match else None


def extract_zara_gallery_urls(html: str, page_url: str, *, limit: int = 24) -> list[str]:
    """Zdjęcia produktu z HTML Zary (po przejściu weryfikacji antybotowej)."""
    ref = zara_product_ref(page_url)
    seen: set[str] = set()
    urls: list[str] = []

    for match in ZARA_GALLERY_JPG.finditer(html):
        url = match.group(0)
        if ref and ref not in url:
            continue
        if url in seen:
            continue
        seen.add(url)
        urls.append(url)
        if len(urls) >= limit:
            break

    return urls
