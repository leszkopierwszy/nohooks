from __future__ import annotations

import logging
import os
import shutil
import threading
from pathlib import Path
from typing import Any

import requests
from huggingface_hub import hf_hub_download, hf_hub_url
from huggingface_hub.utils import build_hf_headers

from .catalog import get_raw_bundle
from .file_check import (
    analyze_bundle_files,
    manifest_from_downloaded,
    manifest_from_present,
)
from .config import MODELS_ROOT
from .database import (
    create_installation,
    get_active_installation,
    get_installation,
    update_installation,
)
from .sizes import format_bytes

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_jobs: dict[int, threading.Thread] = {}

CHUNK = 1024 * 1024


def _utc_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _hf_token() -> str | None:
    return os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")


def _set_progress(
    install_id: int,
    *,
    phase: str,
    file_index: int = 0,
    file_count: int = 0,
    current_filename: str = "",
    bytes_downloaded: int = 0,
    bytes_total: int | None = None,
    files_completed: list[str] | None = None,
    message: str = "",
) -> None:
    overall = 0
    if file_count > 0:
        file_frac = max(0, file_index - 1) / file_count
        if bytes_total and bytes_total > 0:
            file_frac += min(1.0, bytes_downloaded / bytes_total) / file_count
        elif file_index > 0 and bytes_downloaded == 0 and phase == "downloading":
            file_frac = max(0, file_index - 1) / file_count
        overall = int(min(99, file_frac * 100))

    file_percent: int | None = None
    if bytes_total and bytes_total > 0:
        file_percent = int(min(99, bytes_downloaded / bytes_total * 100))

    update_installation(
        install_id,
        progress={
            "phase": phase,
            "file_index": file_index,
            "file_count": file_count,
            "current_filename": current_filename,
            "bytes_downloaded": bytes_downloaded,
            "bytes_total": bytes_total,
            "bytes_downloaded_human": format_bytes(bytes_downloaded),
            "bytes_total_human": format_bytes(bytes_total) if bytes_total else None,
            "file_percent": file_percent,
            "overall_percent": overall,
            "files_completed": files_completed or [],
            "message": message,
            "updated_at": _utc_now(),
        },
        error_message=message if phase in ("downloading", "pending", "uninstalling") else None,
    )


def _remote_file_size(repo_id: str, hf_path: str, token: str | None) -> int | None:
    try:
        url = hf_hub_url(repo_id, hf_path, repo_type="model")
        headers = build_hf_headers(token=token)
        resp = requests.head(url, headers=headers, allow_redirects=True, timeout=60)
        resp.raise_for_status()
        cl = resp.headers.get("content-length")
        return int(cl) if cl else None
    except Exception as exc:  # noqa: BLE001
        logger.debug("HEAD size failed for %s/%s: %s", repo_id, hf_path, exc)
        return None


def _download_file_streaming(
    install_id: int,
    repo_id: str,
    hf_path: str,
    dest: Path,
    *,
    file_index: int,
    file_count: int,
    files_completed: list[str],
    skipped: bool = False,
) -> int:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file() and dest.stat().st_size > 0:
        if skipped:
            _set_progress(
                install_id,
                phase="downloading",
                file_index=file_index,
                file_count=file_count,
                current_filename=dest.name,
                bytes_downloaded=dest.stat().st_size,
                bytes_total=dest.stat().st_size,
                files_completed=files_completed,
                message=(
                    f"Plik {file_index}/{file_count}: {dest.name} — "
                    "już na dysku (pominięto pobieranie)"
                ),
            )
        return dest.stat().st_size

    token = _hf_token()
    filename = dest.name
    bytes_total = _remote_file_size(repo_id, hf_path, token)

    _set_progress(
        install_id,
        phase="downloading",
        file_index=file_index,
        file_count=file_count,
        current_filename=filename,
        bytes_downloaded=0,
        bytes_total=bytes_total,
        files_completed=files_completed,
        message=f"Plik {file_index}/{file_count}: {filename} — start pobierania…",
    )

    part = dest.with_suffix(dest.suffix + ".part")
    if part.is_file():
        part.unlink()

    try:
        url = hf_hub_url(repo_id, hf_path, repo_type="model")
        headers = build_hf_headers(token=token)
        downloaded = 0
        with requests.get(url, headers=headers, stream=True, timeout=120) as resp:
            resp.raise_for_status()
            if not bytes_total:
                cl = resp.headers.get("content-length")
                if cl:
                    bytes_total = int(cl)
            with open(part, "wb") as out:
                for chunk in resp.iter_content(chunk_size=CHUNK):
                    if not chunk:
                        continue
                    out.write(chunk)
                    downloaded += len(chunk)
                    if downloaded <= CHUNK or downloaded % (4 * CHUNK) < len(chunk):
                        _set_progress(
                            install_id,
                            phase="downloading",
                            file_index=file_index,
                            file_count=file_count,
                            current_filename=filename,
                            bytes_downloaded=downloaded,
                            bytes_total=bytes_total,
                            files_completed=files_completed,
                            message=(
                                f"Plik {file_index}/{file_count}: {filename} — "
                                f"{format_bytes(downloaded)}"
                                + (f" / {format_bytes(bytes_total)}" if bytes_total else "")
                            ),
                        )
        part.rename(dest)
        return dest.stat().st_size
    except Exception as stream_exc:  # noqa: BLE001
        logger.warning("Stream download failed, fallback to hf_hub_download: %s", stream_exc)
        if part.is_file():
            part.unlink()
        _set_progress(
            install_id,
            phase="downloading",
            file_index=file_index,
            file_count=file_count,
            current_filename=filename,
            bytes_downloaded=0,
            bytes_total=bytes_total,
            files_completed=files_completed,
            message=f"Plik {file_index}/{file_count}: {filename} — pobieranie (cache HF)…",
        )
        cached = hf_hub_download(repo_id=repo_id, filename=hf_path, token=token)
        shutil.copy2(cached, dest)
        return dest.stat().st_size


