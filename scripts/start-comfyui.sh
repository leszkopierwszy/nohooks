#!/usr/bin/env bash
# ComfyUI w Dockerze (CPU — wolne na Macu). Na M3 użyj: ./scripts/start-comfyui-native.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Utworzono .env z .env.example"
fi

MODELS_PATH="$(grep -E '^COMFYUI_MODELS_HOST_PATH=' .env 2>/dev/null | cut -d= -f2- || echo './comfyui-models')"
echo "→ Modele na hoście: ${MODELS_PATH} (montowane do /opt/ComfyUI/models)"
echo "→ Na Macu z MPS szybciej: ./scripts/start-comfyui-native.sh"

echo "→ Budowanie obrazu nohooks-comfyui (ComfyUI + Manager, pierwszy raz ~5–15 min)..."
docker compose --profile docker-comfyui build comfyui

echo "→ Uruchamianie kontenera nohooks-comfyui..."
docker compose --profile docker-comfyui up -d comfyui

echo "→ Czekam na API..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8188/system_stats >/dev/null 2>&1; then
    echo "✓ ComfyUI działa: http://localhost:8188"
    docker compose --profile docker-comfyui ps comfyui
    exit 0
  fi
  sleep 2
done

echo "✗ ComfyUI nie odpowiada — logi:"
docker compose --profile docker-comfyui logs comfyui --tail 40
exit 1
