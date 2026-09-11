#!/bin/sh
# Instalacja ComfyUI-Manager (Comfy-Org) — https://github.com/Comfy-Org/ComfyUI-Manager
set -eu

COMFYUI_DIR="${COMFYUI_DIR:-/opt/ComfyUI}"
MANAGER_REPO="${COMFYUI_MANAGER_REPO:-https://github.com/Comfy-Org/ComfyUI-Manager.git}"
MANAGER_DIR="${COMFYUI_DIR}/custom_nodes/comfyui-manager"

cd "${COMFYUI_DIR}"
mkdir -p custom_nodes

if [ ! -f "${MANAGER_DIR}/__init__.py" ]; then
  echo "→ Klonowanie ComfyUI-Manager do custom_nodes/comfyui-manager…"
  git clone --depth 1 "${MANAGER_REPO}" "${MANAGER_DIR}"
fi

echo "→ Zależności ComfyUI-Manager…"
"${PIP:-pip}" install --no-cache-dir -r "${MANAGER_DIR}/requirements.txt"

# Kopia na wypadek pustego volume custom_nodes przy pierwszym starcie
rm -rf "${COMFYUI_DIR}/_bundled_comfyui_manager"
cp -a "${MANAGER_DIR}" "${COMFYUI_DIR}/_bundled_comfyui_manager"

echo "✓ ComfyUI-Manager gotowy"
