from __future__ import annotations

import re
from typing import TYPE_CHECKING

from .product_class import ProductClass

if TYPE_CHECKING:
    from .image_pixels import PixelAnalysis

FOOTWEAR_URL = re.compile(
    r'\b(shoe|shoes|sneaker|boot|buty|obuw|obuwie|sandal|loafer|trainer|'
    r'footwear|espadrille|mokasyn|oxford|szpilki|półbut|kalosz|trampk|'
    r'heel|sole|on-?foot|pair-?shot|obcas)\b',
    re.I,
)

CLOTHING_URL = re.compile(
    r'\b(shirt|koszul|bluz|hoodie|dress|sukien|spodn|jeans|skirt|spódnic|'
    r'top|sweater|swetr|t-?shirt|garnitur|suit|marynark|kurt|jacket|coat|'
    r'płaszcz|spodenki|szorty|leggins|golf|polo|tunik|bluzka|look-?set|'
    r'outfit|styling|complete-?the-?look|total-?look)\b',
    re.I,
)

ACCESSORIES_URL = re.compile(
    r'\b(bag|toreb|wallet|portfel|belt|pasek|hat|czapka|scarf|szalik|'
    r'glove|rękawic|skarpet|sock|plecak|backpack|nerka|clutch|'
    r'portmonetka|akcesori)\b',
    re.I,
)

# Widoki typowe dla innych kategorii — odrzucamy przy obuwiu
NON_FOOTWEAR_URL = re.compile(
    r'\b(dress|sukien|bag|toreb|koszul|shirt|spodn|pants|jeans|skirt|'
    r'kurt|jacket|coat|hat|czapka|lookbook|outfit|styling|total-?look|'
    r'complete-?look|model-?look)\b',
    re.I,
)

NON_CLOTHING_URL = re.compile(
    r'\b(shoe|shoes|boot|buty|obuw|sneaker|sole|on-?foot|heel|'
    r'sandal|loafer|trainer|footwear)\b',
    re.I,
)


def classify_image_url(url: str, alt: str | None = None) -> set[ProductClass]:
    hay = f'{url} {(alt or "")}'.strip()
    found: set[ProductClass] = set()

    if FOOTWEAR_URL.search(hay):
        found.add(ProductClass.FOOTWEAR)
    if CLOTHING_URL.search(hay):
        found.add(ProductClass.CLOTHING)
    if ACCESSORIES_URL.search(hay):
        found.add(ProductClass.ACCESSORIES)

    return found


def image_matches_product_class(
    url: str,
    product_class: ProductClass,
    *,
    alt: str | None = None,
    pixels: PixelAnalysis | None = None,
) -> tuple[bool, str]:
    if product_class == ProductClass.UNKNOWN:
        return True, 'class:skip'

    signals = classify_image_url(url, alt)
    hay = f'{url} {(alt or "")}'

    if product_class == ProductClass.FOOTWEAR:
        if NON_FOOTWEAR_URL.search(hay):
            return False, 'class:non-footwear-url'
        if ProductClass.CLOTHING in signals or ProductClass.ACCESSORIES in signals:
            if ProductClass.FOOTWEAR not in signals:
                return False, 'class:other-product-url'

        if pixels:
            if pixels.shoe_view_hint == 'on_foot' and pixels.has_person:
                return True, 'class:shoe-on-foot'
            if pixels.portrait_model and pixels.skin_ratio > 0.08:
                if ProductClass.FOOTWEAR not in signals and not pixels.shoe_side_angle:
                    return False, 'class:px-outfit-model'
            if pixels.is_product_only and pixels.shoe_view_hint in (
                'side',
                'side_angle',
                'front',
                'top',
            ):
                return True, 'class:px-shoe-packshot'

        if ProductClass.FOOTWEAR in signals:
            return True, 'class:footwear-url'
        if not signals:
            return True, 'class:footwear-sku-packshot'
        return False, 'class:footwear-conflict'

    if product_class == ProductClass.CLOTHING:
        if NON_CLOTHING_URL.search(hay) and ProductClass.CLOTHING not in signals:
            return False, 'class:footwear-only-url'
        if ProductClass.FOOTWEAR in signals and ProductClass.CLOTHING not in signals:
            return False, 'class:shoe-not-garment'
        if ProductClass.ACCESSORIES in signals and ProductClass.CLOTHING not in signals:
            return False, 'class:accessory-not-garment'

        if (
            pixels
            and pixels.is_product_only
            and pixels.shoe_view_hint in ('side', 'side_angle', 'front', 'top')
            and pixels.skin_ratio < 0.02
            and not pixels.portrait_model
            and ProductClass.CLOTHING not in signals
        ):
            return False, 'class:px-likely-shoe'

        if ProductClass.CLOTHING in signals:
            return True, 'class:clothing-url'
        return True, 'class:clothing-unknown-url'

    if product_class == ProductClass.ACCESSORIES:
        if ProductClass.FOOTWEAR in signals or ProductClass.CLOTHING in signals:
            if ProductClass.ACCESSORIES not in signals:
                return False, 'class:not-accessory'
        if ProductClass.ACCESSORIES in signals:
            return True, 'class:accessory-url'
        return True, 'class:accessory-unknown-url'

    return True, 'class:default'