def _finalize_installed(
    install_id: int,
    bundle_id: str,
    installed_files: list[dict[str, Any]],
    completed_names: list[str],
    *,
    skipped_count: int,
    downloaded_count: int,
) -> None:
    file_count = len(installed_files)
    _set_progress(
        install_id,
        phase="done",
        file_index=file_count,
        file_count=file_count,
        bytes_downloaded=sum(f.get("size_bytes", 0) for f in installed_files),
        files_completed=completed_names,
        message=(
            f"Pakiet kompletny: {file_count} plików ({format_bytes(sum(f.get('size_bytes', 0) for f in installed_files))})"
            + (
                f" — pominięto {skipped_count} już na dysku"
                if skipped_count
                else ""
            )
            + (f", pobrano {downloaded_count}" if downloaded_count else "")
        ),
    )
    update_installation(
        install_id,
        status="installed",
        files=installed_files,
        installed_at=_utc_now(),
        error_message=None,
    )
    logger.info(
        "Installed bundle %s (%s files, %s skipped, %s downloaded)",
        bundle_id,
        file_count,
        skipped_count,
        downloaded_count,
    )


def _run_install(install_id: int, bundle_id: str) -> None:
    raw = get_raw_bundle(bundle_id)
    if not raw:
        update_installation(install_id, status="failed", error_message="Nieznany pakiet")
        return

    analysis = analyze_bundle_files(raw)
    all_entries = analysis["files"]
    to_download = analysis["missing_files"]
    already_present = analysis["present_files"]
    file_count = len(all_entries)
    download_count = len(to_download)
    skipped_count = len(already_present)

    update_installation(install_id, status="downloading")

    installed_files: list[dict[str, Any]] = manifest_from_present(already_present)
    completed_names: list[str] = [f["filename"] for f in already_present]

    if analysis["is_complete"]:
        _set_progress(
            install_id,
            phase="pending",
            file_count=file_count,
            files_completed=completed_names,
            message=f"Wszystkie pliki ({file_count}) już są na dysku — bez pobierania",
        )
        try:
            _finalize_installed(
                install_id,
                bundle_id,
                installed_files,
                completed_names,
                skipped_count=skipped_count,
                downloaded_count=0,
            )
        except Exception as exc:  # noqa: BLE001
            update_installation(install_id, status="failed", error_message=str(exc))
        return

    _set_progress(
        install_id,
        phase="pending",
        file_count=file_count,
        files_completed=completed_names,
        message=(
            f"Brakuje {download_count} z {file_count} plików"
            + (f", {skipped_count} już na dysku (pominięte)" if skipped_count else "")
        ),
    )

    try:
        step = 0
        for fe in already_present:
            step += 1
            size = fe.get("size_bytes") or 0
            dest = MODELS_ROOT / fe["relative_path"]
            _download_file_streaming(
                install_id,
                fe["repo_id"],
                fe["hf_path"],
                dest,
                file_index=step,
                file_count=file_count,
                files_completed=completed_names,
                skipped=True,
            )

        for fe in to_download:
            step += 1
            dest = MODELS_ROOT / fe["relative_path"]
            size = _download_file_streaming(
                install_id,
                fe["repo_id"],
                fe["hf_path"],
                dest,
                file_index=step,
                file_count=file_count,
                files_completed=completed_names,
            )
            completed_names.append(fe["filename"])
            installed_files.append(manifest_from_downloaded(fe, size))
            update_installation(install_id, files=installed_files)
            _set_progress(
                install_id,
                phase="downloading",
                file_index=step,
                file_count=file_count,
                current_filename=fe["filename"],
                bytes_downloaded=size,
                bytes_total=size,
                files_completed=completed_names,
                message=f"Pobrano {step}/{file_count}: {fe['filename']} ({format_bytes(size)})",
            )

        _finalize_installed(
            install_id,
            bundle_id,
            installed_files,
            completed_names,
            skipped_count=skipped_count,
            downloaded_count=download_count,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Install failed for %s", bundle_id)
        _set_progress(
            install_id,
            phase="failed",
            file_count=file_count,
            files_completed=completed_names,
            message=str(exc),
        )
        update_installation(
            install_id,
            status="failed",
            files=installed_files,
            error_message=str(exc),
        )


def _run_uninstall(install_id: int) -> None:
    record = get_installation(install_id)
    if not record:
        return

    files = record.get("files", [])
    update_installation(install_id, status="uninstalling")
    _set_progress(
        install_id,
        phase="uninstalling",
        file_count=len(files),
        message="Usuwanie plików z dysku…",
    )

    errors: list[str] = []
    removed: list[str] = []

    for i, f in enumerate(files, start=1):
        rel = f.get("relative_path")
        if not rel:
            continue
        path = MODELS_ROOT / rel
        name = Path(rel).name
        _set_progress(
            install_id,
            phase="uninstalling",
            file_index=i,
            file_count=len(files),
            current_filename=name,
            files_completed=removed,
            message=f"Usuwanie {i}/{len(files)}: {name}",
        )
        try:
            if path.is_file():
                path.unlink()
                logger.info("Removed %s", path)
            elif path.is_dir():
                shutil.rmtree(path)
            removed.append(name)
        except OSError as exc:
            errors.append(f"{rel}: {exc}")

    if errors:
        update_installation(
            install_id,
            status="failed",
            error_message="; ".join(errors),
            uninstalled_at=_utc_now(),
        )
    else:
        _set_progress(
            install_id,
            phase="done",
            message="Usunięto pliki pakietu",
        )
        update_installation(
            install_id,
            status="uninstalled",
            error_message=None,
            uninstalled_at=_utc_now(),
        )


def start_install(bundle_id: str) -> dict[str, Any]:
    raw = get_raw_bundle(bundle_id)
    if not raw:
        raise ValueError("Nieznaleziono pakietu.")

    analysis = analyze_bundle_files(raw)

    with _lock:
        active = get_active_installation(bundle_id)
        if active and active["status"] in ("pending", "downloading"):
            raise ValueError("Instalacja już trwa.")

        if active and active["status"] == "installed" and analysis["is_complete"]:
            raise ValueError(
                "Pakiet jest już kompletny na dysku. Użyj „Cofnij instalację”, jeśli chcesz usunąć pliki."
            )

        if analysis["is_complete"] and not active:
            record = create_installation(bundle_id)
            install_id = record["id"]
            thread = threading.Thread(
                target=_run_install,
                args=(install_id, bundle_id),
                daemon=True,
                name=f"install-sync-{bundle_id}-{install_id}",
            )
            _jobs[install_id] = thread
            thread.start()
            return get_installation(install_id)  # type: ignore[return-value]

        record = create_installation(bundle_id)
        install_id = record["id"]

        thread = threading.Thread(
            target=_run_install,
            args=(install_id, bundle_id),
            daemon=True,
            name=f"install-{bundle_id}-{install_id}",
        )
        _jobs[install_id] = thread
        thread.start()

    return get_installation(install_id)  # type: ignore[return-value]


def start_uninstall(bundle_id: str) -> dict[str, Any]:
    active = get_active_installation(bundle_id)
    if not active or active["status"] != "installed":
        raise ValueError("Brak aktywnej instalacji do cofnięcia.")

    install_id = active["id"]

    with _lock:
        thread = threading.Thread(
            target=_run_uninstall,
            args=(install_id,),
            daemon=True,
            name=f"uninstall-{bundle_id}-{install_id}",
        )
        _jobs[install_id] = thread
        thread.start()

    return get_installation(install_id)  # type: ignore[return-value]
