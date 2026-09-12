<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\ExchangeRateService;
use App\Services\ItemDuplicationService;
use App\Services\ItemImageOrientationService;
use App\Services\LangfuseTraceService;
use App\Models\ItemImage;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
{
    private const MAX_IMAGES = 4;

    private function applyGiftRules(array $data): array
    {
        if (! empty($data['gift'])) {
            $data['purchase_price'] = null;
            $data['purchase_currency'] = null;
            $data['purchase_price_pln'] = null;
        }

        return $data;
    }

    private function applyPurchasePln(array $data, ExchangeRateService $exchangeRates): array
    {
        if (! empty($data['gift']) || ! array_key_exists('purchase_price', $data) || $data['purchase_price'] === null) {
            if (! empty($data['gift'])) {
                $data['purchase_price_pln'] = null;
            }

            return $data;
        }

        $currency = $exchangeRates->normalizeCurrency($data['purchase_currency'] ?? 'PLN');
        $data['purchase_currency'] = $currency;
        $data['purchase_price_pln'] = $exchangeRates->convertToPln(
            (float) $data['purchase_price'],
            $currency
        );

        return $data;
    }

    private function preparePersonaFitInput(Request $request): void
    {
        if (! $request->has('fits_persona_ids')) {
            return;
        }

        $value = $request->input('fits_persona_ids');

        if ($value === '' || $value === null) {
            $request->merge(['fits_persona_ids' => null]);

            return;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                $request->merge(['fits_persona_ids' => $decoded]);

                return;
            }

            $parts = array_filter(array_map('trim', explode(',', $value)), fn ($part) => $part !== '');
            if ($parts !== []) {
                $request->merge(['fits_persona_ids' => array_map('intval', $parts)]);
            }
        }
    }

    private function describeUploadError(UploadedFile $file): string
    {
        $clientKb = (int) ceil($file->getSize() / 1024);
        $limitKb = (int) ceil(self::uploadMaxBytes() / 1024);

        return match ($file->getError()) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => sprintf(
                'Plik „%s” (%d KB) przekracza limit PHP (upload_max_filesize=%s, post_max_size=%s). Zmniejsz zdjęcie lub zwiększ limit w kontenerze backend.',
                $file->getClientOriginalName(),
                $clientKb,
                ini_get('upload_max_filesize'),
                ini_get('post_max_size'),
            ),
            UPLOAD_ERR_PARTIAL => 'Przesyłanie pliku zostało przerwane — spróbuj ponownie.',
            UPLOAD_ERR_NO_FILE => 'Nie odebrano pliku (pusty upload). Odśwież formularz i dodaj zdjęcie ponownie.',
            UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE, UPLOAD_ERR_EXTENSION => sprintf(
                'Błąd serwera przy zapisie pliku (kod %d): %s',
                $file->getError(),
                $file->getErrorMessage(),
            ),
            default => $file->getError() === UPLOAD_ERR_OK
                ? 'Nieprawidłowy plik obrazu.'
                : sprintf(
                    'Upload nie powiódł się (kod %d, %d KB, limit ~%d KB): %s',
                    $file->getError(),
                    $clientKb,
                    $limitKb,
                    $file->getErrorMessage(),
                ),
        };
    }

    private static function uploadMaxBytes(): int
    {
        return min(
            self::parseIniSize((string) ini_get('upload_max_filesize')),
            self::parseIniSize((string) ini_get('post_max_size')),
        );
    }

    private static function parseIniSize(string $value): int
    {
        $value = trim($value);
        if ($value === '') {
            return PHP_INT_MAX;
        }

        $unit = strtolower(substr($value, -1));
        $number = (float) $value;

        return match ($unit) {
            'g' => (int) ($number * 1024 * 1024 * 1024),
            'm' => (int) ($number * 1024 * 1024),
            'k' => (int) ($number * 1024),
            default => (int) $number,
        };
    }

    private function assertValidUploadedImages(Request $request): void
    {
        $files = $request->file('new_images');

        if ($files === null) {
            return;
        }

        $list = $files instanceof UploadedFile
            ? [$files]
            : (is_array($files) ? array_values($files) : []);

        $errors = [];

        foreach ($list as $index => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            if ($file->isValid()) {
                continue;
            }

            $message = $this->describeUploadError($file);

            Log::warning('item.image.upload_failed', [
                'index' => $index,
                'field' => "new_images.{$index}",
                'error_code' => $file->getError(),
                'error_message' => $file->getErrorMessage(),
                'client_name' => $file->getClientOriginalName(),
                'client_mime' => $file->getClientMimeType(),
                'client_size_bytes' => $file->getSize(),
                'php_upload_max_filesize' => ini_get('upload_max_filesize'),
                'php_post_max_size' => ini_get('post_max_size'),
                'user_message' => $message,
            ]);

            $errors["new_images.{$index}"] = [$message];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function validateItem(Request $request, bool $creating = false): array
    {
        $this->preparePersonaFitInput($request);
        $this->assertValidUploadedImages($request);

        $userId = auth()->id();
        $entityOwned = Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', $userId));
        $categoryOwned = Rule::exists('categories', 'id')->where(fn ($q) => $q->where('user_id', $userId));

        $rules = [
            'entity_id' => ['nullable', $entityOwned],
            'fits_all_personas' => 'sometimes|boolean',
            'fits_persona_ids' => 'nullable|array',
            'fits_persona_ids.*' => ['integer', $entityOwned],
            'default_persona_id' => ['nullable', $entityOwned],
            'character_id' => 'nullable|exists:characters,id',
            'name' => ($creating ? 'required' : 'sometimes').'|string|max:255',
            'rarity' => 'nullable|string|in:common,uncommon,rare,epic,legendary',
            'like_rating' => 'nullable|integer|min:1|max:5',
            'brand' => 'nullable|string|max:128',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:64',
            'season' => 'nullable|string|max:32',
            'size' => 'nullable|string|max:16',
            'size_system' => 'nullable|in:eu,us',
            'category_id' => ['nullable', $categoryOwned],
            'gift' => 'sometimes|boolean',
            'purchase_price' => 'nullable|numeric|min:0',
            'purchase_currency' => 'nullable|string|in:PLN,EUR,USD,GBP,CHF,CZK',
            'current_value' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'source_url' => 'nullable|url|max:2048',
            'new_images' => 'nullable|array|max:'.self::MAX_IMAGES,
            'new_images.*' => 'file|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'new_image_urls' => 'nullable|string',
            'remove_image_ids' => 'nullable|string',
            'image_order_slots' => 'nullable|string',
        ];

        $data = $request->validate($rules);

        return $this->normalizePersonaFit($data);
    }

    private function normalizePersonaFit(array $data): array
    {
        $fitsAll = (bool) ($data['fits_all_personas'] ?? true);

        if ($fitsAll) {
            $data['fits_all_personas'] = true;
            $data['fits_persona_ids'] = null;
        } else {
            $data['fits_all_personas'] = false;
            $ids = array_values(array_unique(array_map('intval', $data['fits_persona_ids'] ?? [])));
            $data['fits_persona_ids'] = $ids ?: null;

            if (! empty($data['default_persona_id'])) {
                $defaultId = (int) $data['default_persona_id'];
                if (! $ids || ! in_array($defaultId, $ids, true)) {
                    $data['default_persona_id'] = null;
                }
            }
        }

        if (empty($data['default_persona_id'])) {
            $data['default_persona_id'] = null;
        }

        return $data;
    }

    private function decodeJsonList(?string $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function deleteImageFile(ItemImage $image): void
    {
        if ($image->image_path) {
            Storage::disk('public')->delete($image->image_path);
        }
    }

    private function assertUnderImageLimit(Item $item): void
    {
        if ($item->images()->count() >= self::MAX_IMAGES) {
            throw ValidationException::withMessages([
                'new_images' => ['Maksymalnie '.self::MAX_IMAGES.' zdjęcia na item.'],
            ]);
        }
    }

    /** @return list<UploadedFile> */
    private function uploadedImages(Request $request): array
    {
        $files = $request->file('new_images');

        if ($files === null) {
            return [];
        }

        if ($files instanceof UploadedFile) {
            return [$files];
        }

        if (! is_array($files)) {
            return [];
        }

        return array_values(array_filter(
            $files,
            fn ($file) => $file instanceof UploadedFile
        ));
    }

    private function syncImages(Request $request, Item $item, ?ItemImageOrientationService $orientation = null): void
    {
        $removeIds = array_map('intval', $this->decodeJsonList($request->input('remove_image_ids')));

        if ($removeIds !== []) {
            $toRemove = $item->images()->whereIn('id', $removeIds)->get();

            foreach ($toRemove as $image) {
                $this->deleteImageFile($image);
                $image->delete();
            }
        }

        $slots = $this->decodeJsonList($request->input('image_order_slots'));
        $newFiles = $this->uploadedImages($request);
        $newUrls = $this->decodeJsonList($request->input('new_image_urls'));
        $addedNewImages = false;

        if ($slots !== []) {
            $sortOrder = 0;

            foreach ($slots as $slot) {
                if (!is_string($slot)) {
                    continue;
                }

                if (str_starts_with($slot, 'id:')) {
                    $id = (int) substr($slot, 3);
                    $image = $item->images()->where('id', $id)->first();

                    if ($image) {
                        $image->update(['sort_order' => $sortOrder++]);
                    }

                    continue;
                }

                if (str_starts_with($slot, 'file:')) {
                    $idx = (int) substr($slot, 5);

                    if (!isset($newFiles[$idx]) || !$newFiles[$idx] instanceof UploadedFile) {
                        continue;
                    }

                    $this->assertUnderImageLimit($item);

                    $item->images()->create([
                        'image_path' => $newFiles[$idx]->store('items', 'public'),
                        'sort_order' => $sortOrder++,
                    ]);
                    $addedNewImages = true;

                    continue;
                }

                if (str_starts_with($slot, 'url:')) {
                    $idx = (int) substr($slot, 4);

                    if (!isset($newUrls[$idx]) || !is_string($newUrls[$idx]) || $newUrls[$idx] === '') {
                        continue;
                    }

                    if (!filter_var($newUrls[$idx], FILTER_VALIDATE_URL)) {
                        continue;
                    }

                    $this->assertUnderImageLimit($item);

                    $item->images()->create([
                        'external_url' => $newUrls[$idx],
                        'sort_order' => $sortOrder++,
                    ]);
                    $addedNewImages = true;
                }
            }

            if ($addedNewImages) {
                $this->orientCoverImage($item, $orientation);
            }

            return;
        }

        $sortOrder = (int) $item->images()->max('sort_order');

        foreach ($newFiles as $file) {
            $this->assertUnderImageLimit($item);

            $sortOrder++;
            $item->images()->create([
                'image_path' => $file->store('items', 'public'),
                'sort_order' => $sortOrder,
            ]);
            $addedNewImages = true;
        }

        foreach ($newUrls as $url) {
            if (!is_string($url) || $url === '' || !filter_var($url, FILTER_VALIDATE_URL)) {
                continue;
            }

            $this->assertUnderImageLimit($item);

            $sortOrder++;
            $item->images()->create([
                'external_url' => $url,
                'sort_order' => $sortOrder,
            ]);
            $addedNewImages = true;
        }

        if ($addedNewImages) {
            $this->orientCoverImage($item, $orientation);
        }
    }

    private function orientCoverImage(Item $item, ?ItemImageOrientationService $orientation): void
    {
        if ($orientation === null) {
            return;
        }

        $cover = $item->images()->orderBy('sort_order')->orderBy('id')->first();

        if ($cover === null) {
            return;
        }

        if ($cover->image_path && str_ends_with(strtolower($cover->image_path), '.png')) {
            return;
        }

        try {
            $orientation->orientCoverIfNeeded($cover);
        } catch (\Throwable) {
            // Nie blokuj zapisu itemu przy problemie z orientacją covera.
        }
    }

    private function itemResponse(Item $item)
    {
        return $item->load(['entity', 'character', 'collectionGroup', 'images', 'defaultPersona']);
    }

    public function index()
    {
        return Item::with(['entity', 'character', 'images', 'defaultPersona', 'collectionGroup'])
            ->latest()
            ->get();
    }

    public function show(Item $item)
    {
        return $this->itemResponse($item);
    }

    public function duplicate(Item $item, ItemDuplicationService $duplication)
    {
        $copy = $duplication->duplicate($item);

        return response()->json($this->itemResponse($copy), 201);
    }

    public function store(
        Request $request,
        ExchangeRateService $exchangeRates,
        ItemImageOrientationService $orientation,
        LangfuseTraceService $langfuse,
    ) {
        $traceId = $request->input('trace_id') ?: $request->header('X-Langfuse-Trace-Id');

        $create = function (?string $id) use ($request, $exchangeRates, $orientation, $langfuse) {
            $data = $this->applyPurchasePln(
                $this->applyGiftRules($this->validateItem($request, creating: true)),
                $exchangeRates
            );

            $item = Item::create($data);
            $this->syncImages($request, $item, $orientation);

            if ($id && $langfuse->enabled()) {
                $langfuse->span(
                    $id,
                    'item.create.images',
                    $this->imageTraceInput($request),
                    [
                        'item_id' => $item->id,
                        'image_count' => $item->images()->count(),
                    ],
                    ['phase' => 'persist'],
                );
            }

            return $this->itemResponse($item->fresh());
        };

        if ($traceId && $langfuse->enabled()) {
            $response = $langfuse->runTrace(
                'item.create',
                fn (string $id) => $create($id),
                ['name' => $request->input('name'), 'source_url' => $request->input('source_url')],
                ['flow' => 'item-form'],
                $traceId,
            );
        } else {
            $response = $create(null);
        }

        return response()->json($response, 201);
    }

    /** @return array<string, mixed> */
    private function imageTraceInput(Request $request): array
    {
        $slots = $this->decodeJsonList($request->input('image_order_slots'));
        $urls = $this->decodeJsonList($request->input('new_image_urls'));

        return [
            'image_order_slots' => $slots,
            'new_image_url_count' => count($urls),
            'new_image_urls_preview' => array_map(
                fn (string $u) => strlen($u) > 96 ? '…'.substr($u, -95) : $u,
                array_slice($urls, 0, 16),
            ),
            'new_upload_count' => count($this->uploadedImages($request)),
        ];
    }

    public function update(Request $request, Item $item, ExchangeRateService $exchangeRates, ItemImageOrientationService $orientation)
    {
        $data = $this->applyPurchasePln(
            $this->applyGiftRules($this->validateItem($request)),
            $exchangeRates
        );

        $item->update($data);
        $this->syncImages($request, $item, $orientation);

        return $this->itemResponse($item->fresh());
    }

    public function destroy(Item $item)
    {
        foreach ($item->images as $image) {
            $this->deleteImageFile($image);
        }

        $item->delete();

        return response()->json(null, 204);
    }
}
