# Collection.vue

**Ścieżka:** `frontend/src/components/Collection.vue`

## Rola

Shell widoku **Style → Collection**. Na route `collection` pokazuje overview kategorii (kafelki kolekcji); zagnieżdżone trasy renderuje przez `<router-view />`.

## Dane

- Store: `useCollectionStore()` → `fetchCollections()` w `onMounted`.
- `categories` (computed): mapowanie kolekcji na `{ id, name, href, imageSrc, itemsCount }` dla `Categories.vue`.
- Cover kolekcji = cover pierwszego itemu (`cover` / `imageSrc`).

## Zachowanie

1. Wejście na `/collection` → lista kolekcji (`Categories`).
2. Klik kolekcji / deep link → child route (lista produktów / item) w `router-view`.
3. Błędy fetch są połykane (`.catch(() => {})`) — UI pokazuje pusty stan.

## Powiązania

- `Categories.vue` — grid kolekcji
- `ProductList.vue` — lista itemów w grupie
- `Product.vue` — szczegóły itemu
- Baza: tabela `categories` + `items.category_id`
