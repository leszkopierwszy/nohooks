from __future__ import annotations

import base64
import io
import logging
import os
import re
from typing import Any

import httpx
from PIL import Image

from .telemetry import generation, update_observation

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://host.docker.internal:11434').rstrip('/')
OLLAMA_VISION_MODEL = os.getenv('OLLAMA_VISION_MODEL', 'llava')
OLLAMA_TIMEOUT = float(os.getenv('OLLAMA_TIMEOUT', '28'))
MAX_ANALYSIS_EDGE = int(os.getenv('OLLAMA_IMAGE_MAX_EDGE', '384'))

# Prostszy format niż JSON — llava lepiej trzyma linie YES/NO
LINE_PROMPT = """Look at this e-commerce product photo. Reply with EXACTLY 4 lines, nothing else:
HUMAN: YES or NO
PRODUCT_ONLY: YES or NO
SHOE_VIEW: SIDE_ANGLE, SIDE, FRONT, TOP, ON_FOOT, or NONE
COVER_SCORE: integer 0-100 (0=model/lifestyle, 100=isolated product on white background)"""

SHOE_LINE_PROMPT = """Look at this FOOTWEAR product photo. Reply with EXACTLY 5 lines, nothing else:
HUMAN: YES or NO
PRODUCT_ONLY: YES or NO
PAIR: YES or NO
SHOE_VIEW: SIDE_ANGLE, SIDE, FRONT, TOP, ON_FOOT, or NONE
COVER_SCORE: integer 0-100

PAIR means YES only if TWO shoes are visible together (a pair). ONE shoe = PAIR: NO.
PRODUCT_ONLY is YES only if shoes float alone with NO legs, feet, or person."""

SHOE_LINE_EXTRA = """
This product is FOOTWEAR. PRODUCT_ONLY must be YES only if shoes float alone with NO legs/feet/person.
PAIR: YES when two shoes are shown together (pair packshot), NO for a single shoe.
SHOE_VIEW SIDE_ANGLE means shoes seen from the side at an angle (best catalog photo)."""


def ollama_enabled() -> bool:
    flag = os.getenv('PRODUCT_IMAGE_USE_OLLAMA', 'true').lower()
    return flag not in ('0', 'false', 'no', 'off')


async def ollama_available() -> bool:
    if not ollama_enabled():
        return False
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(3.0, connect=2.0)) as client:
            response = await client.get(f'{OLLAMA_BASE_URL}/api/tags')
            return response.is_success
    except Exception:
        return False


def _prepare_image_bytes(raw: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ('RGB', 'L'):
        img = img.convert('RGB')
    img.thumbnail((MAX_ANALYSIS_EDGE, MAX_ANALYSIS_EDGE), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=88, optimize=True)
    return buf.getvalue()


def _parse_yes_no(line: str) -> bool | None:
    upper = line.upper()
    if re.search(r'\bYES\b', upper):
        return True
    if re.search(r'\bNO\b', upper):
        return False
    return None


def _parse_line_response(text: str) -> dict[str, Any] | None:
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    data: dict[str, Any] = {}
    for line in lines:
        if ':' not in line:
            continue
        key, _, val = line.partition(':')
        key = key.strip().upper().replace(' ', '_')
        val = val.strip().upper()
        data[key] = val

    human = _parse_yes_no(data.get('HUMAN', ''))
    product_only = _parse_yes_no(data.get('PRODUCT_ONLY', ''))
    is_pair = _parse_yes_no(data.get('PAIR', ''))

    shoe_raw = str(data.get('SHOE_VIEW', 'NONE')).upper().replace('-', '_').replace(' ', '_')
    shoe_map = {
        'SIDE_ANGLE': 'side_angle',
        'SIDE': 'side',
        'FRONT': 'front',
        'TOP': 'top',
        'ON_FOOT': 'on_foot',
        'ONFOOT': 'on_foot',
        'PAIR_TOP': 'pair_top',
        'NONE': 'unknown',
        'UNKNOWN': 'unknown',
    }
    shoe_view = 'unknown'
    for token, mapped in shoe_map.items():
        if token in shoe_raw:
            shoe_view = mapped
            break

    cover = 50.0
    score_match = re.search(r'COVER_SCORE:\s*(\d+)', text, re.I)
    if score_match:
        cover = float(score_match.group(1))
    else:
        num = re.search(r'\b(\d{1,3})\b', str(data.get('COVER_SCORE', '')))
        if num:
            cover = float(num.group(1))
    cover = max(0.0, min(100.0, cover))

    if human is None and product_only is None:
        return None

    has_person = human if human is not None else (not product_only if product_only is not None else False)
    is_product_only = product_only if product_only is not None else (not has_person)

    if shoe_view == 'on_foot':
        has_person = True
        is_product_only = False

    if has_person:
        is_product_only = False
        if cover > 40:
            cover = min(cover, 25.0)

    result: dict[str, Any] = {
        'has_person_or_model': has_person,
        'is_product_only': is_product_only and not has_person,
        'is_shoe': shoe_view != 'unknown',
        'shoe_view': shoe_view,
        'cover_suitability': cover,
    }
    if is_pair is not None:
        result['is_pair'] = is_pair
        result['pair_confidence'] = 0.88 if is_pair else 0.12
    return result


async def _ollama_chat(image_b64: str, prompt: str) -> str | None:
    payload = {
        'model': OLLAMA_VISION_MODEL,
        'messages': [
            {
                'role': 'user',
                'content': prompt,
                'images': [image_b64],
            }
        ],
        'stream': False,
        'options': {'temperature': 0.1, 'num_predict': 140},
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(OLLAMA_TIMEOUT, connect=10.0)) as client:
            response = await client.post(f'{OLLAMA_BASE_URL}/api/chat', json=payload)
            if not response.is_success:
                logger.warning('Ollama vision HTTP %s', response.status_code)
                return None
            return response.json().get('message', {}).get('content', '')
    except Exception as exc:
        logger.warning('Ollama vision failed: %s', exc)
        return None


async def analyze_product_image(image_bytes: bytes, *, is_shoe_hint: bool = False) -> dict[str, Any] | None:
    try:
        jpeg = _prepare_image_bytes(image_bytes)
    except Exception:
        return None

    prompt = SHOE_LINE_PROMPT if is_shoe_hint else LINE_PROMPT
    if is_shoe_hint and prompt == LINE_PROMPT:
        prompt += SHOE_LINE_EXTRA

    b64 = base64.b64encode(jpeg).decode('ascii')

    with generation(
        'ollama_vision',
        model=OLLAMA_VISION_MODEL,
        input={'format': 'line', 'is_shoe_hint': is_shoe_hint},
        metadata={'ollama_base_url': OLLAMA_BASE_URL},
    ) as gen:
        content = await _ollama_chat(b64, prompt)
        if not content:
            update_observation(gen, output={'error': 'empty'})
            return None

        parsed = _parse_line_response(content)
        if not parsed:
            # fallback: krótkie pytanie TAK/NIE
            confirm = await _ollama_chat(
                b64,
                'Is there any visible human, model, legs or feet in this image? Answer only YES or NO.',
            )
            if confirm:
                human = _parse_yes_no(confirm) or ('YES' in confirm.upper())
                parsed = {
                    'has_person_or_model': human,
                    'is_product_only': not human,
                    'is_shoe': is_shoe_hint,
                    'shoe_view': 'unknown',
                    'cover_suitability': 15.0 if human else 70.0,
                }

        update_observation(gen, output={'parsed': parsed, 'raw': content[:400]})
        return parsed
