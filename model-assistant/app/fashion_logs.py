"""Persisted Fashion AI request/response logs for Backend Settings preview."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from .config import DATA_DIR

LOGS_PATH = DATA_DIR / "fashion_ai_logs.json"
MAX_LOGS = 50


def _read() -> list[dict[str, Any]]:
    if not LOGS_PATH.exists():
        return []
    try:
        data = json.loads(LOGS_PATH.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]
        if isinstance(data, dict) and isinstance(data.get("entries"), list):
            return [x for x in data["entries"] if isinstance(x, dict)]
    except (OSError, json.JSONDecodeError):
        pass
    return []


def _write(entries: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_PATH.write_text(
        json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def list_logs(*, limit: int = 50) -> dict[str, Any]:
    entries = _read()
    limit = max(1, min(int(limit or 50), MAX_LOGS))
    return {
        "count": len(entries),
        "entries": entries[:limit],
    }


def get_log(log_id: str) -> dict[str, Any] | None:
    for entry in _read():
        if str(entry.get("id")) == str(log_id):
            return entry
    return None


def append_log(payload: dict[str, Any]) -> dict[str, Any]:
    entry = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": str(payload.get("status") or "ok"),
        "model": payload.get("model"),
        "base_url_host": payload.get("base_url_host"),
        "duration_ms": payload.get("duration_ms"),
        "entity_id": payload.get("entity_id"),
        "user_id": payload.get("user_id"),
        "occasion": payload.get("occasion"),
        "notes": payload.get("notes"),
        "catalog_count": payload.get("catalog_count"),
        "request": payload.get("request"),
        "response": payload.get("response"),
        "error": payload.get("error"),
        "http_status": payload.get("http_status"),
        "usage": payload.get("usage"),
    }
    entries = [entry, *_read()][:MAX_LOGS]
    _write(entries)
    return entry


def clear_logs() -> dict[str, Any]:
    _write([])
    return {"count": 0, "entries": []}
