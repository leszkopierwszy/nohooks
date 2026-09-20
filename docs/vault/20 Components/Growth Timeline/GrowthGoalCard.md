---
tags:
  - component
  - growth
---

# GrowthGoalCard.vue

**Ścieżka:** `frontend/src/components/growth/GrowthGoalCard.vue`

## Rola

Karta pojedynczego celu growth na liście celów: postęp, status, skrót metadanych, wejście w edycję / complete.

## Dane

Cele growth są przechowywane jako warianty / powiązania `timeline_events` (pola `growth_goal_id`, `work_minutes`, typ growth) oraz logika w widokach `views/growth/*`.

## Zachowanie

- Wyświetla tytuł, postęp, chipy (mood / meta przez powiązane kontrolki).
- CTA: oznacz ukończenie (`GrowthCompleteModal`), edycja (`GrowthGoalFormModal`).

## Powiązania

- `GrowthChipMultiSelect.vue`, `GrowthMoodPicker.vue`
- Store / API timeline events

---

## Vault

- [[Home]] · [[MOC Components]]
- [[TimelineEventFormDialog]]
