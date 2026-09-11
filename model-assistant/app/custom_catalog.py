"""Pakiety dodane przez użytkownika (persistowane w DATA_DIR)."""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import CUSTOM_BUNDLES_PATH, DATA_DIR
from .hf_parse import parse_hf_urls

_slug_re = re.compile(r"[^a-z0-9]+")


def _utc_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _load_raw() -> dict[str, Any]:
    if not CUSTOM_BUNDLES_PATH.is_file():
        return {"bundles": []}
    with open(CUSTOM_BUNDLES_PATH, encoding="utf-8") as f:
        data = json.load(f)
    if "bundles" not in data:
        data["bundles"] = []
    return data


def _save_raw(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(CUSTOM_BUNDLES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_custom_bundles() -> list[dict[str, Any]]:
    return list(_load_raw().get("bundles", []))


def make_bundle_id(name: str) -> str:
    slug = _slug_re.sub("-", name.lower().strip())[:40].strip("-")
    suffix = uuid.uuid4().hex[:8]
    return f"custom-{slug or 'model'}-{suffix}"


def add_custom_bundle(
    *,
    hf_urls: list[str],
    name: str | None = None,
    target_subdir: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    files = parse_hf_urls(hf_urls)
    if target_subdir:
        for f in files:
            f["target_subdir"] = target_subdir.strip().strip("/")

    first_repo = files[0]["repo_id"]
    bundle_name = name.strip() if name and name.strip() else Path(files[0]["filename"]).stem

    bundle = {
        "id": make_bundle_id(bundle_name),
        "name": bundle_name,
        "description": description or "Dodany ręcznie z linku Hugging Face.",
        "hf_page": f"https://huggingface.co/{first_repo}",
        "catalog_added": _utc_date(),
        "tags": ["custom", "user"],
        "custom": True,
        "source_urls": [u.strip() for u in hf_urls if u.strip()],
        "files": files,
    }

    data = _load_raw()
    data["bundles"].append(bundle)
    _save_raw(data)
    return bundle


def delete_custom_bundle(bundle_id: str) -> bool:
    data = _load_raw()
    before = len(data["bundles"])
    data["bundles"] = [b for b in data["bundles"] if b["id"] != bundle_id]
    if len(data["bundles"]) == before:
        return False
    _save_raw(data)
    return True


def is_custom_bundle(bundle_id: str) -> bool:
    return bundle_id.startswith("custom-")
