from __future__ import annotations

import re

SEASON_KEYWORDS = {
    'wiosna': re.compile(r'\b(wiosn\w*|spring|ss[\s/-]?\d{2,4})\b', re.I),
    'lato': re.compile(r'\b(lato|summer)\b', re.I),
    'jesien': re.compile(r'\b(jesie[nń]\w*|autumn|fall|fw[\s/-]?\d{2,4})\b', re.I),
    'zima': re.compile(r'\b(zim\w*|winter)\b', re.I),
    'caloroczny': re.compile(
        r'\b(całoroczn\w*|caloroczn\w*|all[\s-]?season|year[\s-]?round)\b',
        re.I,
    ),
}


def detect_season_from_text(*texts: str | None) -> str | None:
    hay = ' '.join(t for t in texts if t)
    if not hay.strip():
        return None

    explicit = re.search(
        r'(?:sezon|season)[:\s]+([a-ząćęłńóśźż]+)',
        hay,
        re.I,
    )
    if explicit:
        token = explicit.group(1).lower()
        for key in SEASON_KEYWORDS:
            if key in token or token in key:
                return key

    scores: dict[str, int] = {}
    for key, pattern in SEASON_KEYWORDS.items():
        scores[key] = len(pattern.findall(hay))

    best = max(scores, key=scores.get)
    if scores.get(best, 0) > 0:
        return best

    return None
