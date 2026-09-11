from __future__ import annotations

from pathlib import Path
from typing import Any


def hf_file_url(repo_id: str, hf_path: str) -> str:
    return f"https://huggingface.co/{repo_id}/resolve/main/{hf_path}"


def bundle_file_entries(bundle: dict[str, Any]) -> list[dict[str, Any]]:
    entries = []
    for f in bundle.get("files", []):
        filename = f.get("filename") or Path(f["hf_path"]).name
        target = Path(f["target_subdir"]) / filename
        entries.append(
            {
                "repo_id": f["repo_id"],
                "hf_path": f["hf_path"],
                "hf_url": f.get("hf_url") or hf_file_url(f["repo_id"], f["hf_path"]),
                "target_subdir": f["target_subdir"],
                "filename": filename,
                "relative_path": str(target).replace("\\", "/"),
            }
        )
    return entries
