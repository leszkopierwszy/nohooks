from __future__ import annotations

import logging
import re

from fastapi import FastAPI, Header, HTTPException

import os

from .image_ranker import MAX_CATALOG_OUTPUT, rank_product_images
from .http_fetch import fetch_html
from .parser import parse_product_page
from .product_class import detect_product_class
from .schemas import ParseRequest, ParsedProduct
from .telemetry import flush, span

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title='Nohooks Product Parser', version='1.0.0')


def _validate_url(url: str) -> str:
    url = url.strip()
    if not re.match(r'^https?://', url, re.I):
        raise HTTPException(422, 'URL musi zaczynać się od http:// lub https://')
    return url


@app.get('/api/health')
def health() -> dict:
    from .telemetry import tracing_enabled

    return {
        'ok': True,
        'service': 'product-parser',
        'langfuse_tracing': tracing_enabled(),
    }


@app.post('/api/parse', response_model=ParsedProduct)
async def parse_product(
    body: ParseRequest,
    x_langfuse_trace_id: str | None = Header(None, alias='X-Langfuse-Trace-Id'),
) -> ParsedProduct:
    url = _validate_url(body.url)
    trace_id = (body.trace_id or x_langfuse_trace_id or '').strip() or None
    try:
        with span(
            'parse_product',
            input={'url': url, 'is_footwear': body.is_footwear},
            metadata={'service': 'product-parser'},
            trace_id=trace_id,
        ) as root:
            html = await fetch_html(url)
            data = parse_product_page(url, html)
            product_class = detect_product_class(
                url=url,
                category=data.get('category'),
                name=data.get('name'),
                description=data.get('description'),
                hint=body.product_class_hint,
                is_footwear=body.is_footwear,
            )
            data['detected_product_class'] = product_class.value
            image_alts = {
                entry['url']: entry.get('alt')
                for entry in (data.get('image_entries') or [])
                if entry.get('url')
            }
            catalog_limit = int(os.getenv('PRODUCT_IMAGE_MAX_CATALOG', str(MAX_CATALOG_OUTPUT)))
            ranked_urls, image_meta, pair_summary = await rank_product_images(
                data.get('image_urls') or [],
                category=data.get('category'),
                name=data.get('name'),
                description=data.get('description'),
                is_footwear=body.is_footwear,
                product_class=product_class,
                image_alts=image_alts,
                source_url=url,
                primary_sku=data.get('primary_sku'),
                max_output=catalog_limit,
            )
            data['image_urls'] = ranked_urls
            data['image_meta'] = image_meta
            data['has_pair_image'] = pair_summary.get('has_pair_image', False)
            data['pair_image_urls'] = pair_summary.get('pair_image_urls') or []
            data['pair_image_count'] = pair_summary.get('pair_image_count', 0)
            data['image_catalog'] = pair_summary.get('image_catalog')
            if root is not None:
                catalog = (pair_summary or {}).get('image_catalog') or {}
                root.update(
                    output={
                        'name': data.get('name'),
                        'image_count': len(data.get('image_urls') or []),
                        'category': data.get('category'),
                        'store_profile': data.get('store_profile'),
                        'has_pair_image': data.get('has_pair_image'),
                        'pair_image_count': data.get('pair_image_count'),
                        'image_catalog': catalog,
                    }
                )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception('Parse failed for %s', url)
        raise HTTPException(502, f'Nie udało się pobrać strony: {exc}') from exc
    finally:
        flush()

    if not data.get('name') and not data.get('image_urls'):
        raise HTTPException(
            422,
            'Nie znaleziono danych produktu na tej stronie (brak nazwy i zdjęcia).',
        )

    return ParsedProduct(**data)
