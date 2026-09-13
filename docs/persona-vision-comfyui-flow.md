# Persona Vision — przepływ Frontend → Backend → ComfyUI

Dokument opisuje, jak zdjęcie Prima przechodzi przez stack nohooks: od UI (Style / Prim overview), przez Laravel API, kolejkę ComfyUI, z powrotem do frontendu jako sylwetka (`avatar_doll_url`).

## Architektura (Mac, zalecane)

```mermaid
flowchart LR
  subgraph browser [Przeglądarka]
    FE[Vue frontend :5173]
  end

  subgraph docker [Docker Compose]
    BE[Laravel backend :8000]
  end

  subgraph host [Host macOS]
    CF[ComfyUI native :8188]
    EX[(comfyui-exchange/)]
    ST[(backend storage/public/)]
  end

  FE -->|"HTTP /api (Vite proxy)"| BE
  BE -->|"COMFYUI_BASE_URL\nhost.docker.internal:8188"| CF
  BE <-->|volume mount| EX
  CF <-->|input + output| EX
  BE <-->|avatar_source / avatar_doll| ST
  FE -->|"GET /storage/..."| BE
```

**Kluczowa zasada:** przeglądarka **nie** gada z ComfyUI. Tylko backend woła API Comfy; frontend dostaje gotowe URL-e z Laravel storage.

| Warstwa | Adres | Rola |
|---|---|---|
| Frontend | `http://localhost:5173` | Upload, przycisk „Generuj sylwetkę”, podgląd doll |
| Backend | `http://localhost:8000` | Auth, zapis Entity, staging plików, polling Comfy |
| ComfyUI | `http://127.0.0.1:8188` (z hosta) / `http://host.docker.internal:8188` (z kontenera backendu) | Uruchomienie workflow `avatar.api.json` / `vton.api.json` |
| Exchange | `./comfyui-exchange` | Wspólny katalog input/output między backendem a Comfy |

Konfiguracja: `COMFYUI_BASE_URL` w root `.env` + `backend/.env` (domyślnie `http://host.docker.internal:8188`).

---

