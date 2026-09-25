---
tags:
  - flow
  - stylist
  - outfits
  - capsule
---

# Stylist outfit capsule

Przepływ Stylisty: looki z posiadanej szafy, baza szafy (kompletne outfity), kapsuły z brakującymi rolami.

Pełny opis (API, serwisy, UI): [stylist-outfit-capsule-flow.md](../../stylist-outfit-capsule-flow.md) w `docs/`.

## Tryby

1. **Build outfit** — manual (`OutfitItemPicker`) lub AI (`/fashion-stylist/suggest`) → zapis looka (`outfits.wear_date = null`)
2. **Base wardrobe** — `OutfitCompatibilityService` / `POST /fashion-stylist/base-wardrobe`
3. **Build capsule** — `CapsuleBuilderService` / `POST /capsule/analyze` → opcjonalnie `POST /capsule`

## Powiązane

- [[FashionStylistModal]]
- [[OutfitFlatLay]]
- [[Database schema]]
