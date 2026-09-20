# OutfitFlatLay.vue

**Ścieżka:** `frontend/src/components/outfit/OutfitFlatLay.vue`

## Rola

Wizualny flat-lay zestawu ubrań: warstwy itemów jako cutouty PNG ułożone w siatce sylwetki (nie manekin 3D).

## Dane

- Lista itemów outfitów (z `body_zone` / `wear_layer` / sort).
- Cutouty: `item.cutout_image_url` lub generowane client-side (`getOutfitItemCutout` / cache).
- Outline (miękki kontur) opcjonalnie dla czytelności na jasnym tle.

## Zachowanie

1. Dla każdego itemu ładuje / generuje cutout.
2. Układa według stref ciała (głowa → tors → nogi → stopy) i warstw.
3. Skalowanie i stack, żeby hemming / overlapping wyglądał naturalnie (tops nad pants).

## Powiązania

- `outfitItemCutoutCache.js`, `outfitSetComposer.js`, `imageBackgroundCutout.js`
- Model: `outfits` + `outfit_item` + `item_images.cutout_path`
