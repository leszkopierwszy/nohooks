---
tags:
  - component
  - collection
---

# CreateCollectionModal.vue

**Ścieżka:** `frontend/src/components/CreateCollectionModal.vue`

## Rola

Tworzy nową kolekcję (`categories`).

## Przepływ

1. User podaje `name`.
2. `collectionStore.createCollection(name)` → `POST /category`.
3. Store dokłada zmapowaną kategorię (pusta `items[]`) i sortuje po nazwie.

Po utworzeniu UI zwykle nawiguje do nowej grupy / odświeża overview.

---

## Vault

- [[Home]] · [[MOC Components]]
- [[Collection]] · [[Database schema]]
