---
tags:
  - component
  - outfits
---

# FashionStylistModal.vue

**Ścieżka:** `frontend/src/components/outfit/FashionStylistModal.vue`

## Rola

UI Fashion AI: analiza szafy persony, propozycje outfitów z posiadanych itemów, luki w garderobie (`wardrobe_needs`), bez fałszywych produktów sklepowych.

## Przepływ

```mermaid
flowchart LR
  FE[FashionStylistModal] -->|POST stylist| BE[Laravel Fashion AI]
  BE --> MA[model-assistant / OpenAI]
  BE -->|catalog items + persona| MA
  MA -->|JSON schema response| BE
  BE --> FE
  FE -->|opcjonalnie save outfit| outfits API
```

## UI

- Wybór persony / okazji / kontekstu.
- Wynik: outfity z rolami itemów, narrative, structured needs.
- Akcja zapisu looku do `outfits` (source `llm`).

## Powiązania

- Backend: `FashionStylistService`, schema response, `fashion_stores` na userze
- `OutfitFlatLay` do podglądu
- Docs: nie mylić z VTON / persona doll (`persona-vision-comfyui-flow.md`)

---

## Vault

- [[Home]] · [[MOC Components]] · [[MOC Flows]]
- [[OutfitFlatLay]] · [[Database schema]]
