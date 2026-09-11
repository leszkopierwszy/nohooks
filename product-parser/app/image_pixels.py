from __future__ import annotations

import io
from dataclasses import dataclass

from PIL import Image

SKIN_Y_MIN, SKIN_Y_MAX = 80, 255
SKIN_CB_MIN, SKIN_CB_MAX = 85, 135
SKIN_CR_MIN, SKIN_CR_MAX = 135, 180


@dataclass
class PixelAnalysis:
    has_person: bool
    is_product_only: bool
    skin_ratio: float
    fg_ratio: float
    shoe_side_angle: bool
    confidence: float
    portrait_model: bool = False
    uniform_bg_ratio: float = 0.0
    shoe_view_hint: str = 'unknown'
    shoe_is_pair: bool = False
    pair_confidence: float = 0.0


def _rgb_to_ycbcr(r: int, g: int, b: int) -> tuple[int, int, int]:
    y = int(16 + (65.481 * r + 128.553 * g + 24.966 * b) / 255)
    cb = int(128 + (-37.797 * r - 74.203 * g + 112.0 * b) / 255)
    cr = int(128 + (112.0 * r - 93.786 * g - 18.214 * b) / 255)
    return y, cb, cr


def _is_skin_pixel(r: int, g: int, b: int) -> bool:
    y, cb, cr = _rgb_to_ycbcr(r, g, b)
    return (
        SKIN_Y_MIN <= y <= SKIN_Y_MAX
        and SKIN_CB_MIN <= cb <= SKIN_CB_MAX
        and SKIN_CR_MIN <= cr <= SKIN_CR_MAX
    )


