from __future__ import annotations

import os
from typing import Any

import requests

LANGFUSE_UI_URL = os.environ.get("LANGFUSE_UI_URL", "http://localhost:3100").rstrip("/")
LANGFUSE_INTERNAL_URL = os.environ.get("LANGFUSE_INTERNAL_URL", "http://langfuse-web:3000").rstrip("/")
PRODUCT_PARSER_URL = os.environ.get("PRODUCT_PARSER_URL", "http://product-parser:8080").rstrip("/")
REQUEST_TIMEOUT = float(os.environ.get("OBSERVABILITY_TIMEOUT", "4"))


def _probe(url: str, path: str = "") -> dict[str, Any]:
    target = f"{url}{path}"
    try:
        response = requests.get(target, timeout=REQUEST_TIMEOUT)
        body: Any = None
        try:
            body = response.json()
        except Exception:
            body = None
        return {
            "ok": response.ok,
            "status_code": response.status_code,
            "body": body,
        }
    except requests.RequestException as exc:
        return {"ok": False, "error": str(exc)}


def get_observability_status() -> dict[str, Any]:
    langfuse_public = _probe(LANGFUSE_INTERNAL_URL, "/api/public/health")
    langfuse_root = _probe(LANGFUSE_INTERNAL_URL, "/")
    langfuse_online = langfuse_public.get("ok") or langfuse_root.get("ok")

    parser = _probe(PRODUCT_PARSER_URL, "/api/health")
    parser_body = parser.get("body") if isinstance(parser.get("body"), dict) else {}

    return {
        "langfuse": {
            "ui_url": LANGFUSE_UI_URL,
            "internal_url": LANGFUSE_INTERNAL_URL,
            "online": langfuse_online,
            "health": langfuse_public,
            "tracing_note": (
                "Trace’y z product-parser (import produktu, Ollama, ranking zdjęć) "
                "pojawiają się w projekcie Product Parser."
            ),
        },
        "product_parser": {
            "url": PRODUCT_PARSER_URL,
            "online": parser.get("ok", False),
            "langfuse_tracing": bool(parser_body.get("langfuse_tracing")),
            "health": parser_body,
        },
    }
