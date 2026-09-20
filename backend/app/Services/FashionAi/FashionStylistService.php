<?php

namespace App\Services\FashionAi;

use App\Models\Entity;
use App\Models\Item;
use App\Models\Outfit;
use App\Models\User;
use App\Support\FashionCollection;
use App\Support\GarmentAttributes;
use App\Support\ClothingBodyPlacement;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class FashionStylistService
{
    public function __construct(
        private FashionAiSettings $settings,
        private FashionAiLogger $logger,
    ) {}

    public function isConfigured(): bool
    {
        return $this->settings->isConfigured();
    }

    /**
     * @return array{
     *   analysis: array{
     *     wardrobe_overview: ?string,
     *     strengths: list<string>,
     *     limitations: list<string>,
     *     possible_sets_estimate: ?int,
     *     possible_sets_note: ?string
     *   },
     *   suggestions: list<array{
     *     label: ?string,
     *     occasion: ?string,
     *     formality: ?float,
     *     notes: ?string,
     *     primary_item_ids: list<int>,
     *     supporting_item_ids: list<int>,
     *     accessory_item_ids: list<int>,
     *     item_ids: list<int>,
     *     rationale: ?string
     *   }>,
     *   wardrobe_needs: list<array<string, mixed>>
     * }
     */
    public function suggest(
        User $user,
        int $entityId,
        ?string $occasion = null,
        ?string $notes = null,
    ): array {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Fashion AI is not configured. An admin must add an OpenAI API key in Backend Settings.');
        }

        $catalog = $this->buildCatalog($user, $entityId);
        if (count($catalog) < 2) {
            throw new RuntimeException('Not enough fashion items in the wardrobe for this Prim (need at least 2).');
        }

        $persona = $this->resolvePersona($user, $entityId);
        $gender = $this->normalizeGender($persona['gender'] ?? null);
        $summary = $this->buildWardrobeSummary($catalog);
        $preferredStores = $this->preferredStoresFor($user);
        $allowedIds = array_map(fn ($row) => (int) $row['id'], $catalog);
        $catalogById = [];
        foreach ($catalog as $row) {
            $catalogById[(int) $row['id']] = $row;
        }
        $payload = $this->callOpenAi(
            catalog: $catalog,
            summary: $summary,
            preferredStores: $preferredStores,
            occasion: $occasion,
            notes: $notes,
            userId: (int) $user->id,
            entityId: $entityId,
            persona: $persona,
        );

        $suggestions = [];
        foreach ($payload['suggestions'] ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $primary = $this->filterCatalogIds($row['primary_item_ids'] ?? [], $allowedIds);
            $supporting = $this->filterCatalogIds($row['supporting_item_ids'] ?? [], $allowedIds);
            $accessory = $this->filterCatalogIds($row['accessory_item_ids'] ?? [], $allowedIds);

            // Legacy fallback: flat item_ids only when role arrays absent.
            if ($primary === [] && $supporting === [] && $accessory === [] && isset($row['item_ids'])) {
                $primary = $this->filterCatalogIds($row['item_ids'] ?? [], $allowedIds);
            }

            $seedIds = array_values(array_unique([...$primary, ...$supporting, ...$accessory]));
            if ($seedIds === []) {
                continue;
            }

            $repaired = $this->repairOutfitFromCatalog($seedIds, $catalogById, $catalog);
            if ($repaired === null) {
                continue;
            }

            $rawOccasion = isset($row['occasion']) && $row['occasion'] !== '' && $row['occasion'] !== null
                ? trim((string) $row['occasion'])
                : ($occasion ? trim((string) $occasion) : null);
            $mappedFromRaw = Outfit::normalizeOccasion($rawOccasion);
            $normalizedOccasion = $mappedFromRaw ?? Outfit::normalizeOccasion($occasion);
            $occasionDetail = null;
            if (is_string($rawOccasion) && $rawOccasion !== '') {
                $sameAsEnum = $mappedFromRaw !== null
                    && strcasecmp($rawOccasion, $mappedFromRaw) === 0;
                if (! $sameAsEnum) {
                    $occasionDetail = $rawOccasion;
                }
            }

            $suggestions[] = [
                'label' => isset($row['label']) ? (string) $row['label'] : null,
                'occasion' => $normalizedOccasion,
                'occasion_detail' => $occasionDetail,
                'formality' => $this->clampFormality($row['formality'] ?? null),
                'notes' => isset($row['notes']) && $row['notes'] !== null ? (string) $row['notes'] : null,
                'primary_item_ids' => $repaired['primary_item_ids'],
                'supporting_item_ids' => $repaired['supporting_item_ids'],
                'accessory_item_ids' => $repaired['accessory_item_ids'],
                'item_ids' => $repaired['item_ids'],
                'rationale' => isset($row['rationale']) ? (string) $row['rationale'] : null,
            ];
        }

        if (! $suggestions) {
            $suggestions = $this->buildFallbackOutfits($catalog, $occasion);
        }

        if (! $suggestions) {
            // Soft-fail: keep analysis / needs instead of hard-erroring the whole request.
            $analysisRaw = is_array($payload['analysis'] ?? null) ? $payload['analysis'] : [];
            $estimate = $analysisRaw['possible_sets_estimate'] ?? null;
            $wardrobeNeeds = [];
            foreach ($payload['wardrobe_needs'] ?? [] as $row) {
                $normalized = $this->normalizeWardrobeNeed($row, $allowedIds, $preferredStores, $gender);
                if ($normalized !== null) {
                    $wardrobeNeeds[] = $normalized;
                }
            }

            return [
                'analysis' => [
                    'wardrobe_overview' => isset($analysisRaw['wardrobe_overview'])
                        ? (string) $analysisRaw['wardrobe_overview']
                        : ($summary['narrative'] ?? null),
                    'strengths' => $this->stringList($analysisRaw['strengths'] ?? []),
                    'limitations' => array_values(array_unique([
                        ...$this->stringList($analysisRaw['limitations'] ?? []),
                        'No complete outfit proposals could be assembled from the wardrobe response.',
                    ])),
                    'possible_sets_estimate' => is_numeric($estimate) ? (int) $estimate : null,
                    'possible_sets_note' => isset($analysisRaw['possible_sets_note'])
                        ? (string) $analysisRaw['possible_sets_note']
                        : null,
                ],
                'suggestions' => [],
                'wardrobe_needs' => array_slice($wardrobeNeeds, 0, 8),
                'warning' => 'Could not assemble complete outfits from the AI response. Try Analyze again.',
            ];
        }

        $analysisRaw = is_array($payload['analysis'] ?? null) ? $payload['analysis'] : [];
        $estimate = $analysisRaw['possible_sets_estimate'] ?? null;
        $analysis = [
            'wardrobe_overview' => isset($analysisRaw['wardrobe_overview'])
                ? (string) $analysisRaw['wardrobe_overview']
                : ($summary['narrative'] ?? null),
            'strengths' => $this->stringList($analysisRaw['strengths'] ?? []),
            'limitations' => $this->stringList($analysisRaw['limitations'] ?? []),
            'possible_sets_estimate' => is_numeric($estimate) ? (int) $estimate : null,
            'possible_sets_note' => isset($analysisRaw['possible_sets_note'])
                ? (string) $analysisRaw['possible_sets_note']
                : null,
        ];

        $wardrobeNeeds = [];
        foreach ($payload['wardrobe_needs'] ?? [] as $row) {
            $normalized = $this->normalizeWardrobeNeed($row, $allowedIds, $preferredStores, $gender);
            if ($normalized !== null) {
                $wardrobeNeeds[] = $normalized;
            }
        }

        return [
            'analysis' => $analysis,
            'suggestions' => array_slice($suggestions, 0, 3),
            'wardrobe_needs' => array_slice($wardrobeNeeds, 0, 8),
        ];
    }

    /**
     * @param  list<mixed>  $ids
     * @param  list<int>  $allowedIds
     * @return list<int>
     */
    private function filterCatalogIds(array $ids, array $allowedIds): array
    {
        $out = [];
        foreach ($ids as $id) {
            $id = (int) $id;
            if (in_array($id, $allowedIds, true)) {
                $out[] = $id;
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * Re-bucket AI IDs by real catalog slots and fill missing footwear/top/bottom.
     *
     * @param  list<int>  $seedIds
     * @param  array<int, array<string, mixed>>  $catalogById
     * @param  list<array<string, mixed>>  $catalog
     * @return array{
     *   primary_item_ids: list<int>,
     *   supporting_item_ids: list<int>,
     *   accessory_item_ids: list<int>,
     *   item_ids: list<int>
     * }|null
     */
    private function repairOutfitFromCatalog(array $seedIds, array $catalogById, array $catalog): ?array
    {
        $ids = [];
        foreach ($seedIds as $id) {
            $id = (int) $id;
            if (isset($catalogById[$id])) {
                $ids[] = $id;
            }
        }
        $ids = array_values(array_unique($ids));
        if ($ids === []) {
            return null;
        }

        $bySlot = $this->catalogIdsBySlot($catalog);
        $slotsPresent = $this->slotsForIds($ids, $catalogById);

        // Fill missing structure pieces from the wardrobe.
        if (isset($slotsPresent['one_piece']) && ! isset($slotsPresent['footwear'])) {
            $pick = $this->pickComplement($bySlot['footwear'] ?? [], $ids, $catalogById);
            if ($pick !== null) {
                $ids[] = $pick;
            }
        } elseif (isset($slotsPresent['top']) && isset($slotsPresent['bottom']) && ! isset($slotsPresent['footwear'])) {
            $pick = $this->pickComplement($bySlot['footwear'] ?? [], $ids, $catalogById);
            if ($pick !== null) {
                $ids[] = $pick;
            }
        } elseif (isset($slotsPresent['top']) && isset($slotsPresent['footwear']) && ! isset($slotsPresent['bottom'])) {
            $pick = $this->pickComplement($bySlot['bottom'] ?? [], $ids, $catalogById, preferNonSupporting: true);
            if ($pick !== null) {
                $ids[] = $pick;
            }
        } elseif (isset($slotsPresent['bottom']) && isset($slotsPresent['footwear']) && ! isset($slotsPresent['top'])) {
            $pick = $this->pickComplement($bySlot['top'] ?? [], $ids, $catalogById);
            if ($pick !== null) {
                $ids[] = $pick;
            }
        } elseif (isset($slotsPresent['footwear']) && ! isset($slotsPresent['one_piece']) && ! isset($slotsPresent['top'])) {
            // Shoes-only (or shoes + irrelevant): prefer a dress, else top+bottom.
            $dress = $this->pickComplement($bySlot['one_piece'] ?? [], $ids, $catalogById);
            if ($dress !== null) {
                $ids[] = $dress;
            } else {
                $top = $this->pickComplement($bySlot['top'] ?? [], $ids, $catalogById);
                $bottom = $this->pickComplement($bySlot['bottom'] ?? [], $ids, $catalogById, preferNonSupporting: true);
                if ($top !== null) {
                    $ids[] = $top;
                }
                if ($bottom !== null) {
                    $ids[] = $bottom;
                }
            }
        } elseif (isset($slotsPresent['one_piece']) || (isset($slotsPresent['top']) && isset($slotsPresent['bottom']))) {
            // already structured; footwear handled above
        } elseif (isset($slotsPresent['top']) && ! isset($slotsPresent['bottom']) && ! isset($slotsPresent['footwear'])) {
            $bottom = $this->pickComplement($bySlot['bottom'] ?? [], $ids, $catalogById, preferNonSupporting: true);
            $shoes = $this->pickComplement($bySlot['footwear'] ?? [], $ids, $catalogById);
            if ($bottom !== null) {
                $ids[] = $bottom;
            }
            if ($shoes !== null) {
                $ids[] = $shoes;
            }
        }

        $ids = array_values(array_unique($ids));
        $items = [];
        foreach ($ids as $id) {
            $items[] = $catalogById[$id];
        }
        if (! GarmentAttributes::isCompleteOutfit($items)) {
            return null;
        }

        return $this->bucketIdsByCatalogRole($ids, $catalogById);
    }

    /**
     * Deterministic complete looks when the model fails to propose any.
     *
     * @param  list<array<string, mixed>>  $catalog
     * @return list<array<string, mixed>>
     */
    private function buildFallbackOutfits(array $catalog, ?string $occasion): array
    {
        $bySlot = $this->catalogIdsBySlot($catalog);
        $catalogById = [];
        foreach ($catalog as $row) {
            $catalogById[(int) $row['id']] = $row;
        }

        $outfits = [];
        $usedFingerprints = [];

        foreach (array_slice($bySlot['one_piece'] ?? [], 0, 3) as $dressId) {
            $shoes = $this->pickComplement($bySlot['footwear'] ?? [], [$dressId], $catalogById);
            if ($shoes === null) {
                continue;
            }
            $repaired = $this->repairOutfitFromCatalog([$dressId, $shoes], $catalogById, $catalog);
            if ($repaired === null) {
                continue;
            }
            $fp = implode('-', $repaired['item_ids']);
            if (isset($usedFingerprints[$fp])) {
                continue;
            }
            $usedFingerprints[$fp] = true;
            $dressName = (string) ($catalogById[$dressId]['name'] ?? 'Dress');
            $outfits[] = [
                'label' => $dressName,
                'occasion' => Outfit::normalizeOccasion($occasion),
                'occasion_detail' => null,
                'formality' => null,
                'notes' => null,
                'primary_item_ids' => $repaired['primary_item_ids'],
                'supporting_item_ids' => $repaired['supporting_item_ids'],
                'accessory_item_ids' => $repaired['accessory_item_ids'],
                'item_ids' => $repaired['item_ids'],
                'rationale' => 'Complete look from your wardrobe: dress + shoes.',
            ];
            if (count($outfits) >= 2) {
                break;
            }
        }

        foreach (array_slice($bySlot['top'] ?? [], 0, 3) as $topId) {
            if (count($outfits) >= 3) {
                break;
            }
            $bottom = $this->pickComplement($bySlot['bottom'] ?? [], [$topId], $catalogById, preferNonSupporting: true);
            $shoes = $this->pickComplement($bySlot['footwear'] ?? [], [$topId], $catalogById);
            if ($bottom === null || $shoes === null) {
                continue;
            }
            $repaired = $this->repairOutfitFromCatalog([$topId, $bottom, $shoes], $catalogById, $catalog);
            if ($repaired === null) {
                continue;
            }
            $fp = implode('-', $repaired['item_ids']);
            if (isset($usedFingerprints[$fp])) {
                continue;
            }
            $usedFingerprints[$fp] = true;
            $topName = (string) ($catalogById[$topId]['name'] ?? 'Top');
            $bottomName = (string) ($catalogById[$bottom]['name'] ?? 'Bottom');
            $outfits[] = [
                'label' => $topName.' + '.$bottomName,
                'occasion' => Outfit::normalizeOccasion($occasion),
                'occasion_detail' => null,
                'formality' => null,
                'notes' => null,
                'primary_item_ids' => $repaired['primary_item_ids'],
                'supporting_item_ids' => $repaired['supporting_item_ids'],
                'accessory_item_ids' => $repaired['accessory_item_ids'],
                'item_ids' => $repaired['item_ids'],
                'rationale' => 'Complete look from your wardrobe: top + bottom + shoes.',
            ];
        }

        return array_slice($outfits, 0, 3);
    }

    /**
     * @param  list<array<string, mixed>>  $catalog
     * @return array<string, list<int>>
     */
    private function catalogIdsBySlot(array $catalog): array
    {
        $bySlot = [];
        foreach ($catalog as $row) {
            $slot = (string) ($row['outfit_slot'] ?? 'other');
            $bySlot[$slot][] = (int) $row['id'];
        }

        return $bySlot;
    }

    /**
     * @param  list<int>  $ids
     * @param  array<int, array<string, mixed>>  $catalogById
     * @return array<string, true>
     */
    private function slotsForIds(array $ids, array $catalogById): array
    {
        $slots = [];
        foreach ($ids as $id) {
            $row = $catalogById[$id] ?? null;
            if (! $row) {
                continue;
            }
            $slot = (string) ($row['outfit_slot'] ?? GarmentAttributes::outfitSlot(
                $row['category'] ?? null,
                $row['body_zone'] ?? null,
                $row['name'] ?? null,
                $row['collection'] ?? null,
            ));
            $slots[$slot] = true;
        }

        return $slots;
    }

    /**
     * @param  list<int>  $candidates
     * @param  list<int>  $exclude
     * @param  array<int, array<string, mixed>>  $catalogById
     */
    private function pickComplement(
        array $candidates,
        array $exclude,
        array $catalogById,
        bool $preferNonSupporting = false,
    ): ?int {
        $excludeMap = array_fill_keys($exclude, true);
        $fallback = null;
        foreach ($candidates as $id) {
            $id = (int) $id;
            if (isset($excludeMap[$id]) || ! isset($catalogById[$id])) {
                continue;
            }
            $role = (string) ($catalogById[$id]['visibility_role'] ?? 'primary');
            if ($preferNonSupporting && $role === 'supporting') {
                $fallback ??= $id;
                continue;
            }

            return $id;
        }

        return $fallback;
    }

    /**
     * @param  list<int>  $ids
     * @param  array<int, array<string, mixed>>  $catalogById
     * @return array{
     *   primary_item_ids: list<int>,
     *   supporting_item_ids: list<int>,
     *   accessory_item_ids: list<int>,
     *   item_ids: list<int>
     * }
     */
    private function bucketIdsByCatalogRole(array $ids, array $catalogById): array
    {
        $primary = [];
        $supporting = [];
        $accessory = [];

        foreach ($ids as $id) {
            $row = $catalogById[$id] ?? null;
            if (! $row) {
                continue;
            }
            $slot = (string) ($row['outfit_slot'] ?? 'other');
            $role = (string) ($row['visibility_role'] ?? 'primary');

            if ($role === 'accessory' || $slot === 'other' && $role === 'accessory') {
                $accessory[] = $id;
                continue;
            }
            if ($role === 'supporting' || $slot === 'bottom' && $role === 'supporting') {
                // Tights etc. stay supporting; structured bottoms stay primary.
                if (in_array($slot, ['one_piece', 'top', 'bottom', 'footwear', 'outerwear'], true) && $role !== 'supporting') {
                    $primary[] = $id;
                } else {
                    $supporting[] = $id;
                }
                continue;
            }
            if (in_array($slot, ['one_piece', 'top', 'bottom', 'footwear', 'outerwear'], true)) {
                $primary[] = $id;
                continue;
            }
            if ($role === 'supporting') {
                $supporting[] = $id;
            } else {
                $primary[] = $id;
            }
        }

        $primary = array_values(array_unique($primary));
        $supporting = array_values(array_unique(array_diff($supporting, $primary)));
        $accessory = array_values(array_unique(array_diff($accessory, $primary, $supporting)));

        return [
            'primary_item_ids' => $primary,
            'supporting_item_ids' => $supporting,
            'accessory_item_ids' => $accessory,
            'item_ids' => array_values(array_unique([...$primary, ...$supporting, ...$accessory])),
        ];
    }

    private function clampFormality(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value)) {
            return null;
        }
        $n = (float) $value;
        if ($n < 0) {
            $n = 0;
        }
        if ($n > 10) {
            $n = 10;
        }

        return $n;
    }

    /**
     * @param  mixed  $raw
     * @return list<string>
     */
    private function stringList(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $item) {
            $s = trim((string) $item);
            if ($s !== '') {
                $out[] = $s;
            }
        }

        return array_values($out);
    }

    /**
     * @param  mixed  $row
     * @param  list<int>  $allowedIds
     * @param  list<array{name: string, brand: ?string, url: string}>  $preferredStores
     * @param  'female'|'male'|null  $gender
     * @return array<string, mixed>|null
     */
    private function normalizeWardrobeNeed(
        mixed $row,
        array $allowedIds,
        array $preferredStores,
        ?string $gender,
    ): ?array {
        if (! is_array($row)) {
            return null;
        }

        $itemType = trim((string) ($row['item_type'] ?? ''));
        $reason = trim((string) ($row['reason'] ?? ''));
        if ($itemType === '' || $reason === '') {
            return null;
        }

        $needId = trim((string) ($row['need_id'] ?? ''));
        if ($needId === '') {
            $needId = 'need_'.substr(sha1($itemType.'|'.$reason), 0, 8);
        }

        $priority = strtolower(trim((string) ($row['priority'] ?? 'medium')));
        if (! in_array($priority, ['low', 'medium', 'high'], true)) {
            $priority = 'medium';
        }

        $pairIds = $this->filterCatalogIds($row['pairs_with_item_ids'] ?? [], $allowedIds);
        $stores = $this->stringList($row['preferred_stores'] ?? []);
        if ($stores === [] && $preferredStores !== []) {
            $stores = array_map(fn ($s) => $s['name'], array_slice($preferredStores, 0, 3));
        }

        $formality = null;
        if (is_array($row['formality'] ?? null)) {
            $min = $this->clampFormality($row['formality']['min'] ?? null);
            $max = $this->clampFormality($row['formality']['max'] ?? null);
            if ($min !== null || $max !== null) {
                $formality = ['min' => $min, 'max' => $max];
            }
        }

        $details = $this->normalizeNeedDetails(is_array($row['details'] ?? null) ? $row['details'] : null);

        $searchQuery = trim((string) ($row['search_query'] ?? ''));
        if ($searchQuery === '') {
            $searchQuery = trim(implode(' ', array_filter([
                $itemType,
                implode(' ', $this->stringList($row['colors'] ?? [])),
                implode(' ', $this->stringList($row['subtype'] ?? [])),
            ])));
        }

        $primaryStoreName = $stores[0] ?? ($preferredStores[0]['name'] ?? null);
        $storeUrl = $this->matchPreferredStoreUrl($preferredStores, $primaryStoreName);
        $searchUrl = ($storeUrl && $searchQuery !== '')
            ? $this->buildStoreSearchUrl($storeUrl, $searchQuery, $gender)
            : null;

        return [
            'need_id' => $needId,
            'item_type' => $itemType,
            'subtype' => $this->stringList($row['subtype'] ?? []),
            'colors' => $this->stringList($row['colors'] ?? []),
            'formality' => $formality,
            'styles' => $this->stringList($row['styles'] ?? []),
            'materials' => $this->stringList($row['materials'] ?? []),
            'details' => $details,
            'avoid' => $this->stringList($row['avoid'] ?? []),
            'reason' => $reason,
            'priority' => $priority,
            'pairs_with_item_ids' => $pairIds,
            'preferred_stores' => $stores,
            'search_query' => $searchQuery !== '' ? $searchQuery : null,
            'search_url' => $searchUrl,
            'store_url' => $storeUrl,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $raw
     * @return array<string, mixed>|null
     */
    private function normalizeNeedDetails(?array $raw): ?array
    {
        if ($raw === null) {
            return null;
        }

        $out = [];

        if (is_array($raw['denier'] ?? null)) {
            $min = isset($raw['denier']['min']) && is_numeric($raw['denier']['min'])
                ? (float) $raw['denier']['min'] : null;
            $max = isset($raw['denier']['max']) && is_numeric($raw['denier']['max'])
                ? (float) $raw['denier']['max'] : null;
            if ($min !== null || $max !== null) {
                $out['denier'] = ['min' => $min, 'max' => $max];
            }
        }

        $opacity = $this->stringList($raw['opacity'] ?? []);
        $opacity = array_values(array_filter(
            $opacity,
            fn ($v) => in_array($v, GarmentAttributes::OPACITY, true)
        ));
        if ($opacity !== []) {
            $out['opacity'] = $opacity;
        }

        $finish = $this->stringList($raw['finish'] ?? []);
        $finish = array_values(array_filter(
            $finish,
            fn ($v) => in_array($v, GarmentAttributes::FINISH, true)
        ));
        if ($finish !== []) {
            $out['finish'] = $finish;
        }

        if (is_array($raw['heel_height_cm'] ?? null)) {
            $min = isset($raw['heel_height_cm']['min']) && is_numeric($raw['heel_height_cm']['min'])
                ? (float) $raw['heel_height_cm']['min'] : null;
            $max = isset($raw['heel_height_cm']['max']) && is_numeric($raw['heel_height_cm']['max'])
                ? (float) $raw['heel_height_cm']['max'] : null;
            if ($min !== null || $max !== null) {
                $out['heel_height_cm'] = ['min' => $min, 'max' => $max];
            }
        }

        $toe = $this->stringList($raw['toe'] ?? []);
        if ($toe !== []) {
            $out['toe'] = $toe;
        }

        foreach (['pattern', 'waist', 'notes'] as $key) {
            if (isset($raw[$key]) && $raw[$key] !== null && trim((string) $raw[$key]) !== '') {
                $out[$key] = trim((string) $raw[$key]);
            }
        }

        return $out === [] ? null : $out;
    }

    /**
     * @param  list<array{name: string, brand: ?string, url: string}>  $preferredStores
     */
    private function matchPreferredStoreUrl(array $preferredStores, ?string $name): ?string
    {
        if ($name === null || $name === '') {
            return $preferredStores[0]['url'] ?? null;
        }
        $needle = mb_strtolower($name);
        foreach ($preferredStores as $store) {
            $candidates = [mb_strtolower($store['name']), mb_strtolower((string) ($store['brand'] ?? ''))];
            foreach ($candidates as $c) {
                if ($c !== '' && ($c === $needle || str_contains($c, $needle) || str_contains($needle, $c))) {
                    return $store['url'];
                }
            }
        }

        return $preferredStores[0]['url'] ?? null;
    }

    /**
     * @return array{id: int, name: ?string, gender: ?string}
     */
    private function resolvePersona(User $user, int $entityId): array
    {
        $entity = Entity::query()
            ->where('user_id', $user->id)
            ->whereKey($entityId)
            ->first(['id', 'name', 'gender']);

        return [
            'id' => $entityId,
            'name' => $entity?->name,
            'gender' => $this->normalizeGender($entity?->gender),
        ];
    }

    /**
     * @return 'female'|'male'|null
     */
    private function normalizeGender(?string $gender): ?string
    {
        $g = strtolower(trim((string) $gender));
        if (in_array($g, ['female', 'f', 'woman', 'women', 'kobieta', 'damska'], true)) {
            return 'female';
        }
        if (in_array($g, ['male', 'm', 'man', 'men', 'facet', 'mezczyzna', 'mężczyzna', 'meska', 'męska'], true)) {
            return 'male';
        }

        return null;
    }

    /**
     * Build a store search URL scoped to the Prim's gender section when possible.
     *
     * @param  'female'|'male'|null  $gender
     */
    private function buildStoreSearchUrl(string $storeUrl, string $query, ?string $gender = null): ?string
    {
        $query = trim($query);
        if ($query === '') {
            return rtrim($storeUrl, '/') ?: null;
        }
        $q = rawurlencode($query);
        $host = strtolower((string) (parse_url($storeUrl, PHP_URL_HOST) ?: ''));
        $isWoman = $gender === 'female';
        $isMan = $gender === 'male';

        if (str_contains($host, 'zara.com')) {
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.zara.com/pl/pl/search?searchTerm='.$q;

            return $section ? $url.'&section='.$section : $url;
        }
        if (str_contains($host, 'hm.com')) {
            // H&M PL: department=ladies | men scopes the search grid.
            $dept = $isWoman ? 'ladies' : ($isMan ? 'men' : null);
            $url = 'https://www2.hm.com/pl_pl/search-results.html?q='.$q;

            return $dept ? $url.'&department='.$dept : $url;
        }
        if (str_contains($host, 'mango.com') || str_contains($host, 'shop.mango')) {
            // Mango: /search/woman or /search/man
            $seg = $isWoman ? 'woman' : ($isMan ? 'man' : null);
            $base = $seg
                ? 'https://shop.mango.com/pl/search/'.$seg
                : 'https://shop.mango.com/pl/search';

            return $base.'?q='.$q;
        }
        if (str_contains($host, 'reserved.com')) {
            $seg = $isWoman ? 'woman' : ($isMan ? 'man' : null);
            $url = 'https://www.reserved.com/pl/pl/search?q='.$q;

            return $seg ? $url.'&gender='.$seg : $url;
        }
        if (str_contains($host, 'uniqlo.com')) {
            $seg = $isWoman ? 'women' : ($isMan ? 'men' : null);
            $url = 'https://www.uniqlo.com/pl/pl/search?q='.$q;

            return $seg ? $url.'&path='.rawurlencode('/'.$seg) : $url;
        }
        if (str_contains($host, 'massimodutti.com')) {
            // Inditex sibling of Zara — same section param.
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.massimodutti.com/pl/search?q='.$q;

            return $section ? $url.'&section='.$section : $url;
        }
        if (str_contains($host, 'pullandbear.com')) {
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.pullandbear.com/pl/pl/search?q='.$q;

            return $section ? $url.'&section='.$section : $url;
        }
        if (str_contains($host, 'bershka.com')) {
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.bershka.com/pl/pl/search?q='.$q;

            return $section ? $url.'&section='.$section : $url;
        }

        $sep = str_contains($storeUrl, '?') ? '&' : '?';
        $url = rtrim($storeUrl, '/').$sep.'q='.$q;
        if ($isWoman) {
            return $url.'&gender=woman';
        }
        if ($isMan) {
            return $url.'&gender=man';
        }

        return $url;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildCatalog(User $user, int $entityId): array
    {
        $items = Item::query()
            ->where('user_id', $user->id)
            ->fitsPersona($entityId)
            ->with(['collectionGroup:id,name'])
            ->orderBy('name')
            ->get();

        $catalog = [];
        foreach ($items as $item) {
            $groupName = $item->collectionGroup?->name;
            if (! FashionCollection::isFashion($groupName) && ! FashionCollection::isFashion($item->category)) {
                continue;
            }

            $attrs = GarmentAttributes::forCatalog(
                $item->category,
                is_array($item->garment_attributes) ? $item->garment_attributes : null
            );
            $canonicalType = ClothingBodyPlacement::resolveCanonicalType($item->category)
                ?? ClothingBodyPlacement::resolveCanonicalType($item->name);
            $outfitSlot = GarmentAttributes::outfitSlot(
                $item->category,
                $item->body_zone,
                $item->name,
                $groupName,
            );

            // Prefer inferred zone/layer in the catalog payload when DB fields are empty,
            // so the model (and completeness checks) see usable structure.
            $inferred = ClothingBodyPlacement::infer($item->category, $groupName, $item->name);
            $bodyZone = $item->body_zone ?: ($inferred['body_zone'] ?? null);
            $wearLayer = $item->wear_layer ?: ($inferred['wear_layer'] ?? null);
            $role = GarmentAttributes::visibilityRole(
                $canonicalType ?? $item->category,
                $bodyZone,
                $wearLayer
            );

            $row = [
                'id' => (int) $item->id,
                'name' => $item->name,
                'brand' => $item->brand,
                'color' => $item->color,
                'category' => $item->category,
                'canonical_type' => $canonicalType,
                'outfit_slot' => $outfitSlot,
                'collection' => $groupName,
                'body_zone' => $bodyZone,
                'wear_layer' => $wearLayer,
                'visibility_role' => $role,
                'season' => $item->season,
            ];
            if ($attrs !== null) {
                $row['attributes'] = $attrs;
            }
            $catalog[] = $row;
        }

        return $catalog;
    }

    /**
     * @param  list<array<string, mixed>>  $catalog
     * @return array{total_items: int, by_body_zone: array<string, int>, by_category: array<string, int>, by_color: array<string, int>, by_visibility_role: array<string, int>, narrative: string}
     */
    private function buildWardrobeSummary(array $catalog): array
    {
        $byZone = [];
        $byCategory = [];
        $byColor = [];
        $byRole = [];

        foreach ($catalog as $row) {
            $zone = strtolower(trim((string) ($row['body_zone'] ?? ''))) ?: 'other';
            $category = trim((string) ($row['category'] ?? '')) ?: 'other';
            $color = trim((string) ($row['color'] ?? '')) ?: 'unknown';
            $role = trim((string) ($row['visibility_role'] ?? '')) ?: 'primary';

            $byZone[$zone] = ($byZone[$zone] ?? 0) + 1;
            $byCategory[$category] = ($byCategory[$category] ?? 0) + 1;
            $byColor[$color] = ($byColor[$color] ?? 0) + 1;
            $byRole[$role] = ($byRole[$role] ?? 0) + 1;
        }

        arsort($byZone);
        arsort($byCategory);
        arsort($byColor);
        arsort($byRole);

        $parts = [];
        foreach ($byCategory as $name => $count) {
            $parts[] = "{$count}× {$name}";
        }
        $colorBits = [];
        foreach (array_slice($byColor, 0, 8, true) as $name => $count) {
            $colorBits[] = "{$count} {$name}";
        }

        $narrative = 'You have '.count($catalog).' fashion items'
            .($parts ? ': '.implode(', ', array_slice($parts, 0, 12)) : '')
            .($colorBits ? '. Colors: '.implode(', ', $colorBits).'.' : '.');

        return [
            'total_items' => count($catalog),
            'by_body_zone' => $byZone,
            'by_category' => $byCategory,
            'by_color' => $byColor,
            'by_visibility_role' => $byRole,
            'narrative' => $narrative,
        ];
    }

    /**
     * @return list<array{name: string, brand: ?string, url: string}>
     */
    private function preferredStoresFor(User $user): array
    {
        $raw = $user->fashion_stores;
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }
            $name = trim((string) ($row['name'] ?? ''));
            $url = trim((string) ($row['url'] ?? ''));
            if ($name === '' || $url === '') {
                continue;
            }
            $out[] = [
                'name' => $name,
                'brand' => isset($row['brand']) && trim((string) $row['brand']) !== ''
                    ? trim((string) $row['brand'])
                    : null,
                'url' => $url,
            ];
        }

        return array_slice($out, 0, 30);
    }

    /**
     * @param  list<array<string, mixed>>  $catalog
     * @param  array<string, mixed>  $summary
     * @param  list<array{name: string, brand: ?string, url: string}>  $preferredStores
     * @param  array{id: int, name: ?string, gender: ?string}  $persona
     * @return array<string, mixed>
     */
    private function callOpenAi(
        array $catalog,
        array $summary,
        array $preferredStores,
        ?string $occasion,
        ?string $notes,
        int $userId,
        int $entityId,
        array $persona = [],
    ): array {
        $userMsg = [
            'persona' => $persona,
            'occasion' => $occasion,
            'occasion_context' => [
                'type' => $occasion,
                'subtype' => null,
                'setting' => null,
                'time_of_day' => null,
                'formality' => null,
                'desired_impression' => [],
                'constraints' => [],
            ],
            'notes' => $notes,
            'wardrobe_summary' => $summary,
            'preferred_stores' => $preferredStores,
            'catalog' => $catalog,
            'ask' => [
                'estimate_coherent_wearable_outfits_from_owned_items',
                'propose_2_to_3_COMPLETE_outfits_only_dress_plus_shoes_OR_top_plus_bottom_plus_shoes',
                'never_propose_shoes_alone_or_single_garment_as_an_outfit',
                'every_garment_named_in_rationale_must_appear_as_a_catalog_id_in_the_outfit',
                'identify_meaningful_wardrobe_needs_only_when_gaps_exist',
            ],
        ];

        if ($this->settings->usesAgent()) {
            return $this->callOpenAiAgent(
                userMsg: $userMsg,
                occasion: $occasion,
                notes: $notes,
                userId: $userId,
                entityId: $entityId,
                catalogCount: count($catalog),
            );
        }

        return $this->callOpenAiChat(
            userMsg: $userMsg,
            occasion: $occasion,
            notes: $notes,
            userId: $userId,
            entityId: $entityId,
            catalogCount: count($catalog),
        );
    }

    /**
     * Chat Completions — system prompt lives in Backend Settings.
     *
     * @param  array<string, mixed>  $userMsg
     * @return array<string, mixed>
     */
    private function callOpenAiChat(
        array $userMsg,
        ?string $occasion,
        ?string $notes,
        int $userId,
        int $entityId,
        int $catalogCount,
    ): array {
        $apiKey = $this->settings->getApiKey();
        $model = $this->settings->getModel();
        $baseUrl = $this->settings->getBaseUrl();
        $system = $this->settings->getSystemPrompt();
        $userContent = json_encode($userMsg, JSON_UNESCAPED_UNICODE);
        $messages = [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $userContent],
        ];
        $responseFormat = FashionStylistResponseSchema::chatResponseFormat();
        $requestBody = [
            'model' => $model,
            'temperature' => 0.7,
            'response_format' => $responseFormat,
            'messages' => $messages,
        ];
        $started = microtime(true);
        $host = parse_url($baseUrl, PHP_URL_HOST) ?: $baseUrl;
        $logRequest = [
            'invocation_mode' => 'chat',
            'messages' => $messages,
            'temperature' => 0.7,
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => FashionStylistResponseSchema::NAME,
                    'strict' => true,
                ],
            ],
        ];

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(90)
                ->post($baseUrl.'/chat/completions', $requestBody)
                ->throw();
        } catch (RequestException $e) {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => $catalogCount,
                'http_status' => $e->response?->status(),
                'request' => $logRequest,
                'response' => null,
                'error' => $e->response?->body() ?: $e->getMessage(),
            ]);
            Log::warning('Fashion AI OpenAI chat request failed', [
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
            ]);
            throw new RuntimeException('OpenAI request failed. Check the API key and model in Backend Settings.');
        }

        $json = $response->json();
        $content = data_get($json, 'choices.0.message.content');

        return $this->parseAndLogOpenAiJson(
            content: is_string($content) ? $content : null,
            json: is_array($json) ? $json : [],
            model: $model,
            host: (string) $host,
            started: $started,
            entityId: $entityId,
            userId: $userId,
            occasion: $occasion,
            notes: $notes,
            catalogCount: $catalogCount,
            httpStatus: $response->status(),
            logRequest: $logRequest,
        );
    }

    /**
     * Responses API — logic lives in an OpenAI Prompt/Agent (pmpt_…).
     * App only sends Prim wardrobe + occasion payload.
     *
     * @param  array<string, mixed>  $userMsg
     * @return array<string, mixed>
     */
    private function callOpenAiAgent(
        array $userMsg,
        ?string $occasion,
        ?string $notes,
        int $userId,
        int $entityId,
        int $catalogCount,
    ): array {
        $apiKey = $this->settings->getApiKey();
        $model = $this->settings->getModel();
        $baseUrl = $this->settings->getBaseUrl();
        $agentId = $this->settings->getAgentId();
        if ($agentId === null || $agentId === '') {
            throw new RuntimeException('Fashion AI agent mode requires an OpenAI Prompt/Agent ID in Backend Settings.');
        }

        $userContent = json_encode($userMsg, JSON_UNESCAPED_UNICODE);
        $textFormat = FashionStylistResponseSchema::responsesTextFormat();
        $requestBody = [
            'prompt' => ['id' => $agentId],
            'input' => [
                [
                    'role' => 'user',
                    'content' => $userContent,
                ],
            ],
            'text' => [
                'format' => $textFormat,
            ],
            'store' => false,
        ];
        // Model is optional when the Prompt already pins one; send as fallback.
        if ($model !== '') {
            $requestBody['model'] = $model;
        }

        $started = microtime(true);
        $host = parse_url($baseUrl, PHP_URL_HOST) ?: $baseUrl;
        $logRequest = [
            'invocation_mode' => 'agent',
            'agent_id' => $agentId,
            'input' => $requestBody['input'],
            'text' => [
                'format' => [
                    'type' => 'json_schema',
                    'name' => FashionStylistResponseSchema::NAME,
                    'strict' => true,
                ],
            ],
            'model' => $model,
        ];

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(120)
                ->post($baseUrl.'/responses', $requestBody)
                ->throw();
        } catch (RequestException $e) {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => $catalogCount,
                'http_status' => $e->response?->status(),
                'request' => $logRequest,
                'response' => null,
                'error' => $e->response?->body() ?: $e->getMessage(),
            ]);
            Log::warning('Fashion AI OpenAI agent request failed', [
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
                'agent_id' => $agentId,
            ]);
            throw new RuntimeException('OpenAI agent request failed. Check the Prompt/Agent ID and API key in Backend Settings.');
        }

        $json = $response->json();
        $content = $this->extractResponsesOutputText(is_array($json) ? $json : []);

        return $this->parseAndLogOpenAiJson(
            content: $content,
            json: is_array($json) ? $json : [],
            model: (string) (data_get($json, 'model') ?: $model),
            host: (string) $host,
            started: $started,
            entityId: $entityId,
            userId: $userId,
            occasion: $occasion,
            notes: $notes,
            catalogCount: $catalogCount,
            httpStatus: $response->status(),
            logRequest: $logRequest,
        );
    }

    /**
     * @param  array<string, mixed>  $json
     */
    private function extractResponsesOutputText(array $json): ?string
    {
        $direct = data_get($json, 'output_text');
        if (is_string($direct) && trim($direct) !== '') {
            return $direct;
        }

        $chunks = [];
        foreach ($json['output'] ?? [] as $item) {
            if (! is_array($item)) {
                continue;
            }
            if (($item['type'] ?? '') !== 'message') {
                continue;
            }
            foreach ($item['content'] ?? [] as $part) {
                if (! is_array($part)) {
                    continue;
                }
                $type = (string) ($part['type'] ?? '');
                if (in_array($type, ['output_text', 'text'], true) && isset($part['text']) && is_string($part['text'])) {
                    $chunks[] = $part['text'];
                }
            }
        }

        if (! $chunks) {
            return null;
        }

        return implode("\n", $chunks);
    }

    /**
     * @param  array<string, mixed>  $json
     * @param  array<string, mixed>  $logRequest
     * @return array<string, mixed>
     */
    private function parseAndLogOpenAiJson(
        ?string $content,
        array $json,
        string $model,
        string $host,
        float $started,
        int $entityId,
        int $userId,
        ?string $occasion,
        ?string $notes,
        int $catalogCount,
        int $httpStatus,
        array $logRequest,
    ): array {
        $durationMs = (int) round((microtime(true) - $started) * 1000);

        if (! is_string($content) || trim($content) === '') {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => $durationMs,
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => $catalogCount,
                'http_status' => $httpStatus,
                'request' => $logRequest,
                'response' => [
                    'raw' => $json,
                    'content' => $content,
                ],
                'usage' => data_get($json, 'usage'),
                'error' => 'OpenAI returned an empty response.',
            ]);
            throw new RuntimeException('OpenAI returned an empty response.');
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded)) {
            // Agents sometimes wrap JSON in markdown fences.
            if (preg_match('/\{.*\}/s', $content, $m)) {
                $decoded = json_decode($m[0], true);
            }
        }
        if (! is_array($decoded)) {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => $durationMs,
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => $catalogCount,
                'http_status' => $httpStatus,
                'request' => $logRequest,
                'response' => [
                    'content' => $content,
                ],
                'usage' => data_get($json, 'usage'),
                'error' => 'OpenAI returned invalid JSON.',
            ]);
            throw new RuntimeException('OpenAI returned invalid JSON.');
        }

        $this->logger->record([
            'status' => 'ok',
            'model' => $model,
            'base_url_host' => $host,
            'duration_ms' => $durationMs,
            'entity_id' => $entityId,
            'user_id' => $userId,
            'occasion' => $occasion,
            'notes' => $notes,
            'catalog_count' => $catalogCount,
            'http_status' => $httpStatus,
            'request' => $logRequest,
            'response' => [
                'content' => $content,
                'parsed' => $decoded,
            ],
            'usage' => data_get($json, 'usage'),
            'error' => null,
        ]);

        return $decoded;
    }
}