## Sekwencja: generowanie sylwetki (avatar doll)

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Frontend<br/>Style / Prim
  participant API as Backend<br/>PersonaImageController
  participant Svc as PersonaImageProcessingService
  participant Comfy as ComfyUIProvider
  participant Disk as Storage + exchange
  participant CU as ComfyUI :8188

  User->>FE: Wgraj zdjęcie Prima
  FE->>API: POST /api/entity/{id}/avatar<br/>(multipart photo)
  API->>Disk: storage/public/persona-ai/sources/...
  API->>API: Entity.avatar_source_url = /storage/...
  API-->>FE: { avatar_source_url }

  User->>FE: Generuj sylwetkę
  FE->>API: POST /api/entity/{id}/avatar/generate<br/>(JSON {} lub photo)
  Note over API: Jeśli brak photo — używa<br/>Entity.avatar_source_url

  API->>Svc: generateAvatarFromUserPhoto(source)
  Svc->>Disk: resolve lokalną ścieżkę źródła
  Svc->>Comfy: generateDollAvatar(localPath)

  Comfy->>Disk: copy → comfyui-exchange/input/persona/*.png
  Comfy->>Comfy: załaduj workflows/avatar.api.json<br/>+ podmień node LoadImage
  Comfy->>CU: POST /prompt { prompt, client_id }
  CU-->>Comfy: { prompt_id }

  loop Poll co ~1.5s
    Comfy->>CU: GET /history/{prompt_id}
    CU-->>Comfy: status / outputs
  end

  Comfy->>Disk: odczyt output z exchange
  Comfy->>Disk: zapisz do storage/public/persona-ai/avatars/...
  Comfy-->>Svc: ProcessingResult(outputUrl)
  Svc->>API: Entity.avatar_doll_url = ...
  API-->>FE: { avatar_doll_url, output_url, ... }

  FE->>FE: odśwież store Primów
  FE->>API: GET /storage/persona-ai/avatars/...
  API-->>FE: obraz sylwetki
  FE-->>User: podgląd doll po lewej w Style
```

---

## Sekwencja: virtual try-on (ubiór na doll)

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as Backend
  participant Comfy as ComfyUIProvider
  participant CU as ComfyUI
  participant DB as EntityTryOn

  FE->>API: POST /api/entity/{id}/try-on<br/>{ garment_image_url, item_id? }
  Note over API: Wymaga avatar_doll_url<br/>(lub avatar_source_url)
  API->>Comfy: virtualTryOn(avatar, garment)
  Comfy->>CU: POST /prompt (vton.api.json)
  CU-->>Comfy: wynik obrazu
  Comfy->>DB: zapisz EntityTryOn + URL wyniku
  API-->>FE: { output_url, ... }
```

---

## Endpointy HTTP (backend)

Wszystkie pod `auth:sanctum`.

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/persona-vision/status` | `{ provider, configured, comfyui_url }` — health Comfy |
| `POST` | `/api/entity/{entity}/avatar` | Upload zdjęcia źródłowego (bez AI) |
| `DELETE` | `/api/entity/{entity}/avatar` | Czyści source + doll |
| `POST` | `/api/entity/{entity}/avatar/generate` | Generuje doll (Comfy workflow `avatar`) |
| `POST` | `/api/entity/{entity}/try-on` | Virtual try-on (workflow `vton`) |
| `GET` | `/api/entity/{entity}/try-ons` | Historia przymiarek |

Frontend client: [`frontend/src/services/personaImageProcessing.js`](frontend/src/services/personaImageProcessing.js)  
UI Style: [`frontend/src/views/Style.vue`](frontend/src/views/Style.vue) (lewa kolumna = sylwetka).

---

## Co dzieje się z plikami

```mermaid
flowchart TB
  subgraph upload [1. Upload]
    A[Zdjęcie użytkownika] --> B["storage/app/public/persona-ai/sources/YYYY/MM/"]
    B --> C[Entity.avatar_source_url]
  end

  subgraph stage [2. Staging przed Comfy]
    C --> D[resolve lokalny path]
    D --> E["comfyui-exchange/input/persona/{uuid}.png"]
    E --> F["LoadImage path: persona/{uuid}.png"]
  end

  subgraph run [3. ComfyUI]
    F --> G["POST /prompt"]
    G --> H["comfyui-exchange/output/..."]
  end

  subgraph save [4. Persist]
    H --> I["storage/app/public/persona-ai/avatars/"]
    I --> J[Entity.avatar_doll_url]
    J --> K[Frontend img src]
  end
```

Volume w `docker-compose.yml`:

- `./comfyui-exchange` → backend: `storage/app/comfyui-exchange`
- ten sam katalog = Comfy `--input-directory` / `--output-directory` (skrypt native)

Dzięki temu **obrazy nie wychodzą na zewnętrzne API** — tylko lokalny stack.

---

## Warstwa kodu (backend)

```text
PersonaImageController          HTTP, walidacja, JSON response
        │
        ▼
PersonaImageProcessingService   wybór providera, persist Entity
        │
        ▼
ComfyUIProvider                 stage plików, /prompt, poll /history
        │
        ▼
ComfyUIWorkflowBuilder          ładuje *.api.json + inject node inputs
```

Workflowy: [`comfyui/workflows/avatar.api.json`](comfyui/workflows/avatar.api.json), [`comfyui/workflows/vton.api.json`](comfyui/workflows/vton.api.json)  
Mapowanie ID węzłów: `config/persona_ai.php` → `comfyui.node_map`.

---

## Uruchomienie (Mac)

1. Stack aplikacji: `docker compose up -d`
2. ComfyUI na hoście (MPS): `./scripts/start-comfyui-native.sh`
3. Sprawdź: `GET /api/persona-vision/status` → `configured: true`, `comfyui_url: http://host.docker.internal:8188`
4. UI Comfy: http://127.0.0.1:8188

**Uwaga:** obecny `avatar.api.json` to szablon (LoadImage → SaveImage). Żeby dostać prawdziwą „lalkę”, trzeba podmienić graf w ComfyUI (np. SD + OpenPose/ControlNet), wyeksportować **Save (API Format)** i zaktualizować `node_map` w configu.

---

## Typowe błędy

| Objaw | Znaczenie |
|---|---|
| `Brak połączenia z ComfyUI (http://comfyui:8188)` | Zły `COMFYUI_BASE_URL` albo stary proces backendu — ma być `host.docker.internal:8188` + recreate backend |
| `Brak połączenia z ComfyUI (http://host.docker.internal:8188)` | Comfy nie działa — odpal `./scripts/start-comfyui-native.sh` |
| `Prompt outputs failed validation` | Workflow API nie pasuje do grafu / placeholder — popraw `avatar.api.json` |
| `configured: false` przy status | Backend nie dosięga Comfy (sieć lub proces) |
