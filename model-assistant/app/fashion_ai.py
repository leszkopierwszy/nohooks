"""Fashion AI (OpenAI) connector settings — stored on Backend Settings host (:8190)."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from .config import DATA_DIR
from .fashion_prompt import (
    DEFAULT_SYSTEM_PROMPT,
    REQUEST_SHAPE,
    USER_MESSAGE_TEMPLATE,
)

SETTINGS_PATH = DATA_DIR / "fashion_ai.json"
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_BASE_URL = "https://api.openai.com/v1"


def _read_raw() -> dict[str, Any]:
    if not SETTINGS_PATH.exists():
        return {}
    try:
        data = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _write(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SETTINGS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _hint(key: str) -> str:
    if len(key) <= 8:
        return "•" * len(key)
    # Keep hint short so UI cards don't overflow.
    return f"{key[:3]}••••{key[-4:]}"


def _normalize(data: dict[str, Any]) -> dict[str, Any]:
    """Migrate legacy single api_key → keys[] + active_key_id."""
    keys = data.get("keys")
    if not isinstance(keys, list):
        keys = []

    legacy = str(data.get("api_key") or "").strip()
    if legacy and not keys:
        kid = str(uuid.uuid4())
        keys = [
            {
                "id": kid,
                "label": "default",
                "api_key": legacy,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ]
        data["keys"] = keys
        data["active_key_id"] = kid
        data.pop("api_key", None)
        _write(data)
        return data

    data["keys"] = [
        k
        for k in keys
        if isinstance(k, dict) and str(k.get("api_key") or "").strip()
    ]

    active = data.get("active_key_id")
    ids = {str(k.get("id")) for k in data["keys"]}
    if active not in ids:
        data["active_key_id"] = next(iter(ids), None)

    data.pop("api_key", None)
    return data


def _read() -> dict[str, Any]:
    return _normalize(_read_raw())


def _public_key_row(entry: dict[str, Any], active_id: str | None) -> dict[str, Any]:
    key = str(entry.get("api_key") or "")
    return {
        "id": entry.get("id"),
        "label": entry.get("label") or "untitled",
        "api_key_hint": _hint(key) if key else None,
        "created_at": entry.get("created_at"),
        "active": str(entry.get("id")) == str(active_id),
    }


def list_keys_public() -> list[dict[str, Any]]:
    data = _read()
    active = data.get("active_key_id")
    return [_public_key_row(k, active) for k in data.get("keys", [])]


def get_api_key() -> str | None:
    data = _read()
    active = data.get("active_key_id")
    for entry in data.get("keys", []):
        if str(entry.get("id")) == str(active):
            key = str(entry.get("api_key") or "").strip()
            return key or None
    # fallback: first key
    for entry in data.get("keys", []):
        key = str(entry.get("api_key") or "").strip()
        if key:
            return key
    return None


def get_model() -> str:
    model = str(_read().get("model") or "").strip()
    return model or DEFAULT_MODEL


def get_base_url() -> str:
    url = str(_read().get("base_url") or "").strip().rstrip("/")
    return url or DEFAULT_BASE_URL


def is_configured() -> bool:
    return bool(get_api_key())


def api_key_hint() -> str | None:
    key = get_api_key()
    return _hint(key) if key else None


def public_status() -> dict[str, Any]:
    base = get_base_url()
    host = base
    try:
        from urllib.parse import urlparse

        host = urlparse(base).hostname or base
    except Exception:
        pass
    data = _read()
    return {
        "configured": is_configured(),
        "model": get_model(),
        "base_url": base,
        "base_url_host": host,
        "api_key_set": is_configured(),
        "api_key_hint": api_key_hint(),
        "active_key_id": data.get("active_key_id"),
        "keys": list_keys_public(),
    }


def get_system_prompt() -> str:
    stored = str(_read().get("system_prompt") or "").strip()
    return stored if stored else DEFAULT_SYSTEM_PROMPT


def set_system_prompt(prompt: str | None, *, reset: bool = False) -> dict[str, Any]:
    data = _read()
    if reset or prompt is None:
        data.pop("system_prompt", None)
    else:
        text = str(prompt).strip()
        if not text or text == DEFAULT_SYSTEM_PROMPT.strip():
            data.pop("system_prompt", None)
        else:
            data["system_prompt"] = text
    _write(data)
    return prompt_preview()


def prompt_preview() -> dict[str, Any]:
    system = get_system_prompt()
    return {
        "system_prompt": system,
        "is_custom": system.strip() != DEFAULT_SYSTEM_PROMPT.strip(),
        "default_system_prompt": DEFAULT_SYSTEM_PROMPT,
        "user_message_template": USER_MESSAGE_TEMPLATE,
        "request_shape": REQUEST_SHAPE,
        "notes": (
            "Laravel builds the user message at request time from the Prim wardrobe "
            "(fashion items only). The system prompt below is what OpenAI receives as role=system."
        ),
    }


def runtime_credentials() -> dict[str, Any]:
    """Full credentials for Laravel FashionStylistService (internal)."""
    return {
        "configured": is_configured(),
        "api_key": get_api_key(),
        "model": get_model(),
        "base_url": get_base_url(),
        "system_prompt": get_system_prompt(),
    }


def update_settings(
    *,
    api_key: str | None = None,
    clear_api_key: bool = False,
    model: str | None = None,
    base_url: str | None = None,
    label: str | None = None,
) -> dict[str, Any]:
    """Update model/base_url; optionally add a key (legacy-friendly)."""
    data = _read()

    if clear_api_key:
        data["keys"] = []
        data["active_key_id"] = None
    elif api_key is not None and str(api_key).strip():
        add_key(api_key=str(api_key).strip(), label=label or "default", activate=True)
        data = _read()

    if model is not None:
        m = str(model).strip()
        if m:
            data["model"] = m
        else:
            data.pop("model", None)

    if base_url is not None:
        u = str(base_url).strip().rstrip("/")
        if u:
            data["base_url"] = u
        else:
            data.pop("base_url", None)

    _write(data)
    return public_status()


def add_key(*, api_key: str, label: str = "", activate: bool = True) -> dict[str, Any]:
    key = str(api_key).strip()
    if not key:
        raise ValueError("api_key is required")

    data = _read()
    kid = str(uuid.uuid4())
    entry = {
        "id": kid,
        "label": (label or "").strip() or f"key-{len(data.get('keys', [])) + 1}",
        "api_key": key,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    keys = list(data.get("keys", []))
    keys.append(entry)
    data["keys"] = keys
    if activate or not data.get("active_key_id"):
        data["active_key_id"] = kid
    _write(data)
    return public_status()


def activate_key(key_id: str) -> dict[str, Any]:
    data = _read()
    ids = {str(k.get("id")) for k in data.get("keys", [])}
    if str(key_id) not in ids:
        raise KeyError(key_id)
    data["active_key_id"] = str(key_id)
    _write(data)
    return public_status()


def delete_key(key_id: str) -> dict[str, Any]:
    data = _read()
    before = len(data.get("keys", []))
    data["keys"] = [k for k in data.get("keys", []) if str(k.get("id")) != str(key_id)]
    if len(data["keys"]) == before:
        raise KeyError(key_id)
    if str(data.get("active_key_id")) == str(key_id):
        data["active_key_id"] = data["keys"][0]["id"] if data["keys"] else None
    _write(data)
    return public_status()


def internal_token_ok(provided: str | None) -> bool:
    expected = os.environ.get("FASHION_AI_INTERNAL_TOKEN", "").strip()
    if not expected:
        return True
    return bool(provided) and provided == expected