def _edge_background(img: Image.Image, w: int, h: int) -> tuple[int, int, int]:
    pixels = img.load()
    samples: list[tuple[int, int, int]] = []
    step = max(1, min(w, h) // 20)
    for x in range(0, w, step):
        samples.append(pixels[x, 0][:3])
        samples.append(pixels[x, h - 1][:3])
    for y in range(0, h, step):
        samples.append(pixels[0, y][:3])
        samples.append(pixels[w - 1, y][:3])
    return (
        sum(s[0] for s in samples) // len(samples),
        sum(s[1] for s in samples) // len(samples),
        sum(s[2] for s in samples) // len(samples),
    )


def _color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def _dual_fg_runs(proj: list[int], width: int, fg: int) -> bool:
    """Dwa oddzielne „górki” masy na osi X — typowe dla pary butów obok siebie."""
    if fg < 80 or not proj:
        return False
    peak_thresh = max(4, int(max(proj) * 0.22))
    runs: list[tuple[int, int]] = []
    in_run = False
    start = 0
    for x in range(width):
        if proj[x] >= peak_thresh:
            if not in_run:
                start = x
                in_run = True
        elif in_run:
            runs.append((start, x - 1))
            in_run = False
    if in_run:
        runs.append((start, width - 1))

    min_run_w = max(12, int(width * 0.07))
    wide = [r for r in runs if (r[1] - r[0] + 1) >= min_run_w]
    if len(wide) < 2:
        return False
    wide.sort(key=lambda r: r[0])
    gap = wide[1][0] - wide[0][1]
    return gap >= max(8, int(width * 0.025))


def analyze_image_pixels(raw: bytes) -> PixelAnalysis:
    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        return PixelAnalysis(False, False, 0.0, 0.0, False, 0.0)

    if img.mode != 'RGB':
        img = img.convert('RGB')

    img.thumbnail((384, 384), Image.Resampling.LANCZOS)
    w, h = img.size
    pixels = img.load()
    bg = _edge_background(img, w, h)
    bg_thresh = 32.0

    fg = 0
    skin = 0
    skin_upper = 0
    skin_lower = 0
    skin_center = 0
    bg_like = 0
    min_x, min_y, max_x, max_y = w, h, 0, 0
    left_mass = 0
    right_mass = 0
    upper_fg = 0
    lower_fg = 0

    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y][:3]
            if _color_distance((r, g, b), bg) < bg_thresh:
                bg_like += 1
                continue
            fg += 1
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
            if y < h * 0.5:
                upper_fg += 1
            else:
                lower_fg += 1
            if x < w * 0.42:
                left_mass += 1
            elif x > w * 0.58:
                right_mass += 1
            if _is_skin_pixel(r, g, b):
                skin += 1
                if y < h * 0.55:
                    skin_upper += 1
                if y > h * 0.45:
                    skin_lower += 1
                if w * 0.18 < x < w * 0.82 and h * 0.12 < y < h * 0.88:
                    skin_center += 1

    total = w * h
    if fg < 60:
        return PixelAnalysis(False, False, 0.0, 0.0, False, 0.0)

    fg_ratio = fg / total
    uniform_bg_ratio = bg_like / total
    skin_ratio = skin / fg
    skin_upper_ratio = skin_upper / max(1, upper_fg)
    skin_lower_ratio = skin_lower / max(1, lower_fg)
    skin_center_ratio = skin_center / fg
    aspect = h / max(w, 1)

    bbox_w = max(1, max_x - min_x + 1)
    bbox_h = max(1, max_y - min_y + 1)
    bbox_fill_h = bbox_h / h
    bbox_fill_w = bbox_w / w
    bbox_center_x = (min_x + max_x) / 2 / w
    centered_subject = 0.28 < bbox_center_x < 0.72

    # Sylwetka modelki: pionowe zdjęcie, duży obiekt na środku (nawet bez widocznej skóry)
    portrait_model = (
        aspect > 1.12
        and bbox_fill_h > 0.58
        and bbox_fill_w < 0.78
        and centered_subject
        and uniform_bg_ratio < 0.72
    )

    has_skin = (
        skin_ratio > 0.032
        or skin_upper_ratio > 0.055
        or skin_center_ratio > 0.04
        or (skin_lower_ratio > 0.06 and skin_ratio > 0.02)
    )

    on_foot = (
        skin_ratio > 0.025
        and skin_lower > skin_upper * 1.15
        and skin_lower_ratio > 0.05
        and aspect < 1.35
    )

    has_person = has_skin or on_foot or (portrait_model and skin_ratio > 0.012)

    # Packshot: jednolite tło, brak sylwetki ludzkiej, produkt na środku
    is_product_only = (
        not has_person
        and not portrait_model
        and uniform_bg_ratio > 0.38
        and skin_ratio < 0.022
        and fg_ratio > 0.08
        and fg_ratio < 0.55
    )

    horiz_spread = min(left_mass, right_mass) / max(1, fg) > 0.07
    bbox_aspect = bbox_w / bbox_h

    proj = [0] * w
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y][:3]
            if _color_distance((r, g, b), bg) >= bg_thresh:
                proj[x] += 1
    peak_thresh = max(3, int(max(proj) * 0.28)) if proj else 0
    peaks = 0
    for x in range(1, w - 1):
        if proj[x] >= peak_thresh and proj[x] >= proj[x - 1] and proj[x] >= proj[x + 1]:
            peaks += 1

    balance = min(left_mass, right_mass) / max(1, fg)
    lr_balance = min(left_mass, right_mass) / max(1, max(left_mass, right_mass))
    dual_runs = _dual_fg_runs(proj, w, fg)

    # Para = dwa wyraźnie oddzielone obiekty (nie jeden szeroki but z dwoma wypukłościami)
    shoe_is_pair = (
        is_product_only
        and not on_foot
        and dual_runs
        and peaks >= 2
        and bbox_aspect > 1.2
        and balance > 0.1
        and lr_balance > 0.45
        and horiz_spread
    )

    pair_confidence = 0.0
    if shoe_is_pair:
        pair_confidence = 0.9 if peaks >= 2 and dual_runs and bbox_aspect > 1.28 else 0.82
    elif is_product_only and dual_runs and peaks >= 1:
        pair_confidence = 0.45
    elif is_product_only and horiz_spread and bbox_aspect > 0.95:
        pair_confidence = 0.2

    shoe_side_angle = False
    shoe_view_hint = 'unknown'
    if is_product_only:
        if bbox_aspect > 1.15 and aspect < 1.3:
            shoe_side_angle = True
            shoe_view_hint = 'side_angle'
        elif horiz_spread and bbox_aspect > 0.85:
            shoe_side_angle = True
            shoe_view_hint = 'side'
        elif bbox_aspect < 0.85 and aspect < 1.1:
            shoe_view_hint = 'front'
        elif aspect < 0.95 and bbox_fill_w > 0.5:
            shoe_view_hint = 'top'
        elif shoe_is_pair and bbox_aspect > 1.05:
            shoe_view_hint = 'side'

    if on_foot:
        shoe_view_hint = 'on_foot'
        shoe_side_angle = False
        shoe_is_pair = False

    confidence = 0.6
    if has_skin and skin_ratio > 0.06:
        confidence = 0.94
    elif portrait_model and not is_product_only:
        confidence = 0.82
    elif is_product_only and uniform_bg_ratio > 0.45:
        confidence = 0.88
    elif skin_ratio < 0.02 and uniform_bg_ratio > 0.35:
        confidence = 0.72

    return PixelAnalysis(
        has_person=has_person,
        is_product_only=is_product_only,
        skin_ratio=skin_ratio,
        fg_ratio=fg_ratio,
        shoe_side_angle=shoe_side_angle,
        confidence=confidence,
        portrait_model=portrait_model,
        uniform_bg_ratio=uniform_bg_ratio,
        shoe_view_hint=shoe_view_hint,
        shoe_is_pair=shoe_is_pair,
        pair_confidence=pair_confidence,
    )
