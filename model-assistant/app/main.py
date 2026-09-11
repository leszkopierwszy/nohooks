from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .catalog import get_bundle, list_bundles_with_status, models_storage_stats
from .config import MODELS_ROOT
from .custom_catalog import add_custom_bundle, delete_custom_bundle, is_custom_bundle
from .database import get_installation, init_db, list_installations
from .installer import start_install, start_uninstall
from .observability import get_observability_status
from .schemas import CreateCustomBundleRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Nohooks Backend Settings", version="1.0.0")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@app.on_event("startup")
def on_startup() -> None:
    MODELS_ROOT.mkdir(parents=True, exist_ok=True)
    init_db()
    logger.info("Models root: %s", MODELS_ROOT)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, **models_storage_stats()}


@app.get("/api/observability")
def api_observability() -> dict:
    return get_observability_status()


@app.get("/api/bundles")
def api_bundles() -> dict:
    return {
        "bundles": list_bundles_with_status(),
        "storage": models_storage_stats(),
    }


@app.post("/api/bundles/custom")
def api_create_custom_bundle(body: CreateCustomBundleRequest) -> dict:
    urls: list[str] = []
    if body.hf_url:
        urls.append(body.hf_url)
    if body.hf_urls:
        urls.extend(body.hf_urls)
    if not urls:
        raise HTTPException(422, "Podaj hf_url lub hf_urls.")

    try:
        bundle = add_custom_bundle(
            hf_urls=urls,
            name=body.name,
            description=body.description,
            target_subdir=body.target_subdir,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    enriched = get_bundle(bundle["id"])
    return {"bundle": enriched}


@app.delete("/api/bundles/custom/{bundle_id}")
def api_delete_custom_bundle(bundle_id: str) -> dict:
    if not is_custom_bundle(bundle_id):
        raise HTTPException(400, "Można usunąć tylko pakiety dodane ręcznie (custom-…).")
    if not delete_custom_bundle(bundle_id):
        raise HTTPException(404, "Nie znaleziono pakietu.")
    return {"ok": True, "bundle_id": bundle_id}


@app.get("/api/bundles/{bundle_id}")
def api_bundle(bundle_id: str) -> dict:
    bundle = get_bundle(bundle_id)
    if not bundle:
        raise HTTPException(404, "Nie znaleziono pakietu")
    return bundle


@app.post("/api/bundles/{bundle_id}/install")
def api_install(bundle_id: str) -> dict:
    if not get_bundle(bundle_id):
        raise HTTPException(404, "Nie znaleziono pakietu")
    try:
        installation = start_install(bundle_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    return {"installation": installation}


@app.post("/api/bundles/{bundle_id}/uninstall")
def api_uninstall(bundle_id: str) -> dict:
    if not get_bundle(bundle_id):
        raise HTTPException(404, "Nie znaleziono pakietu")
    try:
        installation = start_uninstall(bundle_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    return {"installation": installation}


@app.get("/api/installations")
def api_installations() -> dict:
    return {"installations": list_installations()}


@app.get("/api/installations/{install_id}")
def api_installation(install_id: int) -> dict:
    row = get_installation(install_id)
    if not row:
        raise HTTPException(404, "Brak instalacji")
    return row


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
