# AddCollectionItemModal.vue

**Ścieżka:** `frontend/src/components/AddCollectionItemModal.vue`

## Rola

Modal „Add item” w kontekście wybranej kolekcji. Opakowuje `ItemForm`.

> Pełny przepływ end-to-end: [flows/add-item.md](../flows/add-item.md)

## Props / eventy

| | |
|---|---|
| `open`, `groupId`, `collectionName` | Wejście |
| `@close`, `@added` | Wyjście |

## Przepływ

1. Otwarcie → `fetchCollections`, `itemFormRef.reset()`, `default-category-id = groupId`.
2. Submit → `itemsStore.createItem(payload, fileOptions)`.
3. Sukces → `@added` + `@close`; błąd → komunikat w modalu.

Nie zna szczegółów pól — cała logika w `ItemForm`.
