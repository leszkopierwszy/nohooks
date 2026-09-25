#!/usr/bin/env bash
# ComfyUI natywnie na Macu (Apple Silicon / MPS) — szybkie generowanie z GPU.
#
#   ./scripts/setup-comfyui-native.sh   # jednorazowo (klon + venv + pip)
#   ./scripts/start-comfyui-native.sh   # uruchom serwer
#
set -euo pipefail

SETUP_ONLY=0
if [ "${1:-}" = "--setup-only" ]; then
  SETUP_ONLY=1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "-> Utworzono .env z .env.example"
fi

# shellcheck disable=SC1091
# Ładuj tylko COMFYUI_* (cały .env może mieć spacje w wartościach i wywalić set -e).
if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
      COMFYUI_*=*)
        key="${line%%=*}"
        val="${line#*=}"
        val="${val%\"}"
        val="${val#\"}"
        val="${val%\'}"
        val="${val#\'}"
        export "$key=$val"
        ;;
    esac
  done < .env
fi

MODELS_PATH="${COMFYUI_MODELS_HOST_PATH:-./comfyui-models}"
USER_PATH="${COMFYUI_USER_HOST_PATH:-./comfyui/user}"
PORT="${COMFYUI_PORT:-8188}"
NATIVE_HOME="${COMFYUI_NATIVE_HOME:-$ROOT/.comfyui-native/ComfyUI}"
VENV_DIR="${COMFYUI_NATIVE_VENV:-$ROOT/.comfyui-native/venv}"
EXCHANGE_DIR="$ROOT/comfyui-exchange"

if [[ "$MODELS_PATH" != /* ]]; then
  MODELS_PATH="$ROOT/$MODELS_PATH"
fi
if [[ "$USER_PATH" != /* ]]; then
  USER_PATH="$ROOT/$USER_PATH"
fi

pick_python() {
  for cmd in python3.12 python3.11 python3.10 python3; do
    if command -v "$cmd" >/dev/null 2>&1; then
      ver="$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
      major="${ver%%.*}"
      minor="${ver#*.}"
      if [ "$major" -eq 3 ] && [ "$minor" -ge 10 ] && [ "$minor" -le 12 ]; then
        echo "$cmd"
        return 0
      fi
    fi
  done
  echo "ERROR: Potrzebny Python 3.10-3.12 (np. brew install python@3.12)" >&2
  exit 1
}

PYTHON_BIN="$(pick_python)"
echo "-> Python: $PYTHON_BIN ($("$PYTHON_BIN" --version))"

mkdir -p "$EXCHANGE_DIR/input/persona" "$EXCHANGE_DIR/output"
COMFYUI_MODELS_DIR="$MODELS_PATH" COMFYUI_MODELS_HOST_PATH="$MODELS_PATH" \
  bash "$ROOT/comfyui/ensure-model-dirs.sh"

PATHS_YAML="$ROOT/comfyui/extra_model_paths.generated.yaml"
sed "s|PLACEHOLDER_MODELS_DIR|${MODELS_PATH}/|g" "$ROOT/comfyui/extra_model_paths.yaml" > "$PATHS_YAML"

if [ ! -d "$NATIVE_HOME/.git" ] && [ ! -f "$NATIVE_HOME/main.py" ]; then
  echo "-> Klonowanie ComfyUI do ${NATIVE_HOME}..."
  mkdir -p "$(dirname "$NATIVE_HOME")"
  git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git "$NATIVE_HOME"
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "-> Tworzenie venv (${VENV_DIR})..."
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"

if [ ! -f "$VENV_DIR/.nohooks-requirements-installed" ]; then
  echo "-> Instalacja PyTorch + ComfyUI (kilka minut)..."
  pip install --upgrade pip
  pip install torch torchvision torchaudio
  pip install -r "$NATIVE_HOME/requirements.txt"
  touch "$VENV_DIR/.nohooks-requirements-installed"
fi

python -c "import torch; print('OK PyTorch', torch.__version__, '| MPS:', torch.backends.mps.is_available())"

MANAGER_DIR="$NATIVE_HOME/custom_nodes/comfyui-manager"
if [ ! -f "$MANAGER_DIR/__init__.py" ]; then
  echo "-> ComfyUI-Manager..."
  git clone --depth 1 https://github.com/Comfy-Org/ComfyUI-Manager.git "$MANAGER_DIR"
  pip install -r "$MANAGER_DIR/requirements.txt" 2>/dev/null || true
fi

FANTASY="$NATIVE_HOME/custom_nodes/ComfyUI-GGUF-FantasyTalking"
if [ -d "$FANTASY" ]; then
  mkdir -p "$NATIVE_HOME/_disabled_custom_nodes"
  mv "$FANTASY" "$NATIVE_HOME/_disabled_custom_nodes/" 2>/dev/null || rm -rf "$FANTASY"
fi

mkdir -p "$USER_PATH/default/workflows"

if [ "$SETUP_ONLY" -eq 1 ] || [ "${NOHOOKS_SETUP_ONLY:-}" = "1" ]; then
  echo ""
  echo "OK ComfyUI gotowe w: ${NATIVE_HOME}"
  echo "  Uruchom: ./scripts/start-comfyui-native.sh"
  echo "  UI:      http://127.0.0.1:${PORT}"
  exit 0
fi

echo ""
echo "============================================================"
echo "  ComfyUI NATYWNY (MPS) - http://127.0.0.1:${PORT}"
echo "  Modele:   ${MODELS_PATH}"
echo "  Workflow: ${USER_PATH}"
echo "============================================================"
echo ""

cd "$NATIVE_HOME"
exec python main.py \
  --listen 0.0.0.0 \
  --port "$PORT" \
  --user-directory "$USER_PATH" \
  --extra-model-paths-config "$PATHS_YAML" \
  --input-directory "$EXCHANGE_DIR/input" \
  --output-directory "$EXCHANGE_DIR/output"
