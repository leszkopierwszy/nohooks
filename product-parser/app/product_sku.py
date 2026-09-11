from __future__ import annotations

import re

# Kazar / Magento: 65638-01-N0 w URL produktu lub pliku zdjęcia
SKU_IN_PATH = re.compile(
    r'(\d{4,6}-\d{2}-[A-Z0-9]{1,4}(?:-[A-Z0-9]{1,3})?)(?:\.html)?',
    re.I,
)
ZARA_REF_IN_PATH = re.compile(r'/p(\d+)\.html', re.I)
SKU_IN_IMAGE = re.compile(
    r'/(\d{4,6}-\d{2}-[A-Z0-9]{1,4}(?:-[A-Z0-9]{1,3})?)_[^/]+\.(?:jpe?g|png|webp)',
    re.I,
)

MODEL_FILENAME = re.compile(
    r'(?:^|/)(?:[^/]*(?:_model\d*|model\d*|_model\.|model\.|_02model\d*))(?:\?|$)',
    re.I,
)

PACKSHOT_FILENAME = re.compile(
    r'_(\d{2})\.(?:jpe?g|png|webp)(?:\?|$)',
    re.I,
)


def extract_primary_sku(
    page_url: str,
    *,
    ld_sku: str | None = None,
    image_urls: list[str] | None = None,
) -> str | None:
    if ld_sku:
        cleaned = str(ld_sku).strip().upper()
        if re.match(r'^\d{4,6}-\d{2}-[A-Z0-9]', cleaned, re.I):
            return cleaned

    zara_ref = ZARA_REF_IN_PATH.search(page_url)
    if zara_ref:
        return zara_ref.group(1)

    matches = SKU_IN_PATH.findall(page_url)
    if matches:
        return matches[-1].upper()

    if image_urls:
        counts: dict[str, int] = {}
        for url in image_urls:
            m = SKU_IN_IMAGE.search(url)
            if m:
                sku = m.group(1).upper()
                counts[sku] = counts.get(sku, 0) + 1
        if counts:
            return max(counts, key=counts.get)

    return None


def url_belongs_to_sku(url: str, sku: str) -> bool:
    if not sku:
        return True
    token = sku.upper()
    path = url.upper()
    return token in path


def is_model_shot_url(url: str) -> bool:
    return bool(MODEL_FILENAME.search(url))


def is_packshot_url(url: str) -> bool:
    if is_model_shot_url(url):
        return False
    return bool(PACKSHOT_FILENAME.search(url))


def packshot_index(url: str) -> int | None:
    match = PACKSHOT_FILENAME.search(url)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def preferred_cover_index(is_footwear: bool) -> int:
    """Kazar i podobne: _03 = bok pod kątem."""
    return 3 if is_footwear else 1


def should_apply_sku_filter(
    entries: list[dict],
    primary_sku: str | None,
    *,
    min_matches: int = 2,
    min_ratio: float = 0.35,
) -> bool:
    """SKU tylko gdy większość URL-i naprawdę należy do tego produktu (unikaj 1 złego zdjęcia)."""
    if not primary_sku:
        return False
    urls = [e.get('url') for e in entries if e.get('url')]
    if not urls:
        return False
    matching = sum(1 for u in urls if url_belongs_to_sku(u, primary_sku))
    if matching < min_matches:
        return False
    return matching >= len(urls) * min_ratio
