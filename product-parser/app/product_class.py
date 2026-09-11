from __future__ import annotations

import re
from enum import Enum


class ProductClass(str, Enum):
    FOOTWEAR = 'footwear'
    CLOTHING = 'clothing'
    ACCESSORIES = 'accessories'
    UNKNOWN = 'unknown'


FOOTWEAR_TEXT = re.compile(
    r'\b(shoe|shoes|sneaker|sneakers|boot|boots|buty|obuw|obuwie|sandal|'
    r'sandals|loafer|loafers|trainer|trainers|footwear|espadrille|mokasyn|'
    r'oxford|oxfordy|szpilki|półbuty|kalosze|trampki|kapcie|clog|balerin|'
    r'sandały|obcas|heel|heels|slipper|slide|mule|derby|brogue)\b',
    re.I,
)

CLOTHING_TEXT = re.compile(
    r'\b(shirt|koszul|bluz|hoodie|dress|sukien|spodn|jeans|skirt|spódnic|'
    r'top|sweater|swetr|t-?shirt|garnitur|suit|marynark|kurt|jacket|coat|'
    r'płaszcz|spodenki|szorty|leggins|golf|polo|tank|body|kombinezon|'
    r'dres|piżam|bielizn|sweter|cardigan|kamizelka|vest|blazer|'
    r'leggings|tunik|bluzka|spódnica|spodnie|jeansy)\b',
    re.I,
)

ACCESSORIES_TEXT = re.compile(
    r'\b(bag|toreb|wallet|portfel|belt|pasek|hat|czapka|scarf|szalik|'
    r'glove|rękawic|skarpet|sock|socks|biżut|jewelry|watch|zegar|'
    r'okular|sunglasses|plecak|backpack|nerka|clutch|portmonetka)\b',
    re.I,
)

HINT_MAP = {
    'footwear': ProductClass.FOOTWEAR,
    'shoes': ProductClass.FOOTWEAR,
    'obuwie': ProductClass.FOOTWEAR,
    'clothing': ProductClass.CLOTHING,
    'clothes': ProductClass.CLOTHING,
    'ubrania': ProductClass.CLOTHING,
    'accessories': ProductClass.ACCESSORIES,
    'akcesoria': ProductClass.ACCESSORIES,
}


def detect_product_class(
    *,
    url: str | None = None,
    category: str | None = None,
    name: str | None = None,
    description: str | None = None,
    hint: str | None = None,
    is_footwear: bool = False,
) -> ProductClass:
    if is_footwear:
        return ProductClass.FOOTWEAR

    if hint:
        mapped = HINT_MAP.get(hint.strip().lower())
        if mapped:
            return mapped

    text = ' '.join(filter(None, [url, category, name, description]))
    if not text.strip():
        return ProductClass.UNKNOWN

    scores = {
        ProductClass.FOOTWEAR: len(FOOTWEAR_TEXT.findall(text)),
        ProductClass.CLOTHING: len(CLOTHING_TEXT.findall(text)),
        ProductClass.ACCESSORIES: len(ACCESSORIES_TEXT.findall(text)),
    }
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best

    if FOOTWEAR_TEXT.search(text):
        return ProductClass.FOOTWEAR

    return ProductClass.UNKNOWN
