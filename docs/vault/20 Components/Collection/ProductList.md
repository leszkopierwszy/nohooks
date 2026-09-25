---
tags:
  - component
  - collection
---

# ProductList.vue

**Ścieżka:** `frontend/src/components/ProductList.vue`

## Rola

Siatka produktów w kolekcji albo widoku „All items”. Każdy kafelek prowadzi do szczegółów itemu.

## Props

| Prop | Opis |
|---|---|
| `groupId` | ID kolekcji (`categories.id`) |
| `collectionName` | Alternatywa do `groupId` (lookup po nazwie) |
| `allItems` | `true` → lista z `browseAllItems` (+ opcjonalny `?collectionId=`) |

## Dane i filtry

1. Źródło: `collectionStore.itemsByGroupId` albo `browseAllItems`.
2. Filtry z `route.query` przez `applyItemFilters` (`color`, `brand`, `size`, `season`, `likeRating`, `category`).
3. Filtr koloru matchuje **dowolny** kolor z `item.colors` (fallback: `item.color`).

## UI kafelka

```
┌─────────────────┐
│  ItemImage      │  szare tło #f3f4f6, ring, normalize + cleanFringe
│  (kwadrat)      │
├─────────────────┤
│  etykieta koloru│  aktywny swatch / primary
│  nazwa          │
│  rarity · brand │
│  meta (typ/sezon)│
├─────────────────┤
│  ○ ○ ○  swatche │  lokalny wybór etykiety (nie zmienia DB)
└─────────────────┘
```

### ItemImage (w siatce)

- `fixed-background="#f3f4f6"` — białe produkty nie zlewają się z tłem
- `normalize-scale` + `normalize-align="center"` + `normalize-fill="0.72"`
- `clean-fringe` — usuwa white spill / szarego „ducha” na istniejących PNG cutoutach

## Nawigacja

`goToProduct(id)` → route `item-overview` z `groupId` i opcjonalnie `fromAll=1`.

## Powiązania

- `ItemImage.vue`, `itemColors.js`, `itemListFilters.js`
- Store: `collection.js` (`mapApiItem` mapuje `colors`)

---

## Vault

- [[Home]] · [[MOC Components]]
- [[ItemImage]] · [[Product]] · [[CollectionFiltersPanel]] · [[Database schema]]
