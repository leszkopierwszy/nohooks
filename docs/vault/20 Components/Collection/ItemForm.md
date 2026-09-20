---
tags:
  - component
  - collection
---

# ItemForm.vue

**Ścieżka:** `frontend/src/components/ItemForm.vue`

## Rola

Wspólny formularz **tworzenia i edycji** itemu (używany w [[AddCollectionItemModal]] i [[EditItemModal]]). Buduje payload API + opcjonalne uploady obrazów / cutoutów.

> Flow tworzenia: **[[Add item]]**

## Główne bloki

1. **Import ze sklepu** — URL → `product-parser` → autofill pól + kandydaci zdjęć.
2. **Pola produktu** — nazwa, kolekcja (`category_id`), typ (`category`), brand, rarity, like, season, size, body_zone / wear_layer, hosiery attrs, opis, notatki, cena / gift, source_url.
3. **Kolory** — multi-select kółkami z `COLOR_OPTIONS` (`form.colors[]`), nie pojedynczy `<select>`.
4. **Obrazy** — do N plików, kolejność = galeria; cutout / orientacja butów; opcjonalny trim tła.

## Payload kolorów

```js
colors: JSON.stringify(normalizeColorsForStorage(form.colors))
color: colors[0] ?? null
```

JSON string gwarantuje, że pusta lista czyści `colors` także przez FormData.

## Obrazy i cutout

- Import / upload → lokalne preview blob.
- Dla clothes/shoes: generacja cutoutu (`cutoutToPng` + tuning light/studio) jako sidecar.
- Buty: `prepareShoeCoverImage` (orientacja + cutout).
- `colorHint` do cutoutu = pierwszy z `form.colors`.

## Emit

- `@submit` → `{ payload, fileOptions }`
- `@cancel`
- Metody ekspozycji: `reset()`, `loadFromItem(item)`

## Powiązania

- Store: `items.js` (`createItem` / `updateItem` + FormData)
- Backend: `ItemController::validateItem` + `applyColors`
- Stałe: `itemColors.js`, `itemBrands.js`, `itemSizes.js`, …

---

## Vault

- [[Home]] · [[MOC Components]]
- [[AddCollectionItemModal]] · [[EditItemModal]] · [[Database schema]]
