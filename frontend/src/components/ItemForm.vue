<template>
  <form :id="formId" class="space-y-6" @submit.prevent="handleSubmit">
    <slot name="before-fields" />

    <div v-if="!editingItemId" class="rounded-lg border border-sky-200 bg-sky-50 px-4 py-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0 flex-1">
          <label :for="`${idPrefix}-import-url`" class="block text-sm font-medium text-sky-950">
            Import ze strony sklepu
          </label>
          <p class="mt-1 text-xs text-sky-800/90">
            Wklej link do produktu — parser (Docker) pobierze dane i uzupełni formularz.
          </p>
          <input
            :id="`${idPrefix}-import-url`"
            v-model="productImportUrl"
            type="url"
            placeholder="https://sklep.example.com/produkt"
            class="mt-2 block w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            @keydown.enter.prevent="importFromProductPage"
          />
        </div>
        <button
          type="button"
          class="shrink-0 rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
          :disabled="productImportBusy || !productImportUrl.trim()"
          @click="importFromProductPage"
        >
          {{ productImportBusy ? 'Pobieranie…' : 'Pobierz dane produktu' }}
        </button>
      </div>
      <p
        v-if="productImportFeedback"
        class="mt-3 text-xs font-medium"
        :class="productImportFeedback.ok ? 'text-green-800' : 'text-red-700'"
      >
        {{ productImportFeedback.text }}
      </p>
    </div>

    <div
      v-if="importCandidates.length"
      class="rounded-lg border border-indigo-200 bg-indigo-50/80 px-4 py-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-medium text-indigo-950">Zdjęcia z produktu</span>
        <span class="text-xs text-indigo-800">
          Wybrane: {{ selectedImportCount }} / {{ MAX_IMAGES }} (dostępne {{ importCandidates.length }})
        </span>
      </div>
      <p class="mt-1 text-xs text-indigo-900/85">
        Zaznacz do {{ MAX_IMAGES }} zdjęć do zapisu na itemie. Kolejność zaznaczania = kolejność w galerii (pierwsze = cover).
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <label
          v-for="candidate in importCandidates"
          :key="candidate.key"
          class="relative flex size-24 cursor-pointer flex-col overflow-hidden rounded-lg border-2 bg-white transition"
          :class="
            candidate.selected
              ? 'border-indigo-600 ring-2 ring-indigo-300'
              : 'border-gray-200 hover:border-indigo-300'
          "
        >
          <input
            type="checkbox"
            class="sr-only"
            :checked="candidate.selected"
            :disabled="!candidate.selected && selectedImportCount >= MAX_IMAGES"
            @change="toggleImportCandidate(candidate)"
          />
          <img
            :src="rasterFriendlyImageUrl(candidate.url)"
            alt=""
            referrerpolicy="no-referrer"
            loading="lazy"
            class="size-full object-contain object-center p-1"
          />
          <span
            class="absolute left-1 top-1 rounded bg-gray-900/80 px-1 py-0.5 text-[9px] font-bold text-white"
          >
            #{{ candidate.catalogIndex }}
          </span>
          <span
            v-if="candidate.selected && candidate.selectionOrder"
            class="absolute left-1 top-6 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
          >
            {{ candidate.selectionOrder }}
          </span>
          <span
            v-if="candidate.meta?.is_pair"
            class="absolute right-1 top-1 rounded bg-emerald-700 px-1 py-0.5 text-[9px] font-medium text-white"
          >
            para
          </span>
          <span
            v-if="candidate.meta?.view_hint"
            class="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-gray-900/65 px-1 py-0.5 text-center text-[9px] text-white"
          >
            {{ candidate.meta.view_hint }}
          </span>
        </label>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          :disabled="importApplyBusy || selectedImportCount === 0"
          @click="applySelectedImportToGallery"
        >
          {{ importApplyBusy ? 'Pobieranie wybranych…' : 'Dodaj wybrane do galerii itemu' }}
        </button>
        <button
          type="button"
          class="text-sm text-indigo-800 hover:text-indigo-950 disabled:opacity-50"
          :disabled="importApplyBusy"
          @click="clearImportCandidates"
        >
          Ukryj podgląd importu
        </button>
      </div>
    </div>

    <div>
      <span class="block text-sm font-medium text-gray-700">Dopasowanie do person</span>
      <p class="mt-1 text-xs text-gray-500">
        Sugestia stylu — item nie należy do jednej persony. Może pasować do wielu; domyślna to podpowiedź (np. sukienka → kobieta).
      </p>

      <label class="mt-3 flex items-center gap-2">
        <input
          :id="`${idPrefix}-fits-all`"
          v-model="form.fits_all_personas"
          type="checkbox"
          class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span class="text-sm text-gray-700">Pasuje do wszystkich person</span>
      </label>

      <div v-if="!form.fits_all_personas" class="mt-3 space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
        <p class="text-xs font-medium text-gray-600">Pasuje do wybranych person:</p>
        <label
          v-for="persona in personasStore.prims"
          :key="persona.id"
          class="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
        >
          <input
            v-model="form.fits_persona_ids"
            type="checkbox"
            :value="Number(persona.id)"
            class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          {{ persona.name }}
          <span v-if="persona.gender" class="text-xs text-gray-400">({{ genderLabel(persona.gender) }})</span>
        </label>
      </div>

      <div class="mt-4">
        <label :for="`${idPrefix}-default-persona`" class="block text-sm font-medium text-gray-700">
          Domyślnie pasuje do
        </label>
        <select
          :id="`${idPrefix}-default-persona`"
          v-model="form.default_persona_id"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">— brak sugestii —</option>
          <option
            v-for="persona in defaultPersonaOptions"
            :key="persona.id"
            :value="persona.id"
          >
            {{ persona.name }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">
          Tylko podpowiedź w kolekcji — nie decyduje, na czyim widoku persony item się pojawi.
          Widoczność ustawiasz checkboxami powyżej.
        </p>
      </div>
    </div>

    <div>
      <label :for="`${idPrefix}-name`" class="block text-sm font-medium text-gray-700">Nazwa</label>
      <input
        :id="`${idPrefix}-name`"
        v-model="form.name"
        type="text"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label :for="`${idPrefix}-rarity`" class="block text-sm font-medium text-gray-700">Rzadkość</label>
      <select
        :id="`${idPrefix}-rarity`"
        v-model="form.rarity"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option v-for="option in RARITY_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div>
      <span class="block text-sm font-medium text-gray-700">Jak bardzo lubimy</span>
      <LikeRatingPicker v-model="form.like_rating" class="mt-2" />
    </div>

    <div>
      <label :for="`${idPrefix}-brand`" class="block text-sm font-medium text-gray-700">Marka</label>
      <select
        :id="`${idPrefix}-brand`"
        v-model="form.brand"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">—</option>
        <option v-for="brand in brandOptions" :key="brand.value" :value="brand.value">
          {{ brand.label }}
        </option>
      </select>
      <div class="mt-3 flex gap-2">
        <input
          :id="`${idPrefix}-new-brand`"
          v-model="newBrand"
          type="text"
          placeholder="Nowa marka, np. Arc'teryx"
          class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          @keydown.enter.prevent="addBrandFromInput"
        />
        <button
          type="button"
          class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          @click="addBrandFromInput"
        >
          Dodaj markę
        </button>
      </div>
      <p class="mt-1 text-xs text-gray-500">Wybierz z listy lub dodaj własną markę (zapis na tej przeglądarce).</p>
    </div>

    <div>
      <label :for="`${idPrefix}-category_id`" class="block text-sm font-medium text-gray-700">Kolekcja</label>
      <select
        :id="`${idPrefix}-category_id`"
        v-model="form.category_id"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">Bez kolekcji</option>
        <option v-for="col in collectionStore.collections" :key="col.id" :value="col.id">
          {{ col.name }}
        </option>
      </select>
    </div>

    <div v-if="sizeKind === 'clothing'">
      <label :for="`${idPrefix}-clothing-type`" class="block text-sm font-medium text-gray-700">Typ ubrania</label>
      <select
        :id="`${idPrefix}-clothing-type`"
        v-model="form.category"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">—</option>
        <option v-for="type in clothingTypeOptions" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
      <div class="mt-3 flex gap-2">
        <input
          :id="`${idPrefix}-new-clothing-type`"
          v-model="newClothingType"
          type="text"
          placeholder="Nowy typ, np. kombinezon"
          class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          @keydown.enter.prevent="addClothingTypeFromInput"
        />
        <button
          type="button"
          class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          @click="addClothingTypeFromInput"
        >
          Dodaj typ
        </button>
      </div>
      <p class="mt-1 text-xs text-gray-500">Wybierz z listy lub dodaj własny typ (zapis na tej przeglądarce).</p>
    </div>

    <div v-else>
      <label :for="`${idPrefix}-category`" class="block text-sm font-medium text-gray-700">Podkategoria</label>
      <input
        :id="`${idPrefix}-category`"
        v-model="form.category"
        type="text"
        placeholder="np. audio, gaming"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>

    <div v-if="sizeKind === 'clothing' || sizeKind === 'shoes'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label :for="`${idPrefix}-body-zone`" class="block text-sm font-medium text-gray-700">
          {{ t('item.bodyZone') }}
        </label>
        <select
          :id="`${idPrefix}-body-zone`"
          v-model="form.body_zone"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">{{ t('item.bodyZoneAuto') }}</option>
          <option v-for="zone in BODY_ZONES" :key="zone.value" :value="zone.value">
            {{ t(zone.labelKey) }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">{{ t('item.bodyZoneHint') }}</p>
      </div>
      <div>
        <label :for="`${idPrefix}-wear-layer`" class="block text-sm font-medium text-gray-700">
          {{ t('item.wearLayer') }}
        </label>
        <select
          :id="`${idPrefix}-wear-layer`"
          v-model="form.wear_layer"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">{{ t('item.wearLayerAuto') }}</option>
          <option v-for="layer in WEAR_LAYERS" :key="layer.value" :value="layer.value">
            {{ t(layer.labelKey) }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">{{ t('item.wearLayerHint') }}</p>
      </div>
    </div>

    <div>
      <label :for="`${idPrefix}-description`" class="block text-sm font-medium text-gray-700">Opis</label>
      <textarea
        :id="`${idPrefix}-description`"
        v-model="form.description"
        rows="4"
        placeholder="Opis produktu…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label :for="`${idPrefix}-color`" class="block text-sm font-medium text-gray-700">Kolor</label>
      <select
        :id="`${idPrefix}-color`"
        v-model="form.color"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">—</option>
        <option v-for="option in COLOR_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <div
        v-if="form.color"
        class="mt-3 flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
      >
        <span
          class="size-9 shrink-0 rounded-full outline -outline-offset-1 outline-black/10"
          :class="colorSwatchNeedsBorder(form.color) ? 'border border-gray-300' : 'border border-transparent'"
          :style="colorPreviewStyle ?? undefined"
        />
        <span class="text-sm font-medium text-gray-900">{{ colorPreviewLabel }}</span>
      </div>
      <p class="mt-1 text-xs text-gray-500">Próbka koloru i nazwa — bez kodu hex</p>
    </div>

    <div>
      <label :for="`${idPrefix}-season`" class="block text-sm font-medium text-gray-700">Sezon</label>
      <select
        :id="`${idPrefix}-season`"
        v-model="form.season"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">—</option>
        <option v-for="option in SEASON_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div v-if="sizeKind === 'clothing'">
      <label :for="`${idPrefix}-size`" class="block text-sm font-medium text-gray-700">Rozmiar (ubrania)</label>
      <select
        :id="`${idPrefix}-size`"
        v-model="form.size"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">—</option>
        <option v-for="s in CLOTHING_SIZES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-else-if="sizeKind === 'shoes'" class="space-y-3">
      <div class="flex items-center justify-between">
        <label :for="`${idPrefix}-size`" class="block text-sm font-medium text-gray-700">Rozmiar (obuwie)</label>
        <div class="flex rounded-md border border-gray-300 p-0.5 text-xs font-medium">
          <button
            type="button"
            :class="form.size_system === 'eu' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'"
            class="rounded px-2.5 py-1"
            @click="form.size_system = 'eu'"
          >
            EU
          </button>
          <button
            type="button"
            :class="form.size_system === 'us' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'"
            class="rounded px-2.5 py-1"
            @click="form.size_system = 'us'"
          >
            US
          </button>
        </div>
      </div>
      <select
        :id="`${idPrefix}-size`"
        v-model="form.size"
        class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">—</option>
        <option v-for="s in shoeSizeOptions" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div>
      <label :for="`${idPrefix}-source_url`" class="block text-sm font-medium text-gray-700">Link do oryginalnej strony</label>
      <input
        :id="`${idPrefix}-source_url`"
        v-model="form.source_url"
        type="url"
        placeholder="https://sklep.example.com/produkt"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>

    <div :id="`${idPrefix}-images`">
      <div class="flex items-center justify-between">
        <span class="block text-sm font-medium text-gray-700">Zdjęcia</span>
        <span class="text-xs text-gray-500">{{ imageEntries.length }} / {{ MAX_IMAGES }}</span>
      </div>

      <p v-if="canReorderImages" class="mt-2 text-xs text-gray-500">
        Użyj uchwytu (≡) w lewym górnym rogu miniatury, aby zmienić kolejność.
      </p>

      <div
        v-if="imageEntries.length"
        class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
      >
        <label class="flex cursor-pointer items-center gap-2 text-xs text-amber-950">
          <input
            v-model="autoOrientCover"
            type="checkbox"
            class="rounded border-amber-300 text-indigo-600 focus:ring-indigo-500"
          />
          Auto-odbij cover w prawo (gdy wykryje kierunek w lewo)
        </label>
        <button
          type="button"
          class="text-xs font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
          :disabled="orientationBusy || !coverEntry()"
          @click="orientCoverToRight"
        >
          Odbij cover w prawo
        </button>
        <span
          v-if="orientationFeedback"
          class="text-xs font-medium"
          :class="orientationFeedback.ok ? 'text-green-800' : 'text-red-700'"
        >
          {{ orientationFeedback.text }}
        </span>
        <span class="text-xs text-amber-800/80">
          Tylko cover. Link ze strony sklepu jest najpierw pobierany (og:image), potem ewentualne odbicie. Przycisk zawsze odbija; auto — gdy wykryje kierunek w lewo.
        </span>
      </div>

      <div
        v-if="imageEntries.length"
        class="mt-2 space-y-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2"
      >
        <p class="text-xs font-medium text-emerald-950">Wycięcie obiektu (PNG)</p>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label class="flex cursor-pointer items-center gap-2 text-xs text-emerald-950">
            <input v-model="autoCutoutCover" type="checkbox" class="rounded border-emerald-300 text-indigo-600 focus:ring-indigo-500" />
            Auto po dodaniu covera
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-xs text-emerald-950">
            <input v-model="cutoutTrim" type="checkbox" class="rounded border-emerald-300 text-indigo-600 focus:ring-indigo-500" />
            Przytnij do obrysu
          </label>
        </div>
        <div class="flex flex-wrap items-end gap-4">
          <label class="block text-xs text-emerald-950">
            <span class="font-medium">Próg tła</span>
            <span class="ml-1 tabular-nums text-emerald-800">{{ cutoutThreshold }}</span>
            <input v-model.number="cutoutThreshold" type="range" min="8" max="64" step="1" class="mt-1 block w-36 accent-emerald-600" />
            <span class="text-[10px] text-emerald-800/80">niżej = więcej tła jako obiekt</span>
          </label>
          <label class="block text-xs text-emerald-950">
            <span class="font-medium">Zmiękczenie krawędzi</span>
            <span class="ml-1 tabular-nums text-emerald-800">{{ cutoutFeather }}</span>
            <input v-model.number="cutoutFeather" type="range" min="0" max="3" step="1" class="mt-1 block w-28 accent-emerald-600" />
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="text-xs font-medium text-emerald-800 hover:text-emerald-950 disabled:opacity-50" :disabled="cutoutBusy || !coverEntry()" @click="previewCoverMask">
            Sprawdź obrys
          </button>
          <button type="button" class="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50" :disabled="cutoutBusy || !coverEntry()" @click="cutoutCoverToPng">
            Wytnij cover → PNG
          </button>
          <span v-if="cutoutFeedback" class="text-xs font-medium" :class="cutoutFeedback.ok ? 'text-green-800' : 'text-red-700'">{{ cutoutFeedback.text }}</span>
        </div>
        <p class="text-[10px] text-emerald-800/80">Wykrywa tło od krawędzi; reszta → przezroczystość PNG. Najlepiej na jednolitym tle.</p>
      </div>

      <div
        v-if="imageEntries.length"
        class="mt-3 flex flex-wrap gap-3"
        @dragover.prevent
        @drop.prevent
      >
        <div
          v-for="(entry, index) in imageEntries"
          :key="entry.key"
          class="relative flex size-24 shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
          :class="[
            dragIndex === index ? 'opacity-50 ring-2 ring-indigo-400' : '',
            dragOverIndex === index && dragIndex !== index ? 'ring-2 ring-indigo-300' : '',
          ]"
          @dragover.prevent="onImageDragOver(index, $event)"
          @dragleave="onImageDragLeave(index, $event)"
          @drop.prevent="onImageDrop(index)"
        >
          <button
            v-if="canReorderImages"
            type="button"
            class="absolute left-1 top-1 z-20 flex size-7 cursor-grab items-center justify-center rounded bg-white/90 text-gray-600 shadow-sm ring-1 ring-gray-200 active:cursor-grabbing hover:bg-white hover:text-gray-900"
            draggable="true"
            aria-label="Przeciągnij, aby zmienić kolejność"
            @dragstart="onImageDragStart(index, $event)"
            @dragend="onImageDragEnd"
            @click.prevent
          >
            <Bars3Icon class="size-4" aria-hidden="true" />
          </button>
          <div class="min-h-0 flex-1 select-none" @dragstart.prevent>
            <div
              v-if="entry.fetchBusy"
              class="flex size-full items-center justify-center bg-gray-100 text-[10px] text-gray-500"
            >
              Pobieranie…
            </div>
            <img
              v-else-if="entry.previewUrl && isExternalHttpUrl(entry.previewUrl)"
              :src="entry.previewUrl"
              alt="Podgląd"
              referrerpolicy="no-referrer"
              loading="lazy"
              class="size-full object-contain object-center p-0.5 pointer-events-none"
            />
            <ItemImage
              v-else-if="entry.previewUrl"
              :src="entry.previewUrl"
              :checkerboard="entry.hasAlpha"
              alt="Podgląd"
              container-class="size-full min-h-0"
              img-class="size-full pointer-events-none"
            />
            <div
              v-else
              class="flex size-full items-center justify-center bg-gray-100 text-[10px] text-gray-500"
            >
              Brak podglądu
            </div>
          </div>
          <div
            v-if="index === 0"
            class="absolute bottom-5 left-0 right-0 z-20 flex items-center justify-center gap-1 px-1"
          >
            <span
              v-if="entry.facing"
              class="rounded bg-gray-900/75 px-1 py-0.5 text-[9px] font-medium text-white"
            >
              {{ facingLabel(entry.facing) }}
            </span>
            <button
              type="button"
              class="rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 shadow ring-1 ring-gray-200 hover:bg-white disabled:opacity-50"
              title="Odbij lustrzanie w prawo"
              :disabled="entry.orientationBusy"
              @click.stop="orientEntryToRight(entry, { force: true })"
            >
              →
            </button>
            <button
              type="button"
              class="rounded bg-white/95 px-1.5 py-0.5 text-[10px] text-gray-600 shadow ring-1 ring-gray-200 hover:bg-white disabled:opacity-50"
              title="Wykryj kierunek"
              :disabled="entry.orientationBusy"
              @click.stop="refreshEntryFacing(entry)"
            >
              ?
            </button>
          </div>
          <span
            v-if="index === 0"
            class="pointer-events-none absolute left-1 top-8 z-10 rounded bg-indigo-600 px-1 py-0.5 text-[9px] font-semibold uppercase text-white"
          >
            cover
          </span>
          <span
            v-if="canReorderImages"
            class="pointer-events-none absolute bottom-0 left-0 right-0 bg-gray-900/60 py-0.5 text-center text-[10px] font-medium text-white"
          >
            {{ index + 1 }}
          </span>
          <button
            type="button"
            class="absolute -right-2 -top-2 z-20 flex size-6 items-center justify-center rounded-full bg-gray-900 text-xs text-white hover:bg-gray-700"
            aria-label="Usuń zdjęcie"
            @click.stop="removeImageEntry(entry)"
            @dragstart.stop
          >
            ×
          </button>
        </div>
      </div>

      <template v-if="canAddImages">
        <div class="mt-4 flex gap-4 border-b border-gray-200">
          <button
            type="button"
            :class="imageSource === 'upload' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
            class="border-b-2 px-1 pb-2 text-sm font-medium"
            @click="imageSource = 'upload'"
          >
            Z dysku
          </button>
          <button
            type="button"
            :class="imageSource === 'url' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
            class="border-b-2 px-1 pb-2 text-sm font-medium"
            @click="imageSource = 'url'"
          >
            Link z internetu
          </button>
        </div>

        <div v-if="imageSource === 'upload'" class="mt-4">
          <input
            :id="`${idPrefix}-image`"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            @change="onImagesSelected"
          />
          <p class="mt-1 text-xs text-gray-500">JPG, PNG, WebP lub GIF, max. 5 MB na plik</p>
        </div>

        <div v-else class="mt-4 flex gap-2">
          <input
            :id="`${idPrefix}-image-url`"
            v-model="urlInput"
            type="url"
            placeholder="https://sklep.pl/produkt lub bezpośredni link .jpg"
            class="block min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            @keydown.enter.prevent="addImageFromUrl"
          />
          <button
            type="button"
            class="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            :disabled="urlImportBusy"
            @click="addImageFromUrl"
          >
            {{ urlImportBusy ? 'Pobieranie…' : 'Dodaj' }}
          </button>
        </div>
      </template>
    </div>

    <div class="flex items-start gap-3">
      <input
        :id="`${idPrefix}-gift`"
        v-model="form.gift"
        type="checkbox"
        class="mt-1 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <div>
        <label :for="`${idPrefix}-gift`" class="block text-sm font-medium text-gray-700">Prezent</label>
        <p class="text-sm text-gray-500">Ukrywa cenę początkową (zakupu) — np. gdy item był w prezencie.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label :for="`${idPrefix}-purchase_price`" class="block text-sm font-medium text-gray-700">Cena zakupu</label>
        <input
          :id="`${idPrefix}-purchase_price`"
          v-model="form.purchase_price"
          type="number"
          step="0.01"
          min="0"
          :disabled="form.gift"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>
      <div>
        <label :for="`${idPrefix}-purchase_currency`" class="block text-sm font-medium text-gray-700">Waluta zakupu</label>
        <select
          :id="`${idPrefix}-purchase_currency`"
          v-model="form.purchase_currency"
          :disabled="form.gift"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option
            v-for="option in PURCHASE_CURRENCY_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p
          v-if="!form.gift && purchasePlnPreview != null"
          class="mt-2 text-xs text-gray-500"
        >
          ≈ {{ formatPln(purchasePlnPreview) }}
          <span v-if="form.purchase_currency !== 'PLN'">
            (kurs NBP: 1 {{ form.purchase_currency }} = {{ nbpRateLabel }})
          </span>
        </p>
      </div>
      <div class="sm:col-span-2">
        <label :for="`${idPrefix}-current_value`" class="block text-sm font-medium text-gray-700">Aktualna wartość (PLN)</label>
        <input
          :id="`${idPrefix}-current_value`"
          v-model="form.current_value"
          type="number"
          step="0.01"
          min="0"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
        />
      </div>
    </div>

    <div>
      <label :for="`${idPrefix}-notes`" class="block text-sm font-medium text-gray-700">Notatki</label>
      <textarea
        :id="`${idPrefix}-notes`"
        v-model="form.notes"
        rows="3"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>

    <div v-if="!hideFooterActions" class="flex gap-3 pt-2">
      <button
        v-if="showCancel"
        type="button"
        class="flex-1 justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="submit"
        :disabled="saving"
        class="flex flex-1 justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ saving ? 'Zapisywanie…' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  fetchUrlAsFile,
  importImageFromUrl,
  isExternalHttpUrl,
  isPngLikeImageUrl,
  rasterFriendlyImageUrl,
  resolveItemImageUrl,
  resolveStorageUrl,
} from '../api/media'
import { newTraceId } from '../api/langfuseTrace'
import { parseProductFromUrl, reportImportImageSelection } from '../api/productImport'
import {
  COLOR_OPTIONS,
  colorSwatchNeedsBorder,
  colorSwatchStyle,
  displayColorName,
  normalizeColorForStorage,
} from '../constants/itemColors'
import { SEASON_OPTIONS, normalizeSeasonForStorage } from '../constants/itemSeasons'
import {
  addCustomBrand,
  getAllBrands,
  normalizeBrandForStorage,
} from '../constants/itemBrands'
import {
  addCustomClothingType,
  getAllClothingTypes,
  normalizeClothingTypeForStorage,
} from '../constants/itemClothingTypes'
import {
  BODY_ZONES,
  WEAR_LAYERS,
  inferBodyPlacement,
} from '../constants/itemBodyPlacement'
import {
  CLOTHING_SIZES,
  isClothingCollection,
  isShoesCollection,
  shoeSizeOptions as getShoeSizeOptions,
} from '../constants/itemSizes'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import ItemImage from './ItemImage.vue'
import LikeRatingPicker from './LikeRatingPicker.vue'
import { normalizeFitsPersonaIds } from '../constants/itemPersonaFit'
import { RARITY_OPTIONS, normalizeRarity } from '../constants/itemRarity'
import { normalizeLikeRating } from '../constants/itemLikeRating'
import { PURCHASE_CURRENCY_OPTIONS, normalizePurchaseCurrency } from '../constants/itemCurrencies'
import { convertToPln, fetchExchangeRates, formatPln } from '../utils/currency'
import {
  detectObjectFacing,
  facingLabel,
  orientImageToRight,
} from '../utils/imageObjectOrientation'
import { cutoutToPng, detectObjectMask } from '../utils/imageBackgroundCutout'
import { resolveCutoutOptions } from '../utils/imageCutoutTuning'
import { prepareShoeCoverImage } from '../utils/prepareShoeCoverImage'
import { preparePersistedOutfitCutout } from '../utils/preparePersistedOutfitCutout'
import { normalizeUploadImageFile } from '../utils/normalizeUploadImage'
import { hasImageChanges, useItemsStore } from '../stores/items'
import { useCollectionStore } from '../stores/collection'
import { usePersonasStore } from '../stores/personas'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  idPrefix: {
    type: String,
    default: 'item-form',
  },
  defaultCategoryId: {
    type: [String, Number],
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: 'Dodaj item',
  },
  cancelLabel: {
    type: String,
    default: 'Anuluj',
  },
  showCancel: {
    type: Boolean,
    default: false,
  },
  editing: {
    type: Boolean,
    default: false,
  },
  hideFooterActions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const formId = computed(() => `${props.idPrefix}-form`)

const itemsStore = useItemsStore()
const collectionStore = useCollectionStore()
const personasStore = usePersonasStore()

const MAX_IMAGES = 4
const IMPORT_CATALOG_MAX = 16

const imageSource = ref('upload')
const urlInput = ref('')
const urlImportBusy = ref(false)
const productImportUrl = ref('')
const productImportBusy = ref(false)
const productImportFeedback = ref(null)
const importTraceId = ref(null)
const importTraceUrl = ref(null)
const importCandidates = ref([])
const importApplyBusy = ref(false)
let importSelectionSeq = 0
const imageEntries = ref([])
const autoOrientCover = ref(true)
const orientationBusy = ref(false)
const orientationFeedback = ref(null)
const autoCutoutCover = ref(false)
const cutoutThreshold = ref(26)

const SHOE_AUTO_PROCESS_VIEWS = new Set([
  'pair_side',
  'pair_side_angle',
  'pair_front',
  'pair',
  'side',
  'side_angle',
  'front',
])

function imageMetaForUrl(metaList, url) {
  return (metaList ?? []).find((m) => m?.url === url) ?? null
}

function shouldAutoProcessShoeImage(meta, isCover) {
  // Tylko cover — wycinanie kolejnych ujęć często psuje się i usuwa zdjęcia z listy
  return Boolean(isCover)
}

function footwearImportPhotoMessage(data) {
  const count = Math.min(data.image_urls?.length ?? 0, IMPORT_CATALOG_MAX)
  if (!count) return 'Obuwie — brak zdjęć.'

  const pairCount = data.pair_image_count ?? 0
  if (data.has_pair_image && pairCount > 0) {
    return `Sugerowany packshot z parą w katalogu (${pairCount}). Auto PNG tylko na coverze po dodaniu do galerii.`
  }

  return 'Brak pewnego packshota z parą w katalogu — wybierz cover ręcznie. Auto PNG tylko na coverze.'
}
const cutoutFeather = ref(1)
const cutoutTrim = ref(false)
const cutoutBusy = ref(false)
const cutoutFeedback = ref(null)
const editingItemId = ref(null)
const removedImageIds = ref([])
const initialImageOrderSlots = ref([])
const dragIndex = ref(null)
const dragOverIndex = ref(null)
const newClothingType = ref('')
const clothingTypesVersion = ref(0)
const newBrand = ref('')
const brandsVersion = ref(0)
const exchangeRates = ref({ PLN: 1 })
let imageEntryKey = 0

const form = reactive({
  fits_all_personas: true,
  fits_persona_ids: [],
  default_persona_id: '',
  name: '',
  rarity: 'common',
  like_rating: null,
  brand: '',
  category_id: '',
  category: '',
  body_zone: '',
  wear_layer: '',
  description: '',
  color: '',
  season: '',
  size: '',
  size_system: 'eu',
  source_url: '',
  gift: false,
  purchase_price: '',
  purchase_currency: 'PLN',
  current_value: '',
  notes: '',
})

const canAddImages = computed(() => imageEntries.value.length < MAX_IMAGES)

const selectedImportCount = computed(
  () => importCandidates.value.filter((c) => c.selected).length
)

const canReorderImages = computed(() => imageEntries.value.length > 1)

const selectedCollectionName = computed(() => {
  const id = form.category_id
  if (!id) return null
  const col = collectionStore.collections.find((c) => String(c.id) === String(id))
  return col?.name ?? null
})

const sizeKind = computed(() => {
  if (isShoesCollection(selectedCollectionName.value)) return 'shoes'
  if (isClothingCollection(selectedCollectionName.value)) return 'clothing'
  return null
})

const shoeSizeOptions = computed(() => getShoeSizeOptions(form.size_system))

const colorPreviewStyle = computed(() => colorSwatchStyle(form.color))
const colorPreviewLabel = computed(() => displayColorName(form.color))

const clothingTypeOptions = computed(() => {
  clothingTypesVersion.value
  return getAllClothingTypes(form.category ? [form.category] : [])
})

const defaultPersonaOptions = computed(() => {
  if (form.fits_all_personas) {
    return personasStore.prims
  }

  const ids = new Set(form.fits_persona_ids.map(Number))
  return personasStore.prims.filter((p) => ids.has(Number(p.id)))
})

function genderLabel(gender) {
  if (gender === 'female') return 'kobieta'
  if (gender === 'male') return 'mężczyzna'
  return gender
}

const brandOptions = computed(() => {
  brandsVersion.value
  return getAllBrands(form.brand ? [form.brand] : [])
})

const purchasePlnPreview = computed(() => {
  if (form.gift || form.purchase_price === '') return null
  return convertToPln(form.purchase_price, form.purchase_currency, exchangeRates.value)
})

const nbpRateLabel = computed(() => {
  const code = normalizePurchaseCurrency(form.purchase_currency)
  if (code === 'PLN') return null
  const rate = exchangeRates.value[code]
  if (!rate) return '—'
  return formatPln(rate)
})

function addBrandFromInput() {
  const label = newBrand.value.trim()
  if (!label) return

  const option = addCustomBrand(label)
  brandsVersion.value += 1
  form.brand = option.value
  newBrand.value = ''
}

function addClothingTypeFromInput() {
  const label = newClothingType.value.trim()
  if (!label) return

  const option = addCustomClothingType(label)
  clothingTypesVersion.value += 1
  form.category = option.value
  newClothingType.value = ''
  applyInferredPlacement(true)
}

function applyInferredPlacement(force = false) {
  if (!force && form.body_zone && form.wear_layer) return
  const inferred = inferBodyPlacement(form.category, selectedCollectionName.value)
  if (!form.body_zone || force) form.body_zone = inferred.body_zone ?? ''
  if (!form.wear_layer || force) form.wear_layer = inferred.wear_layer ?? ''
}

watch(sizeKind, (kind, prev) => {
  if (kind !== prev) {
    form.size = ''
    if (kind === 'shoes' && !form.size_system) {
      form.size_system = 'eu'
    }
    if (kind !== 'shoes') {
      form.size_system = 'eu'
    }
    applyInferredPlacement(false)
    if (kind === 'clothing' || kind === 'shoes') {
      void ensureAllOutfitCutouts()
    }
  }
})

watch(
  () => form.category,
  () => {
    applyInferredPlacement(false)
  },
)

watch(
  () => props.defaultCategoryId,
  (id) => {
    if (id) form.category_id = String(id)
  },
  { immediate: true }
)

watch(
  () => form.fits_all_personas,
  (fitsAll) => {
    if (fitsAll) {
      form.fits_persona_ids = []
      return
    }

    syncDefaultPersonaWithSelection()
  }
)

watch(
  () => [...form.fits_persona_ids],
  () => {
    if (!form.fits_all_personas) {
      syncDefaultPersonaWithSelection()
    }
  }
)

function syncDefaultPersonaWithSelection() {
  if (!form.default_persona_id) return

  const selected = new Set(normalizeFitsPersonaIds(form.fits_persona_ids))
  if (!selected.has(Number(form.default_persona_id))) {
    form.default_persona_id = ''
  }
}

watch(
  () => form.gift,
  (isGift) => {
    if (isGift) form.purchase_price = ''
  }
)

function nextImageKey() {
  imageEntryKey += 1
  return imageEntryKey
}

function revokeEntryPreview(entry) {
  if (entry.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(entry.previewUrl)
  }
  if (entry.cutoutPreviewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(entry.cutoutPreviewUrl)
  }
}

function clearImageState() {
  imageEntries.value.forEach(revokeEntryPreview)
  imageEntries.value = []
  removedImageIds.value = []
  initialImageOrderSlots.value = []
  urlInput.value = ''
  imageSource.value = 'upload'
  dragIndex.value = null
  dragOverIndex.value = null
  orientationFeedback.value = null
  cutoutFeedback.value = null
}

function setCutoutFeedback(text, ok = true) {
  cutoutFeedback.value = { text, ok }
}

function markEntryForReplacement(entry) {
  if (entry?.kind === 'existing' && entry.id && !removedImageIds.value.includes(entry.id)) {
    removedImageIds.value.push(entry.id)
  }
}

function applyProcessedCoverFile(entryKey, { file, previewUrl, hasAlpha = false, cutout = false, extra = {} }) {
  const entry = imageEntries.value.find((e) => e.key === entryKey)
  if (!entry) return null
  revokeEntryPreview(entry)
  markEntryForReplacement(entry)
  return patchImageEntry(entryKey, {
    kind: 'file',
    file,
    previewUrl,
    hasAlpha,
    cutout,
    fetchBusy: false,
    id: undefined,
    url: undefined,
    cutoutFile: undefined,
    cutoutPreviewUrl: undefined,
    cutoutDirty: true,
    persistedCutoutUrl: undefined,
    ...extra,
  })
}

function syncCoverEntryFromServer(item, entryKey) {
  const cover = item?.images?.[0]
  if (!cover) return
  const prev = imageEntries.value.find((e) => e.key === entryKey)
  if (prev) revokeEntryPreview(prev)
  patchImageEntry(entryKey, {
    kind: 'existing',
    id: cover.id,
    file: undefined,
    url: undefined,
    previewUrl: resolveItemImageUrl(cover),
    hasAlpha: isPngLikeImageUrl(cover.url),
    cutout: true,
    fetchBusy: false,
  })
  removedImageIds.value = []
  initialImageOrderSlots.value = buildImageOrderSlots()
}

async function persistCoverImageChanges() {
  if (!editingItemId.value) return null
  const entry = coverEntry()
  if (!entry?.file) return null

  const fileOptions = await buildImageFileOptions()
  if (!hasImageChanges(fileOptions)) return null

  const item = await itemsStore.updateItem(
    editingItemId.value,
    buildPayload(),
    fileOptions
  )
  syncCoverEntryFromServer(item, entry.key)
  return item
}

async function entryToProcessableFile(entry = coverEntry()) {
  if (!entry) return null
  const latest = imageEntries.value.find((e) => e.key === entry.key) ?? entry
  if (latest.file instanceof File) return latest.file

  const materialized = await materializeRemoteImageEntry(latest)
  if (materialized.file instanceof File) return materialized.file

  if (materialized.previewUrl) {
    return fetchUrlAsFile(
      materialized.previewUrl,
      materialized.cutout ? 'cover.png' : 'cover.jpg'
    )
  }

  return null
}

async function cutoutCoverEntry() {
  const entry = coverEntry()
  const source = await entryToProcessableFile(entry)
  if (!source) throw new Error('Brak obrazu cover.')
  return cutoutToPng(source, {
    threshold: cutoutThreshold.value,
    feather: cutoutFeather.value,
    trim: cutoutTrim.value,
  })
}

async function previewCoverMask() {
  const entry = coverEntry()
  if (!entry) return
  cutoutBusy.value = true
  cutoutFeedback.value = null
  try {
    const source = await entryToProcessableFile(entry)
    const info = await detectObjectMask(source, { threshold: cutoutThreshold.value })
    const pct = Math.round(info.foregroundRatio * 100)
    setCutoutFeedback(
      info.hasSubject
        ? `Obiekt ~${pct}% kadru — można wycinać.`
        : `Za mało obiektu (${pct}%). Obniż próg tła.`,
      info.hasSubject
    )
  } catch (err) {
    setCutoutFeedback(err.message ?? 'Nie udało się wykryć obrysu.', false)
  } finally {
    cutoutBusy.value = false
  }
}

async function cutoutCoverToPng() {
  const entry = coverEntry()
  if (!entry) return
  cutoutBusy.value = true
  cutoutFeedback.value = null
  try {
    const result = await cutoutCoverEntry()
    const updated = applyProcessedCoverFile(entry.key, {
      file: result.file,
      previewUrl: result.previewUrl,
      hasAlpha: true,
      cutout: true,
    })
    await ensureEntryOutfitCutout(updated ?? entry)
    const pct = Math.round(result.foregroundRatio * 100)

    if (editingItemId.value) {
      await persistCoverImageChanges()
      setCutoutFeedback(`Wycięto i zapisano PNG (~${pct}% kadru).`)
    } else {
      setCutoutFeedback(`PNG gotowy (~${pct}% kadru). Kliknij Zapisz item.`)
    }
  } catch (err) {
    setCutoutFeedback(err.message ?? 'Wycięcie nie powiodło się.', false)
  } finally {
    cutoutBusy.value = false
  }
}

async function prepareImportedShoeImage(entry, { isCover = false } = {}) {
  if (!entry) return entry
  patchImageEntry(entry.key, { orientationBusy: true })
  orientationFeedback.value = null
  try {
    const processed = await prepareShoeCoverImage(
      () => entryToProcessableFile(entry),
      {
        colorHint: form.color || null,
        forceLight: /\b(bia[łl]|white|cream|ivory)\b/i.test(form.name ?? ''),
        trim: true,
      }
    )
    const updated = applyProcessedCoverFile(entry.key, {
      file: processed.file,
      previewUrl: processed.previewUrl,
      hasAlpha: true,
      cutout: true,
      extra: {
        facing: processed.facing,
        orientation: processed.orientation,
      },
    })
    if (isCover) {
      const pct = Math.round((processed.foregroundRatio ?? 0) * 100)
      const lightNote = processed.lightProduct ? ' (profil białego obuwia)' : ''
      setOrientationFeedback(
        `Auto: para butów — wycięto PNG, skierowano w prawo (~${pct}% kadru)${lightNote}.`
      )
    }
    const next = updated ?? entry
    await ensureEntryOutfitCutout(next)
    return next
  } catch (err) {
    console.warn('Auto-obróbka obuwia nie powiodła się:', err)
    if (isCover) {
      await maybeAutoOrientCoverEntry(entry)
      setOrientationFeedback(
        err.message ?? 'Wycięcie nie powiodło się — zostawiono oryginał.',
        false
      )
    }
    await ensureEntryOutfitCutout(entry)
    return entry
  } finally {
    patchImageEntry(entry.key, { orientationBusy: false })
  }
}

async function maybeAutoCutoutCoverEntry(entry) {
  if (!autoCutoutCover.value) return
  if (coverEntry()?.key !== entry.key) return
  try {
    const result = await cutoutCoverEntry()
    const updated = applyProcessedCoverFile(entry.key, {
      file: result.file,
      previewUrl: result.previewUrl,
      hasAlpha: true,
      cutout: true,
    })
    await ensureEntryOutfitCutout(updated ?? entry)
    if (editingItemId.value) {
      await persistCoverImageChanges()
    }
    const pct = Math.round(result.foregroundRatio * 100)
    setCutoutFeedback(`Auto: wycięto do PNG (~${pct}% kadru).`)
  } catch (err) {
    console.warn('Auto-wycięcie covera nie powiodło się:', err)
  }
}

function patchImageEntry(entryKey, patch) {
  const idx = imageEntries.value.findIndex((e) => e.key === entryKey)
  if (idx === -1) return null
  const prev = imageEntries.value[idx]
  const next = { ...prev, ...patch }
  for (const key of Object.keys(patch)) {
    if (patch[key] === undefined) {
      delete next[key]
    }
  }
  imageEntries.value[idx] = next
  return next
}

function shouldPersistOutfitCutout() {
  return sizeKind.value === 'clothing' || sizeKind.value === 'shoes'
}

function revokeCutoutPreview(entry) {
  if (entry?.cutoutPreviewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(entry.cutoutPreviewUrl)
  }
}

/** @type {Map<string, Promise<object|null>>} */
const outfitCutoutJobs = new Map()

/**
 * Generate cutout+outline sidecar on image add (clothing/shoes).
 * Stored separately from the gallery original so Style can load without re-cutting.
 */
async function ensureEntryOutfitCutout(entry) {
  if (!entry || !shouldPersistOutfitCutout()) return entry

  const latest = imageEntries.value.find((e) => e.key === entry.key) ?? entry
  if (latest.cutoutFile instanceof Blob && latest.cutoutFile.size > 0) return latest
  if (latest.persistedCutoutUrl && !latest.cutoutDirty) return latest

  if (outfitCutoutJobs.has(latest.key)) {
    return outfitCutoutJobs.get(latest.key)
  }

  const job = (async () => {
    patchImageEntry(latest.key, { cutoutBusy: true })
    try {
      const source = await entryToProcessableFile(
        imageEntries.value.find((e) => e.key === latest.key) ?? latest
      )
      if (!source) {
        throw new Error('Brak źródła do wycinki.')
      }

      const current = imageEntries.value.find((e) => e.key === latest.key) ?? latest
      const alreadyCutout = Boolean(current.cutout && current.hasAlpha)
      const result = await preparePersistedOutfitCutout(source, {
        colorHint: form.color || null,
        itemName: form.name || '',
        alreadyCutout,
      })

      const prev = imageEntries.value.find((e) => e.key === latest.key)
      revokeCutoutPreview(prev)

      return patchImageEntry(latest.key, {
        cutoutFile: result.file,
        cutoutPreviewUrl: result.previewUrl,
        cutoutBusy: false,
        cutoutDirty: true,
      })
    } catch (err) {
      console.warn('Outfit cutout nie powiodło się:', err)
      return patchImageEntry(latest.key, { cutoutBusy: false })
    } finally {
      outfitCutoutJobs.delete(latest.key)
    }
  })()

  outfitCutoutJobs.set(latest.key, job)
  return job
}

async function ensureAllOutfitCutouts() {
  if (!shouldPersistOutfitCutout()) return
  for (const entry of [...imageEntries.value]) {
    if (!isImageEntryReady(entry)) continue
    await ensureEntryOutfitCutout(entry)
  }
}

function setOrientationFeedback(text, ok = true) {
  orientationFeedback.value = { text, ok }
}

function applyLocalOrientationResult(entry, result) {
  if (!result.mirrored || !result.file) {
    return patchImageEntry(entry.key, {
      facing: result.directionAfter ?? result.direction,
      orientation: result,
    })
  }

  return applyProcessedCoverFile(entry.key, {
    file: result.file,
    previewUrl: result.previewUrl,
    hasAlpha: false,
    cutout: false,
    extra: {
      facing: result.directionAfter ?? result.direction,
      orientation: result,
    },
  })
}

function externalUrlForEntry(entry) {
  if (entry.url) return entry.url
  const preview = entry.previewUrl
  if (isExternalHttpUrl(preview)) return preview
  return null
}

/** Link do strony / zewnętrzny URL → plik (podgląd + zapis + canvas). */
async function materializeRemoteImageEntry(entry) {
  if (entry.file) return entry

  const pageUrl = externalUrlForEntry(entry)
  if (!pageUrl) return entry

  patchImageEntry(entry.key, { fetchBusy: true })
  try {
    const file = await importImageFromUrl(pageUrl)
    revokeEntryPreview(entry)
    const updated = patchImageEntry(entry.key, {
      kind: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
      fetchBusy: false,
      url: undefined,
    })
    return updated ?? entry
  } catch (err) {
    patchImageEntry(entry.key, { fetchBusy: false })
    throw err
  }
}

async function refreshEntryFacing(entry) {
  patchImageEntry(entry.key, { orientationBusy: true })
  try {
    if (entry.kind === 'existing' && editingItemId.value && entry.id) {
      const detection = await itemsStore.detectItemImageFacing(
        editingItemId.value,
        entry.id
      )
      patchImageEntry(entry.key, {
        facing: detection.direction,
        orientation: detection,
      })
      return
    }

    const source = await entryToProcessableFile(entry)
    if (!source) return
    const detection = await detectObjectFacing(source)
    patchImageEntry(entry.key, {
      facing: detection.direction,
      orientation: detection,
    })
  } catch (err) {
    console.warn('Wykrywanie kierunku nie powiodło się:', err)
  } finally {
    patchImageEntry(entry.key, { orientationBusy: false })
  }
}

async function orientEntryToRight(entry, { force = false } = {}) {
  patchImageEntry(entry.key, { orientationBusy: true })
  orientationFeedback.value = null

  try {
    if (entry.kind === 'existing' && editingItemId.value && entry.id) {
      const result = await itemsStore.orientItemImageRight(
        editingItemId.value,
        entry.id,
        { force }
      )

      if (result.mirrored && result.image) {
        const prev = imageEntries.value.find((e) => e.key === entry.key)
        if (prev) revokeEntryPreview(prev)
        patchImageEntry(entry.key, {
          kind: 'existing',
          id: result.image.id ?? entry.id,
          previewUrl: resolveItemImageUrl(result.image),
          file: undefined,
          url: undefined,
          hasAlpha: false,
          cutout: false,
          facing: result.direction_after ?? result.direction,
          orientation: result,
        })
        setOrientationFeedback('Cover odbity i zapisany.')
      } else {
        patchImageEntry(entry.key, {
          facing: result.direction_after ?? result.direction,
          orientation: result,
        })
        setOrientationFeedback('Cover już skierowany w prawo — bez zmian.', false)
      }
      return
    }

    const source = await entryToProcessableFile(entry)
    if (!source) throw new Error('Brak obrazu cover do odbicia.')

    const result = await orientImageToRight(source, { force })
    applyLocalOrientationResult(entry, result)

    if (result.mirrored) {
      setOrientationFeedback(
        editingItemId.value
          ? 'Cover odbity — zapisz item, aby utrwalić na liście.'
          : 'Cover odbity — kliknij Zapisz, aby utrwalić.'
      )
    } else if (force) {
      setOrientationFeedback('Nie udało się odbić obrazu.', false)
    } else {
      setOrientationFeedback('Cover już w prawo — bez odbicia.')
    }
  } catch (err) {
    console.warn('Wyrównanie w prawo nie powiodło się:', err)
    setOrientationFeedback(err.message ?? 'Odbicie nie powiodło się.', false)
  } finally {
    patchImageEntry(entry.key, { orientationBusy: false })
  }
}

function coverEntry() {
  return imageEntries.value[0] ?? null
}

async function orientCoverToRight() {
  const entry = coverEntry()
  if (!entry) return
  orientationBusy.value = true
  try {
    await orientEntryToRight(entry, { force: true })
  } finally {
    orientationBusy.value = false
  }
}

async function maybeAutoOrientCoverEntry(entry) {
  if (!autoOrientCover.value && !autoCutoutCover.value) return
  if (coverEntry()?.key !== entry.key) return
  orientationFeedback.value = null
  if (autoOrientCover.value) {
    await orientEntryToRight(entry, { force: false })
  }
  const current = coverEntry()
  if (current && autoCutoutCover.value) {
    await maybeAutoCutoutCoverEntry(current)
  }
}

function removeImageEntry(entry) {
  if (entry.kind === 'existing' && entry.id) {
    removedImageIds.value.push(entry.id)
  }
  revokeEntryPreview(entry)
  imageEntries.value = imageEntries.value.filter((e) => e.key !== entry.key)
}

async function onImagesSelected(event) {
  const files = [...(event.target.files ?? [])]
  event.target.value = ''

  for (const file of files) {
    if (imageEntries.value.length >= MAX_IMAGES) break

    const entry = {
      key: nextImageKey(),
      kind: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
      orientationBusy: false,
      facing: null,
      orientation: null,
    }
    const isCover = imageEntries.value.length === 0
    imageEntries.value.push(entry)
    if (isCover) {
      await maybeAutoOrientCoverEntry(entry)
    }
    await ensureEntryOutfitCutout(
      imageEntries.value.find((e) => e.key === entry.key) ?? entry
    )
  }
}

async function addImageFromUrl() {
  const pageUrl = urlInput.value.trim()
  if (!pageUrl || imageEntries.value.length >= MAX_IMAGES) return

  const entryKey = nextImageKey()
  const isCover = imageEntries.value.length === 0
  imageEntries.value.push({
    key: entryKey,
    kind: 'url',
    url: pageUrl,
    previewUrl: null,
    fetchBusy: true,
    orientationBusy: false,
    facing: null,
    orientation: null,
  })
  urlInput.value = ''
  orientationFeedback.value = null
  urlImportBusy.value = true

  try {
    const placeholder = imageEntries.value.find((e) => e.key === entryKey)
    const materialized = await materializeRemoteImageEntry(placeholder)
    if (isCover) {
      await maybeAutoOrientCoverEntry(materialized)
    }
    await ensureEntryOutfitCutout(
      imageEntries.value.find((e) => e.key === entryKey) ?? materialized
    )
  } catch (err) {
    imageEntries.value = imageEntries.value.filter((e) => e.key !== entryKey)
    setOrientationFeedback(
      err.message ?? 'Nie udało się pobrać zdjęcia ze strony.',
      false
    )
  } finally {
    urlImportBusy.value = false
  }
}

function isImageEntryReady(entry) {
  if (!entry || entry.fetchBusy) return false
  if (entry.kind === 'existing') return Boolean(entry.id)
  if (entry.kind === 'file') {
    return entry.file instanceof Blob && entry.file.size > 0
  }
  if (entry.kind === 'url') {
    return Boolean(entry.url?.trim())
  }
  return false
}

function buildImageOrderSlots() {
  const slots = []
  let fileIdx = 0
  let urlIdx = 0

  for (const entry of imageEntries.value) {
    if (!isImageEntryReady(entry)) continue

    if (entry.kind === 'existing') {
      slots.push(`id:${entry.id}`)
    } else if (entry.kind === 'file') {
      slots.push(`file:${fileIdx}`)
      fileIdx += 1
    } else if (entry.kind === 'url') {
      slots.push(`url:${urlIdx}`)
      urlIdx += 1
    }
  }

  return slots
}

async function buildImageFileOptions() {
  const imageOrderSlots = buildImageOrderSlots()
  const newImages = []
  const newImageUrls = []
  const newCutoutImages = []
  const newUrlCutoutImages = []
  const existingCutoutImages = {}

  for (const entry of imageEntries.value) {
    if (!isImageEntryReady(entry)) continue

    if (entry.kind === 'file') {
      const normalized = await normalizeUploadImageFile(entry.file, {
        preferPng: Boolean(entry.hasAlpha || entry.cutout),
      })
      newImages.push(normalized)
      newCutoutImages.push(
        entry.cutoutFile instanceof Blob && entry.cutoutFile.size > 0
          ? entry.cutoutFile
          : null
      )
    } else if (entry.kind === 'url') {
      newImageUrls.push(entry.url.trim())
      newUrlCutoutImages.push(
        entry.cutoutFile instanceof Blob && entry.cutoutFile.size > 0
          ? entry.cutoutFile
          : null
      )
    } else if (
      entry.kind === 'existing' &&
      entry.id &&
      entry.cutoutDirty &&
      entry.cutoutFile instanceof Blob &&
      entry.cutoutFile.size > 0
    ) {
      existingCutoutImages[entry.id] = entry.cutoutFile
    }
  }

  const imageOrderChanged =
    JSON.stringify(imageOrderSlots) !== JSON.stringify(initialImageOrderSlots.value)

  return {
    newImages,
    newImageUrls,
    newCutoutImages,
    newUrlCutoutImages,
    existingCutoutImages,
    removeImageIds: [...removedImageIds.value],
    imageOrderSlots,
    imageOrderChanged,
  }
}

function hasPendingImageEntries() {
  return imageEntries.value.some(
    (entry) =>
      entry.fetchBusy ||
      entry.cutoutBusy ||
      entry.orientationBusy ||
      (entry.kind === 'file' && !(entry.file instanceof Blob && entry.file.size > 0)) ||
      (entry.kind === 'url' && !entry.url?.trim())
  )
}

function onImageDragStart(index, event) {
  dragIndex.value = index
  const transfer = event.dataTransfer
  if (!transfer) return

  transfer.effectAllowed = 'move'
  transfer.dropEffect = 'move'
  transfer.setData('text/plain', String(index))
  transfer.setData('application/x-nohooks-image-index', String(index))
}

function onImageDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function onImageDragOver(index, event) {
  event.preventDefault()
  const transfer = event.dataTransfer
  if (transfer) {
    transfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

function onImageDragLeave(index, event) {
  const related = event.relatedTarget
  if (related instanceof Node && event.currentTarget instanceof Node) {
    if (event.currentTarget.contains(related)) return
  }
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

function onImageDrop(targetIndex) {
  const fromIndex = dragIndex.value
  if (fromIndex === null || fromIndex === targetIndex) {
    onImageDragEnd()
    return
  }

  const entries = [...imageEntries.value]
  const [moved] = entries.splice(fromIndex, 1)
  entries.splice(targetIndex, 0, moved)
  imageEntries.value = entries
  onImageDragEnd()
  if (
    targetIndex === 0 &&
    (autoOrientCover.value || autoCutoutCover.value) &&
    imageEntries.value[0]
  ) {
    void maybeAutoOrientCoverEntry(imageEntries.value[0])
  }
}

function setProductImportFeedback(text, ok = true) {
  productImportFeedback.value = { text, ok }
}

function clearImportCandidates() {
  importCandidates.value = []
  importSelectionSeq = 0
  importTraceUrl.value = null
}

function toggleImportCandidate(candidate) {
  const idx = importCandidates.value.findIndex((c) => c.key === candidate.key)
  if (idx === -1) return

  const item = importCandidates.value[idx]
  if (item.selected) {
    importCandidates.value[idx] = { ...item, selected: false, selectionOrder: null }
    return
  }

  if (selectedImportCount.value >= MAX_IMAGES) {
    setProductImportFeedback(`Możesz wybrać maksymalnie ${MAX_IMAGES} zdjęcia.`, false)
    return
  }

  importSelectionSeq += 1
  importCandidates.value[idx] = {
    ...item,
    selected: true,
    selectionOrder: importSelectionSeq,
  }
}

async function applySelectedImportToGallery() {
  const selected = importCandidates.value
    .filter((c) => c.selected)
    .sort((a, b) => (a.selectionOrder ?? 0) - (b.selectionOrder ?? 0))

  if (!selected.length) {
    setProductImportFeedback('Zaznacz co najmniej jedno zdjęcie.', false)
    return
  }

  importApplyBusy.value = true
  setProductImportFeedback('Dodawanie wybranych zdjęć do galerii…', true)

  try {
    clearImageState()
    const isShoes = sizeKind.value === 'shoes'
    const addedKeys = []

    for (let i = 0; i < selected.length; i++) {
      const candidate = selected[i]
      const entryKey = nextImageKey()
      const meta = candidate.meta ?? null
      const previewUrl = rasterFriendlyImageUrl(candidate.url)

      imageEntries.value.push({
        key: entryKey,
        kind: 'url',
        url: candidate.url,
        previewUrl,
        fetchBusy: false,
        orientationBusy: false,
        facing: null,
        orientation: null,
        viewHint: meta?.view_hint ?? null,
        isPair: Boolean(meta?.is_pair),
      })
      addedKeys.push(entryKey)
    }

    const coverKey = addedKeys[0]
    const coverEntry = imageEntries.value.find((e) => e.key === coverKey)
    if (coverEntry) {
      try {
        const materialized = await materializeRemoteImageEntry(coverEntry)
        const coverMeta = selected[0]?.meta ?? null
        if (isShoes && shouldAutoProcessShoeImage(coverMeta, true)) {
          try {
            await prepareImportedShoeImage(materialized, { isCover: true })
          } catch (err) {
            console.warn('Auto-obróbka covera nie powiodła się — zostawiono URL:', err)
          }
        } else {
          await maybeAutoOrientCoverEntry(materialized)
        }
      } catch (err) {
        console.warn('Opcjonalne pobranie covera nie powiodło się — zostawiono link CDN:', err)
      }
    }

    if (importTraceId.value) {
      try {
        await reportImportImageSelection({
          trace_id: importTraceId.value,
          source_url: form.source_url || productImportUrl.value || null,
          selected: selected.map((c) => ({
            catalog_index: c.catalogIndex,
            selection_order: c.selectionOrder,
            url: c.url,
            view_hint: c.meta?.view_hint ?? null,
            is_pair: Boolean(c.meta?.is_pair),
          })),
          gallery_count: imageEntries.value.length,
        })
      } catch (err) {
        console.warn('Langfuse selection trace:', err)
      }
    }

    const traceNote = importTraceUrl.value
      ? ` Trace: ${importTraceUrl.value}`
      : ''
    setProductImportFeedback(
      `Dodano ${imageEntries.value.length} zdjęć do galerii (zapiszą się jako linki CDN). Max ${MAX_IMAGES} na item.${traceNote}`,
      true
    )

    await ensureAllOutfitCutouts()

    await nextTick()
    document.getElementById(`${props.idPrefix}-images`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } finally {
    importApplyBusy.value = false
  }
}

async function applyParsedProduct(data) {
  if (data.source_url) {
    form.source_url = data.source_url
    productImportUrl.value = data.source_url
  }
  if (data.name) {
    form.name = data.name
  }
  if (data.description) {
    form.description = data.description
  }
  if (data.brand) {
    let brand = normalizeBrandForStorage(data.brand)
    if (!brand) {
      addCustomBrand(data.brand)
      brandsVersion.value += 1
      brand = normalizeBrandForStorage(data.brand)
    }
    form.brand = brand ?? ''
  }
  if (data.color) {
    form.color = normalizeColorForStorage(data.color) ?? ''
  }
  if (data.season) {
    form.season = normalizeSeasonForStorage(data.season) ?? ''
  }
  if (data.category) {
    if (sizeKind.value === 'clothing') {
      let cat = normalizeClothingTypeForStorage(data.category)
      if (!cat) {
        addCustomClothingType(data.category)
        clothingTypesVersion.value += 1
        cat = normalizeClothingTypeForStorage(data.category)
      }
      form.category = cat ?? ''
    } else if (!sizeKind.value) {
      form.category = data.category
    }
  }
  if (data.size) {
    const size = String(data.size).trim()
    if (sizeKind.value === 'clothing' && CLOTHING_SIZES.includes(size)) {
      form.size = size
    } else if (sizeKind.value === 'shoes') {
      form.size = size.replace(/\s*(EU|US)\s*$/i, '').trim()
    } else {
      form.size = size
    }
  }
  if (data.purchase_price != null && !form.gift) {
    form.purchase_price = String(data.purchase_price)
  }
  if (data.purchase_currency) {
    form.purchase_currency = normalizePurchaseCurrency(data.purchase_currency)
  }
  if (data.current_value != null && form.current_value === '') {
    form.current_value = String(data.current_value)
  }

  if (
    !form.color &&
    data.name &&
    /\b(bia[łl]|white|cream|ivory|ecru)\b/i.test(data.name)
  ) {
    form.color = normalizeColorForStorage('bialy') ?? 'bialy'
  }

  const images = (data.image_urls ?? []).filter(Boolean).slice(0, IMPORT_CATALOG_MAX)
  const metaList = data.image_meta ?? []
  importSelectionSeq = 0
  importCandidates.value = images.map((imageUrl, i) => {
    const meta = metaList[i] ?? imageMetaForUrl(metaList, imageUrl)
    return {
      key: nextImageKey(),
      url: imageUrl,
      meta: meta ?? null,
      catalogIndex: i + 1,
      selected: false,
      selectionOrder: null,
    }
  })
}

async function importFromProductPage() {
  const url = productImportUrl.value.trim()
  if (!url) return

  productImportBusy.value = true
  productImportFeedback.value = null
  orientationFeedback.value = null

  try {
    importTraceId.value = newTraceId()
    const data = await parseProductFromUrl(url, {
      isFootwear: sizeKind.value === 'shoes',
      productClassHint:
        sizeKind.value === 'shoes'
          ? 'footwear'
          : sizeKind.value === 'clothing'
            ? 'clothing'
            : null,
      traceId: importTraceId.value,
    })
    importTraceUrl.value = data.trace_url ?? null
    await applyParsedProduct(data)
    const catalogCount = importCandidates.value.length
    let photoHint = 'wg kategorii'
    if (data.detected_product_class === 'footwear') {
      photoHint = footwearImportPhotoMessage(data)
    } else if (data.detected_product_class === 'clothing') {
      photoHint = 'tylko odzież'
    } else if (data.detected_product_class === 'accessories') {
      photoHint = 'tylko akcesoria'
    }

    setProductImportFeedback(
      catalogCount
        ? `Uzupełniono pola z linku. Znaleziono ${catalogCount} zdjęć — wybierz do ${MAX_IMAGES} poniżej i dodaj do galerii. ${photoHint}`
        : 'Uzupełniono pola z linku. Brak zdjęć produktu — dodaj ręcznie.',
      catalogCount > 0
    )
  } catch (err) {
    setProductImportFeedback(err.message ?? 'Nie udało się pobrać danych produktu.', false)
  } finally {
    productImportBusy.value = false
  }
}

function reset() {
  editingItemId.value = null
  form.name = ''
  form.rarity = 'common'
  form.like_rating = null
  form.brand = ''
  form.fits_all_personas = true
  form.fits_persona_ids = []
  form.default_persona_id = personasStore.prims.find((p) => p.gender === 'female')?.id ?? ''
  form.category = ''
  form.body_zone = ''
  form.wear_layer = ''
  form.description = ''
  form.color = ''
  form.season = ''
  form.size = ''
  form.size_system = 'eu'
  form.source_url = ''
  productImportUrl.value = ''
  productImportFeedback.value = null
  clearImportCandidates()
  importTraceId.value = null
  importTraceUrl.value = null
  form.gift = false
  form.purchase_price = ''
  form.purchase_currency = 'PLN'
  form.current_value = ''
  form.notes = ''
  form.category_id = props.defaultCategoryId ? String(props.defaultCategoryId) : ''
  clearImageState()
  const input = document.getElementById(`${props.idPrefix}-image`)
  if (input) input.value = ''

}

function loadFromItem(item) {
  editingItemId.value = item.id ?? null
  form.name = item.name
  form.rarity = normalizeRarity(item.rarity)
  form.like_rating = normalizeLikeRating(item.like_rating)
  form.brand = normalizeBrandForStorage(item.brand) ?? ''
  form.category_id = item.category_id ?? props.defaultCategoryId ?? ''
  form.category =
    sizeKind.value === 'clothing'
      ? normalizeClothingTypeForStorage(item.category) ?? ''
      : item.category ?? ''
  form.body_zone = item.body_zone ?? ''
  form.wear_layer = item.wear_layer ?? ''
  form.gift = Boolean(item.gift)
  form.purchase_price = item.gift ? '' : (item.purchase_price ?? '')
  form.purchase_currency = item.gift
    ? 'PLN'
    : normalizePurchaseCurrency(item.purchase_currency)
  form.current_value = item.current_value ?? ''
  form.notes = item.notes ?? ''
  form.description = item.description ?? ''
  form.color = normalizeColorForStorage(item.color) ?? ''
  form.season = normalizeSeasonForStorage(item.season) ?? ''
  form.size = item.size ?? ''
  form.size_system = item.size_system === 'us' ? 'us' : 'eu'
  form.source_url = item.source_url ?? ''
  productImportUrl.value = item.source_url ?? ''
  productImportFeedback.value = null
  form.fits_all_personas = item.fits_all_personas ?? true
  form.fits_persona_ids = normalizeFitsPersonaIds(item.fits_persona_ids ?? [])
  form.default_persona_id = item.default_persona_id ?? ''
  clearImageState()
  imageEntries.value = (item.images ?? []).map((img) => {
    const cutoutRaw = img.cutout_url ?? null
    const persistedCutoutUrl = resolveStorageUrl(cutoutRaw) ?? cutoutRaw
    return {
      key: nextImageKey(),
      kind: 'existing',
      id: img.id,
      previewUrl: resolveItemImageUrl(img),
      persistedCutoutUrl: persistedCutoutUrl || null,
      cutoutDirty: false,
      orientationBusy: false,
      facing: null,
      orientation: null,
    }
  })
  initialImageOrderSlots.value = buildImageOrderSlots()
  const input = document.getElementById(`${props.idPrefix}-image`)
  if (input) input.value = ''

  if (shouldPersistOutfitCutout()) {
    void ensureAllOutfitCutouts()
  }
}

function buildPayload() {
  const fitsPersonaIds = form.fits_all_personas
    ? null
    : normalizeFitsPersonaIds(form.fits_persona_ids)

  let defaultPersonaId = form.default_persona_id ? Number(form.default_persona_id) : null
  if (!form.fits_all_personas && defaultPersonaId) {
    if (!fitsPersonaIds?.includes(defaultPersonaId)) {
      defaultPersonaId = null
    }
  }

  const payload = {
    fits_all_personas: form.fits_all_personas,
    fits_persona_ids: fitsPersonaIds,
    default_persona_id: defaultPersonaId,
    name: form.name.trim(),
    rarity: normalizeRarity(form.rarity),
    like_rating: normalizeLikeRating(form.like_rating),
    brand: normalizeBrandForStorage(form.brand),
    gift: form.gift,
    category_id: form.category_id ? Number(form.category_id) : null,
    category:
      sizeKind.value === 'clothing'
        ? normalizeClothingTypeForStorage(form.category)
        : form.category.trim() || null,
    body_zone: form.body_zone || null,
    wear_layer: form.wear_layer || null,
    source_url: form.source_url.trim() || null,
    description: form.description.trim() || null,
    color: normalizeColorForStorage(form.color),
    season: normalizeSeasonForStorage(form.season),
    size: sizeKind.value && form.size.trim() ? form.size.trim() : null,
    size_system:
      sizeKind.value === 'shoes' && form.size.trim() ? form.size_system : null,
    notes: form.notes.trim() || null,
    purchase_price: form.gift
      ? null
      : form.purchase_price !== ''
        ? Number(form.purchase_price)
        : null,
    purchase_currency: form.gift
      ? null
      : normalizePurchaseCurrency(form.purchase_currency),
    current_value: form.current_value !== '' ? Number(form.current_value) : null,
  }

  return payload
}

async function handleSubmit() {
  if (hasPendingImageEntries()) {
    setProductImportFeedback(
      'Poczekaj, aż wszystkie zdjęcia się pobiorą i wytną (lub usuń niedokończone wpisy).',
      false
    )
    return
  }

  await ensureAllOutfitCutouts()

  if (hasPendingImageEntries()) {
    setProductImportFeedback(
      'Poczekaj, aż wycinka zdjęć się skończy.',
      false
    )
    return
  }

  emit('submit', {
    payload: buildPayload(),
    fileOptions: {
      ...(await buildImageFileOptions()),
      traceId: importTraceId.value,
    },
  })
}

onMounted(async () => {
  exchangeRates.value = await fetchExchangeRates()

  await Promise.all([
    itemsStore.fetchEntities(),
    collectionStore.fetchCollections(),
  ])
  if (!form.default_persona_id && personasStore.activePersonaId) {
    form.default_persona_id = personasStore.activePersonaId
  }
  if (props.defaultCategoryId) {
    form.category_id = String(props.defaultCategoryId)
  }
})

defineExpose({ reset, loadFromItem })
</script>
