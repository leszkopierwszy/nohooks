from __future__ import annotations

from pathlib import Path


def file_size(path: Path) -> int:
    try:
        return path.stat().st_size if path.is_file() else 0
    except OSError:
        return 0


def directory_size(path: Path) -> int:
    if not path.exists():
        return 0
    if path.is_file():
        return file_size(path)
    total = 0
    try:
        for child in path.rglob("*"):
            if child.is_file():
                total += file_size(child)
    except OSError:
        pass
    return total


def format_bytes(num: int | float | None) -> str:
    if not num:
        return "0 B"
    n = float(num)
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while n >= 1024 and i < len(units) - 1:
        n /= 1024
        i += 1
    return f"{n:.1f} {units[i]}"
