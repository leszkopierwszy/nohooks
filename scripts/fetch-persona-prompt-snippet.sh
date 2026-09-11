#!/usr/bin/env bash
# Pobiera parametry ciała persony z API nohooks (do wklejenia w ComfyUI).
# Uzycie: ./scripts/fetch-persona-prompt-snippet.sh <entity_id>
set -euo pipefail

ENTITY_ID="${1:-}"
API="${NOHOOKS_API_URL:-http://localhost:8000/api}"

if [ -z "$ENTITY_ID" ]; then
  echo "Uzycie: $0 <entity_id>" >&2
  echo "Lista person: curl -s ${API}/entity | python3 -m json.tool" >&2
  exit 1
fi

curl -sf "${API}/entity/${ENTITY_ID}/body-snapshots/prompt-snippet" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(d.get('prompt_snippet') or '(brak danych w profilu ciala — uzupelnij w Persona Body Profile)')
"
