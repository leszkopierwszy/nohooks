# Product.vue

**Ścieżka:** `frontend/src/components/Product.vue`

## Rola

Strona szczegółów jednego itemu: galeria, meta, cena, kolory, rozmiar, persona fit, edycja / powielenie / usuwanie.

## Props / route

- `name` — nazwa kolekcji (parametr URL)
- `item_name` — ID itemu
- `groupId` — query / prop kolekcji

Item resolvowany przez `collectionStore.itemByGroupId` lub `itemById`.

## Sekcje UI

| Sekcja | Źródło |
|---|---|
| Breadcrumbs | Collection → (All items) → grupa → category |
| Galeria | `itemGalleryUrls(item)` → `ItemImage` |
| Cena | `current_value` / `purchase_price_pln` / gift |
| Kolory | `itemColorsList(item)` — swatche + nazwy |
| Rozmiar | clothing vs shoes (`size_system` EU/US toggle) |
| Persona fit | `fits_all_personas` / `default_persona_id` |
| Akcje | Edytuj → `EditItemModal`; Powiel → `itemsStore.duplicateItem` |

## Kolory

Pokazuje **wszystkie** warianty z `colors[]` (nie tylko `color`). Po zapisie w modalu lista się odświeża przez `fetchCollections`.

## Powiązania

- `EditItemModal.vue`, `ItemImage.vue`, `LikeRatingPicker.vue`
- API: `PUT/DELETE /item/{id}`, duplicate service po stronie backendu
