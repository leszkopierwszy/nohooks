#!/bin/sh
# Przy pustym volume custom_nodes odtwarza ComfyUI-Manager z kopii w obrazie.
set -eu

COMFYUI_DIR="${COMFYUI_DIR:-/opt/ComfyUI}"
MANAGER_DIR="${COMFYUI_DIR}/custom_nodes/comfyui-manager"
BUNDLED="${COMFYUI_DIR}/_bundled_comfyui_manager"

cd "${COMFYUI_DIR}"

mkdir -p user/default/workflows

if [ -x /ensure-model-dirs.sh ]; then
  /ensure-model-dirs.sh
fi

if [ ! -f "${MANAGER_DIR}/__init__.py" ]; then
  echo "→ Brak ComfyUI-Manager w volume — przywracam…"
  mkdir -p custom_nodes
  if [ -d "${BUNDLED}" ]; then
    cp -a "${BUNDLED}" "${MANAGER_DIR}"
  else
    git clone --depth 1 https://github.com/Comfy-Org/ComfyUI-Manager.git "${MANAGER_DIR}"
    "${PIP:-pip}" install --no-cache-dir -r "${MANAGER_DIR}/requirements.txt"
  fi
fi

# Uszkodzony custom node (SyntaxError w nodes.py) — powoduje niestabilność i restarty Managera
FANTASY_DIR="${COMFYUI_DIR}/custom_nodes/ComfyUI-GGUF-FantasyTalking"
if [ -d "${FANTASY_DIR}" ]; then
  echo "→ Wyłączam uszkodzony ComfyUI-GGUF-FantasyTalking (przenoszę poza custom_nodes)…"
  mkdir -p "${COMFYUI_DIR}/_disabled_custom_nodes"
  mv "${FANTASY_DIR}" "${COMFYUI_DIR}/_disabled_custom_nodes/ComfyUI-GGUF-FantasyTalking" 2>/dev/null || rm -rf "${FANTASY_DIR}"
fi

exec python main.py "$@"
