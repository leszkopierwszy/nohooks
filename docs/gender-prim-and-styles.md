# Płeć (gender) — Prim, style journey, gdzie działa

Notatka o tym, **jak działają wartości płci** w aplikacji i **w których miejscach kodu** mają zastosowanie.

## Wartości

| Wartość | Znaczenie |
|---|---|
| `female` | Prim / moduł kobiecy |
| `male` | Prim / moduł męski |
| `nonbinary` | Prim: **backdoor** — współdzieli style obu płci (`female` + `male` + `nonbinary`) |
| `gay` | Prim / tag modułu; Prim widzi style `male` + `gay` |
| `null` / pusty | Prim: „nie ustawiono”; moduł: **unisex** (widoczny dla wszystkich, którzy w ogóle dostają journey) |

Źródło prawdy dla dozwolonych tagów modułów: `StyleModule::GENDERS` w `backend/app/Models/StyleModule.php`.

---

## 1. Płeć Primy (`entities.gender`)

**Co to jest:** atrybut duszy typu Prim. Użytkownik ustawia go przy tworzeniu / edycji Primy.

**Gdzie w UI**

- Tworzenie: `frontend/src/components/Persona.vue`
- Edycja / etykieta: `frontend/src/components/PersonaOverview.vue` (`genderLabel`)
- Locale: `souls.prims.gender*`, `genderNonbinary`, `genderGay` (`en` / `pl` yaml+json)

**Gdzie w API / store**

- `PATCH/POST` entity: `backend/app/Http/Controllers/Api/EntityController.php` — `gender` jako `nullable|string|max:32` (bez twardej listy enum)
- Pinia: `frontend/src/stores/personas.js` (`createSoul` / `updateSoul`)
- Model: `backend/app/Models/Entity.php` — pole `gender`
- Seeder przykładowy: `backend/database/seeders/EntitySeeder.php`

**Czego płeć Primy NIE filtruje**

- **Garderoby / itemów** — przypisanie ubrań idzie przez `fits_persona_ids` / `fits_all_personas` na `items` (`Item::fitsPersona`, `ItemForm`). Nonbinary nie „otwiera” automatycznie wszystkich itemów; trzeba oznaczyć Primę na itemie (albo kilka Primów).
- Kolumna `items.gender` z migracji persona-fit **nie jest** dziś używana w modelu `Item` do filtrowania journey.

---

## 2. Płeć modułu stylu (`style_modules.gender`)

**Co to jest:** tag docelowej grupy dla modułu journey (admin). `null` = moduł dla wszystkich (unisex).

**Gdzie w UI**

- Admin CRUD: `frontend/src/views/AdminStyleModules.vue` (select: all / female / male / nonbinary / gay)
- Badge na kafelku / detail: `StyleStyles.vue`, `StyleModuleDetail.vue`

**Gdzie w API**

- Walidacja: `AdminStyleModuleController` — `Rule::in(StyleModule::GENDERS)`
- Migracja: `backend/database/migrations/2026_09_23_200000_create_style_journey_tables.php`
- Seed: `backend/database/seeders/StyleJourneySeeder.php`

---

## 3. Mapowanie: Prim → widoczne moduły (rdzeń logiki)

Logika jest scentralizowana w `StyleModule`:

| Metoda | Rola |
|---|---|
| `moduleGendersForEntity(?string)` | lista tagów modułów dozwolonych dla danej płci Primy |
| `scopeVisibleForGender` | filtr zapytań (lista / sync) |
| `isVisibleToEntityGender` | pojedynczy check (np. complete) |

**Macierz widoczności** (zawsze + moduły z `gender = null`):

| Płeć Primy | Widzi tagi modułów |
|---|---|
| `female` | `female` |
| `male` | `male` |
| `nonbinary` | `female`, `male`, `nonbinary` ← **backdoor obu płci** |
| `gay` | `male`, `gay` |
| inne / `null` | tylko unisex (`gender` IS NULL) |

**Gdzie używane**

- Sync auto-modułów + payload journey: `backend/app/Services/Style/StyleJourneyService.php` (`visibleForGender`, `isVisibleToEntityGender` przy `complete`)
- Endpointy user: `StyleJourneyController` → serwis powyżej

Intencja **nonbinary**: jeden Prim może mieć w szafie rzeczy „obu światów” (przez fit na itemach) i **współdzielić te same style journey**, które admin oznaczył jako female lub male, bez duplikowania modułów.

---

## 4. Fashion AI / Stylist (osobna ścieżka)

Stylist **nie** używa macierzy z `StyleModule`. Normalizuje płeć Primy do `female` | `male` | `null`:

- `FashionStylistService::normalizeGender` — `nonbinary` / `gay` → `null` (brak wymuszenia sekcji damskiej/męskiej w URL sklepów)
- Prompt settings: `FashionAiSettings` — dopasowanie do `persona.gender` (female/male; null = nie zgaduj przeciwpłci)
- Wyszukiwanie produktów: `ProductSearchService` (parametr gender)

Czyli: journey ma bogatszą semantyke płci; sklepy AI na razie tylko damska / męska / bez sekcji.

---

## 5. Szybka mapa plików

```
entities.gender
  ├─ UI: Persona.vue, PersonaOverview.vue
  ├─ API: EntityController, personas store
  └─ zużycie:
       ├─ Style journey  → StyleModule::*Gender* + StyleJourneyService
       └─ Fashion AI     → FashionStylistService::normalizeGender (female|male|null)

style_modules.gender
  ├─ Admin: AdminStyleModules.vue, AdminStyleModuleController
  └─ User UI: StyleStyles, StyleModuleDetail (wyświetlanie tagu)

items fit (nie gender)
  └─ fits_persona_ids → Item::scopeFitsPersona / wardrobeForEntity
```

---

## 6. Zmiana zachowania w przyszłości

- Nowa wartość płci Primy / tagu modułu: dopisz do `StyleModule::GENDERS` + `moduleGendersForEntity`, selectów admin/Prim, locale.
- Jeśli nonbinary ma też wpływać na sklepy AI — rozszerz `normalizeGender` / URL builders, nie tylko journey.
- Jeśli `items.gender` ma wrócić do gry — osobna decyzja; dziś wardrobe journey filtruje **tylko** po fit Primy.
