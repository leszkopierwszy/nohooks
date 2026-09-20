---
tags:
  - component
  - collection
---

# EditItemModal.vue

**Ścieżka:** `frontend/src/components/EditItemModal.vue`

## Rola

Modal edycji istniejącego itemu: ładuje dane do `ItemForm`, zapis, usuwanie, opcjonalne powielenie.

## Typowy przepływ

1. Parent (`Product.vue`) ustawia `open` + `itemId`.
2. Modal pobiera item / ustawia form przez `loadFromItem`.
3. Save → `itemsStore.updateItem` (+ obrazy FormData gdy zmienione).
4. Delete / duplicate → store + eventy `@saved` / `@deleted` / `@duplicated`.

Po zapisie parent odświeża `collectionStore.fetchCollections()`, żeby siatka i kolory były aktualne.

---

## Vault

- [[Home]] · [[MOC Components]]
- [[ItemForm]] · [[Product]]
