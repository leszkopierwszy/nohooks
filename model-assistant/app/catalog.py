from __future__ import annotations

from pathlib import Path
from typing import Any

from .bundles import bundle_file_entries
from .config import MODELS_ROOT, load_catalog
from .custom_catalog import load_custom_bundles
from .database import get_active_installation
from .file_check import analyze_bundle_files
from .sizes import directory_size, format_bytes


def _enrich_bundle(bundle: dict[str, Any]) -> dict[str, Any]:
    active = get_active_installation(bundle["id"])
    analysis = analyze_bundle_files(bundle)
    files = analysis["files"]

    installed_bytes = sum(f.get("size_bytes") or 0 for f in files if f.get("installed"))
    installed_count = analysis["present_count"]
    missing_count = analysis["missing_count"]

    status = "not_installed"
    installation = None
    if active:
        status = active["status"]
        installation = {
            "id": active["id"],
            "installed_at": active.get("installed_at"),
            "status": active["status"],
            "error_message": active.get("error_message"),
            "progress": active.get("progress") or {},
            "files": active.get("files") or [],
        }
    elif analysis["is_complete"]:
        status = "installed"
    elif analysis["is_partial"]:
        status = "partial"

    return {
        **bundle,
        "files": files,
        "install_status": status,
        "installation": installation,
        "file_count": analysis["file_count"],
        "installed_file_count": installed_count,
        "missing_file_count": missing_count,
        "missing_files": [f["filename"] for f in analysis["missing_files"]],
        "disk_summary": analysis["summary"],
        "is_complete_on_disk": analysis["is_complete"],
        "installed_size_bytes": installed_bytes,
        "installed_size_human": format_bytes(installed_bytes),
    }


def all_bundle_definitions() -> list[dict[str, Any]]:
    builtin = list(load_catalog().get("bundles", []))
    custom = load_custom_bundles()
    return builtin + custom


def list_bundles_with_status() -> list[dict[str, Any]]:
    return [_enrich_bundle(b) for b in all_bundle_definitions()]


def get_bundle(bundle_id: str) -> dict[str, Any] | None:
    for b in list_bundles_with_status():
        if b["id"] == bundle_id:
            return b
    return None


def get_raw_bundle(bundle_id: str) -> dict[str, Any] | None:
    for b in all_bundle_definitions():
        if b["id"] == bundle_id:
            return b
    return None


def models_storage_stats() -> dict[str, Any]:
    total = directory_size(MODELS_ROOT)
    by_subdir: dict[str, int] = {}
    if MODELS_ROOT.is_dir():
        for child in MODELS_ROOT.iterdir():
            if child.is_dir():
                by_subdir[child.name] = directory_size(child)

    return {
        "models_root": str(MODELS_ROOT),
        "total_bytes": total,
        "total_human": format_bytes(total),
        "subdirs": {
            name: {"bytes": size, "human": format_bytes(size)}
            for name, size in sorted(by_subdir.items(), key=lambda x: -x[1])
        },
    }
