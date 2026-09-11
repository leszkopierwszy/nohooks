"""Parsowanie linków Hugging Face → repo_id + ścieżka pliku w repozytorium."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

HF_FILE_URL = re.compile(
    r"^https?://(?:www\.)?huggingface\.co/"
    r"(?P<repo>[\w.-]+/[\w.-]+)"
    r"/(?:resolve|blob|tree)/"
    r"(?:main|master|[^/]+)/"
    r"(?P<path>.+)$",
    re.IGNORECASE,
)

HF_REPO_URL = re.compile(
    r"^https?://(?:www\.)?huggingface\.co/(?P<repo>[\w.-]+/[\w.-]+)/?$",
    re.IGNORECASE,
)

MODEL_EXTENSIONS = {".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".gguf", ".onnx"}


def infer_target_subdir(hf_path: str, filename: str) -> str:
    lower = hf_path.lower().replace("\\", "/")
    for segment in (
        "diffusion_models",
        "text_encoders",
        "vae",
        "loras",
        "checkpoints",
        "controlnet",
        "clip",
        "unet",
        "upscale_models",
        "embeddings",
    ):
        if f"/{segment}/" in f"/{lower}/" or lower.startswith(f"{segment}/"):
            return segment

    name_lower = filename.lower()
    if "lora" in name_lower or "lightning" in name_lower:
        return "loras"
    if "vae" in name_lower and "diffusion" not in name_lower:
        return "vae"
    if "encoder" in name_lower or "vl_" in name_lower or name_lower.startswith("qwen_"):
        return "text_encoders"

    return "diffusion_models"


def parse_hf_url(url: str) -> dict[str, str]:
    url = url.strip()
    if not url:
        raise ValueError("Pusty link.")

    parsed = urlparse(url)
    if "huggingface.co" not in parsed.netloc:
        raise ValueError("Obsługiwane są tylko linki huggingface.co")

    normalized = url.split("?")[0].rstrip("/")
    match = HF_FILE_URL.match(normalized)
    if match:
        repo_id = match.group("repo")
        hf_path = unquote(match.group("path"))
        filename = Path(hf_path).name
        if not filename or Path(hf_path).suffix.lower() not in MODEL_EXTENSIONS:
            if not any(hf_path.lower().endswith(ext) for ext in MODEL_EXTENSIONS):
                raise ValueError(
                    f"Link nie wskazuje na plik modelu ({', '.join(MODEL_EXTENSIONS)}): {filename or hf_path}"
                )
        return {
            "repo_id": repo_id,
            "hf_path": hf_path,
            "filename": filename,
            "hf_page": f"https://huggingface.co/{repo_id}",
        }

    repo_match = HF_REPO_URL.match(normalized)
    if repo_match:
        raise ValueError(
            "Podaj link do konkretnego pliku (zakładka resolve/blob/tree z nazwą pliku), "
            "nie tylko stronę repozytorium."
        )

    raise ValueError(
        "Nierozpoznany format. Przykład: "
        "https://huggingface.co/Comfy-Org/z_image/resolve/main/split_files/vae/ae.safetensors"
    )


def parse_hf_urls(urls: list[str]) -> list[dict[str, Any]]:
    files = []
    seen: set[tuple[str, str]] = set()
    for raw in urls:
        for line in raw.replace(",", "\n").split("\n"):
            line = line.strip()
            if not line:
                continue
            parsed = parse_hf_url(line)
            key = (parsed["repo_id"], parsed["hf_path"])
            if key in seen:
                continue
            seen.add(key)
            filename = parsed["filename"]
            files.append(
                {
                    "repo_id": parsed["repo_id"],
                    "hf_path": parsed["hf_path"],
                    "target_subdir": infer_target_subdir(parsed["hf_path"], filename),
                    "filename": filename,
                }
            )
    if not files:
        raise ValueError("Nie podano żadnego poprawnego linku.")
    return files
