# CollectionFiltersPanel.vue

**Ścieżka:** `frontend/src/components/CollectionFiltersPanel.vue`

## Rola

Panel filtrów nad listą itemów. Opcje budowane z **aktualnej listy** + zaznaczenie z query stringa.

## Mechanika

- `buildFilterSections(items, query, collectionName)` → sekcje: kolor, marka, rozmiar, sezon, satysfakcja, kategoria.
- Toggle zapisuje wartości w `route.query` (CSV), np. `?color=czarny,bialy`.
- Kolor: item przechodzi filtr, jeśli **którykolwiek** z `colors[]` jest zaznaczony.

## Powiązania

- `itemListFilters.js`
- `ProductList.vue` czyta te same query keys
