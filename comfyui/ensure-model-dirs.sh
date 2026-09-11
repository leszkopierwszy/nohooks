#!/bin/sh
# Tworzy standardowe podkatalogi ComfyUI/models (idempotentne przy każdym starcie).
set -eu

MODELS_DIR="${COMFYUI_MODELS_DIR:-/opt/ComfyUI/models}"

mkdir -p "${MODELS_DIR}"

for sub in \
  checkpoints \
  clip \
  clip_vision \
  controlnet \
  diffusion_models \
  embeddings \
  loras \
  text_encoders \
  unet \
  upscale_models \
  vae \
  vae_approx
do
  mkdir -p "${MODELS_DIR}/${sub}"
done

# Plik informacyjny — gdzie na hoście leżą modele (ścieżka z docker-compose)
if [ -n "${COMFYUI_MODELS_HOST_PATH:-}" ]; then
  printf '%s\n' "${COMFYUI_MODELS_HOST_PATH}" > "${MODELS_DIR}/HOST_PATH.txt"
  printf 'Modele na Macu: %s\n' "${COMFYUI_MODELS_HOST_PATH}" >&2
fi
