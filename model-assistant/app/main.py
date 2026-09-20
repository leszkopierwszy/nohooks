from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .catalog import get_bundle, list_bundles_with_status, models_storage_stats
from .config import MODELS_ROOT
from .custom_catalog import add_custom_bundle, delete_custom_bundle, is_custom_bundle
from .database import get_installation, init_db, list_installations
from .fashion_ai import (
    activate_key,
    add_key,
    delete_key,
    internal_token_ok,
    prompt_preview,
    public_status,
    runtime_credentials,
    set_system_prompt,
    update_settings,
)
from .fashion_logs import append_log, clear_logs, get_log, list_logs
from .installer import start_install, start_uninstall
from .observability import get_observability_status
from .schemas import (
    CreateCustomBundleRequest,
    FashionAiKeyCreate,
    FashionAiLogCreate,
    FashionAiPromptUpdate,
    FashionAiSettingsUpdate,
)
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


@app.get("/api/fashion-ai/settings")
def api_fashion_ai_settings() -> dict:
    return public_status()


@app.put("/api/fashion-ai/settings")
def api_fashion_ai_settings_update(body: FashionAiSettingsUpdate) -> dict:
    return update_settings(
        api_key=body.api_key,
        clear_api_key=body.clear_api_key,
        model=body.model,
        base_url=body.base_url,
        label=body.label,
        invocation_mode=body.invocation_mode,
        agent_id=body.agent_id,
        clear_agent_id=body.clear_agent_id,
    )


@app.post("/api/fashion-ai/keys")
def api_fashion_ai_key_create(body: FashionAiKeyCreate) -> dict:
    try:
        return add_key(
            api_key=body.api_key,
            label=body.label or "",
            activate=body.activate,
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.post("/api/fashion-ai/keys/{key_id}/activate")
def api_fashion_ai_key_activate(key_id: str) -> dict:
    try:
        return activate_key(key_id)
    except KeyError as exc:
        raise HTTPException(404, "Key not found") from exc


@app.delete("/api/fashion-ai/keys/{key_id}")
def api_fashion_ai_key_delete(key_id: str) -> dict:
    try:
        return delete_key(key_id)
    except KeyError as exc:
        raise HTTPException(404, "Key not found") from exc


@app.get("/api/fashion-ai/prompt")
def api_fashion_ai_prompt() -> dict:
    return prompt_preview()


@app.put("/api/fashion-ai/prompt")
def api_fashion_ai_prompt_update(body: FashionAiPromptUpdate) -> dict:
    return set_system_prompt(body.system_prompt, reset=body.reset)


@app.get("/api/fashion-ai/logs")
def api_fashion_ai_logs(limit: int = 50) -> dict:
    return list_logs(limit=limit)


@app.get("/api/fashion-ai/logs/{log_id}")
def api_fashion_ai_log_detail(log_id: str) -> dict:
    entry = get_log(log_id)
    if not entry:
        raise HTTPException(404, "Log not found")
    return entry


@app.post("/api/fashion-ai/logs")
def api_fashion_ai_log_create(
    body: FashionAiLogCreate,
    x_fashion_ai_token: str | None = Header(default=None, alias="X-Fashion-Ai-Token"),
) -> dict:
    """Internal: Laravel pushes OpenAI request/response traces here."""
    if not internal_token_ok(x_fashion_ai_token):
        raise HTTPException(403, "Invalid fashion AI internal token.")
    return append_log(body.model_dump())


@app.delete("/api/fashion-ai/logs")
def api_fashion_ai_logs_clear() -> dict:
    return clear_logs()


@app.get("/api/fashion-ai/runtime")
def api_fashion_ai_runtime(
    x_fashion_ai_token: str | None = Header(default=None, alias="X-Fashion-Ai-Token"),
) -> dict:
    """Internal: Laravel reads OpenAI credentials from here."""
    if not internal_token_ok(x_fashion_ai_token):
        raise HTTPException(403, "Invalid fashion AI internal token.")
    return runtime_credentials()


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
    return FileResponse(
        STATIC_DIR / "index.html",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        },
    )


@app.middleware("http")
async def no_cache_static_js(request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/static/") and (
        path.endswith(".js") or path.endswith(".css") or path.endswith(".html")
    ):
        response.headers["Cache-Control"] = "no-store, max-age=0"
    return response


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
