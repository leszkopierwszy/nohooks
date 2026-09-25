---
tags:
  - component
  - growth
---

# TimelineEventFormDialog.vue

**Ścieżka:** `frontend/src/components/timeline/TimelineEventFormDialog.vue`

## Rola

Dialog tworzenia / edycji wydarzenia kalendarza: zwykłe eventy, urodziny, planned expenses (z recurrence), pola usage / kolor.

## Kluczowe pola ↔ baza

| UI | `timeline_events` |
|---|---|
| Data / godziny / all-day | `event_date`, `start_time`, `end_time`, `all_day` |
| Tytuł, lokalizacja, opis, link | `label`, `location`, `description`, `link`, `notes` |
| Typ | `type` |
| Kolor | `color` (`#RRGGBB`) |
| Recurrence + kwota | `recurrence`, `planned_amount`, `currency` |
| Kategoria wydatku | `expense_category` (slug; lista z `expense_categories`) |

## Zachowanie

- Walidacja po stronie frontu + API.
- Po zapisie odświeża siatkę miesiąca / tygodnia / aside dnia.

## Powiązania

- `TimelineMonthGrid`, `TimelineWeekGrid`, `TimelineSelectedDayAside`
- Model: `TimelineEvent`

---

## Vault

- [[Home]] · [[MOC Components]]
- [[GrowthGoalCard]] · [[Database schema]]
