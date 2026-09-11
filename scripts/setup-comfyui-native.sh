#!/usr/bin/env bash
# Jednorazowa instalacja natywnego ComfyUI (bez uruchamiania serwera).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export NOHOOKS_SETUP_ONLY=1
exec "$ROOT/scripts/start-comfyui-native.sh" --setup-only
