from __future__ import annotations

from typing import Any

from .image_pixels import PixelAnalysis


def resolve_shoe_is_pair(
    pixels: PixelAnalysis | None,
    ollama: dict[str, Any] | None = None,
) -> bool:
    """Czy na zdjęciu widać parę butów (nie pojedynczy but)."""
    if ollama is not None and ollama.get('is_pair') is False:
        return False
    if ollama is not None and ollama.get('is_product_only') is False:
        return False

    if ollama is None or ollama.get('is_pair') is not True:
        return False

    return bool(
        pixels is not None
        and pixels.shoe_is_pair
        and pixels.pair_confidence >= 0.9
    )


def pair_detection_confidence(
    pixels: PixelAnalysis | None,
    ollama: dict[str, Any] | None = None,
) -> float:
    if ollama is not None and ollama.get('pair_confidence') is not None:
        try:
            return float(ollama['pair_confidence'])
        except (TypeError, ValueError):
            pass
    if ollama is not None and ollama.get('is_pair') is not None:
        return 0.9 if ollama['is_pair'] else 0.15
    if pixels is not None:
        return float(getattr(pixels, 'pair_confidence', 0.0))
    return 0.0
