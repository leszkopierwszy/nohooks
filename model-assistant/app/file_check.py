from __future__ import annotations

from pathlib import Path
from typing import Any

from .bundles import bundle_file_entries
from .config import MODELS_ROOT
from .sizes import file_size, format_bytes


def disk_file_state(relative_path: str) -> dict[str, Any]:
    path = MODELS_ROOT / relative_path
    part = path.with_suffix(path.suffix + ".part")

    if path.is_file() and path.stat().st_size > 0:
        size = file_size(path)
        return {
            "on_disk": True,
            "downloading": False,
            "size_bytes": size,
            "path": str(path),
        }
    if part.is_file() and part.stat().st_size > 0:
        return {
            "on_disk": False,
            "downloading": True,
            "size_bytes": file_size(part),
            "path": str(part),
        }
    return {"on_disk": False, "downloading": False, "size_bytes": 0, "path": str(path)}


def analyze_bundle_files(bundle: dict[str, Any]) -> dict[str, Any]:
    """Które pliki pakietu są już na dysku (np. z innego pakietu) i czego brakuje."""
    entries = bundle_file_entries(bundle)
    present: list[dict[str, Any]] = []
    missing: list[dict[str, Any]] = []
    enriched_files: list[dict[str, Any]] = []

    for fe in entries:
        state = disk_file_state(fe["relative_path"])
        row = {
            **fe,
            "installed": state["on_disk"],
            "downloading": state["downloading"],
            "size_bytes": state["size_bytes"] if state["on_disk"] or state["downloading"] else None,
            "skip_download": state["on_disk"],
        }
        enriched_files.append(row)
        if state["on_disk"]:
            present.append(row)
        elif not state["downloading"]:
            missing.append(row)

    total = len(entries)
    missing_count = len(missing)
    present_count = len(present)

    return {
        "files": enriched_files,
        "present_files": present,
        "missing_files": missing,
        "file_count": total,
        "present_count": present_count,
        "missing_count": missing_count,
        "is_complete": total > 0 and missing_count == 0,
        "is_partial": present_count > 0 and missing_count > 0,
        "is_empty": present_count == 0,
        "summary": _summary_text(present_count, missing_count, total),
    }


def _summary_text(present: int, missing: int, total: int) -> str:
    if total == 0:
        return "Brak plików w pakiecie"
    if missing == 0:
        return f"Kompletny na dysku ({present}/{total})"
    if present == 0:
        return f"Brakuje wszystkich plików ({missing}/{total})"
    return f"Na dysku {present}/{total}, brakuje {missing}"


def manifest_from_present(present_files: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "relative_path": f["relative_path"],
            "hf_url": f["hf_url"],
            "repo_id": f["repo_id"],
            "hf_path": f["hf_path"],
            "size_bytes": f.get("size_bytes") or 0,
            "skipped_download": True,
        }
        for f in present_files
    ]


def manifest_from_downloaded(
    fe: dict[str, Any], size: int, *, skipped: bool = False
) -> dict[str, Any]:
    return {
        "relative_path": fe["relative_path"],
        "hf_url": fe["hf_url"],
        "repo_id": fe["repo_id"],
        "hf_path": fe["hf_path"],
        "size_bytes": size,
        "skipped_download": skipped,
    }
