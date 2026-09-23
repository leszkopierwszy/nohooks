<?php

namespace App\Services\Wardrobe;

use App\Support\GarmentAttributes;
use Illuminate\Support\Collection;

/**
 * Deterministic outfit completeness + capped enumeration.
 *
 * Color / formality / season compatibility beyond slot rules are TODO hooks —
 * never invent owned items or inflate counts with naive products.
 */
class OutfitCompatibilityService
{
    public const MAX_OUTFITS = 80;

    /**
     * @param  list<array<string, mixed>>|Collection  $items
     */
    public function isComplete(array|Collection $items): bool
    {
        $rows = $this->normalizeItems($items);

        return GarmentAttributes::isCompleteOutfit($rows);
    }

    /**
     * @param  Collection|list<array<string, mixed>>  $items
     * @param  array{occasion?: ?string, season?: ?string, style?: ?string, limit?: int}  $filters
     * @return list<array{item_ids: list<int>, score?: float, occasion?: list<string>}>
     */
    public function enumerateCompleteOutfits(Collection|array $items, array $filters = []): array
    {
        $limit = max(1, min(self::MAX_OUTFITS, (int) ($filters['limit'] ?? self::MAX_OUTFITS)));
        $rows = $this->normalizeItems($items);
        $rows = $this->applySoftFilters($rows, $filters);

        $bySlot = [
            'one_piece' => [],
            'top' => [],
            'bottom' => [],
            'footwear' => [],
            'outerwear' => [],
            'other' => [],
        ];

        foreach ($rows as $row) {
            $slot = $row['outfit_slot'];
            if (! isset($bySlot[$slot])) {
                $bySlot[$slot] = [];
            }
            $bySlot[$slot][] = $row;
        }

        $outfits = [];

        // Path A: one_piece + footwear (+ optional outerwear)
        foreach ($bySlot['one_piece'] as $dress) {
            foreach ($bySlot['footwear'] as $shoes) {
                $ids = [(int) $dress['id'], (int) $shoes['id']];
                $combo = $this->withOptionalOuterwear($ids, $bySlot['outerwear']);
                foreach ($combo as $itemIds) {
                    $outfits[] = $this->combination($itemIds, $filters['occasion'] ?? null);
                    if (count($outfits) >= $limit) {
                        return $outfits;
                    }
                }
            }
        }

        // Path B: top + bottom + footwear (+ optional outerwear)
        foreach ($bySlot['top'] as $top) {
            foreach ($bySlot['bottom'] as $bottom) {
                foreach ($bySlot['footwear'] as $shoes) {
                    $ids = [(int) $top['id'], (int) $bottom['id'], (int) $shoes['id']];
                    $combo = $this->withOptionalOuterwear($ids, $bySlot['outerwear']);
                    foreach ($combo as $itemIds) {
                        $outfits[] = $this->combination($itemIds, $filters['occasion'] ?? null);
                        if (count($outfits) >= $limit) {
                            return $outfits;
                        }
                    }
                }
            }
        }

        return $outfits;
    }

    /**
     * @param  Collection|list<array<string, mixed>>  $items
     * @param  array{occasion?: ?string, season?: ?string, style?: ?string, limit?: int}  $filters
     * @return array{
     *   item_count: int,
     *   outfit_count: int,
     *   truncated: bool,
     *   outfits: list<array{item_ids: list<int>, score?: float, occasion?: list<string>}>,
     *   by_occasion: array<string, int>
     * }
     */
    public function analyzeBaseWardrobe(Collection|array $items, array $filters = []): array
    {
        $rows = $this->normalizeItems($items);
        $limit = max(1, min(self::MAX_OUTFITS, (int) ($filters['limit'] ?? self::MAX_OUTFITS)));
        $outfits = $this->enumerateCompleteOutfits($rows, array_merge($filters, ['limit' => $limit]));

        $byOccasion = [];
        $occasion = $filters['occasion'] ?? null;
        if ($occasion) {
            $byOccasion[$occasion] = count($outfits);
        } else {
            // Soft breakdown: same set attributed to casual by default when no occasion filter.
            // Real occasion scoring is a TODO once item formality exists.
            $byOccasion['casual'] = count($outfits);
        }

        return [
            'item_count' => count($rows),
            'outfit_count' => count($outfits),
            'truncated' => count($outfits) >= $limit,
            'outfits' => $outfits,
            'by_occasion' => $byOccasion,
        ];
    }

    /**
     * @param  list<int>  $baseIds
     * @param  list<array<string, mixed>>  $outerwear
     * @return list<list<int>>
     */
    private function withOptionalOuterwear(array $baseIds, array $outerwear): array
    {
        $variants = [$baseIds];
        // At most one outerwear layer sample to avoid explosion.
        foreach (array_slice($outerwear, 0, 3) as $layer) {
            $variants[] = array_values(array_unique([...$baseIds, (int) $layer['id']]));
        }

        return $variants;
    }

    /**
     * @param  list<int>  $itemIds
     * @return array{item_ids: list<int>, score: float, occasion?: list<string>}
     */
    private function combination(array $itemIds, ?string $occasion): array
    {
        sort($itemIds);
        $row = [
            'item_ids' => array_values($itemIds),
            // Placeholder score until color/formality engine exists.
            'score' => 1.0,
        ];
        if ($occasion) {
            $row['occasion'] = [$occasion];
        }

        return $row;
    }

    /**
     * @param  Collection|list<array<string, mixed>>|\Illuminate\Database\Eloquent\Model  $items
     * @return list<array<string, mixed>>
     */
    private function normalizeItems(Collection|array $items): array
    {
        $list = $items instanceof Collection ? $items->all() : $items;
        $out = [];

        foreach ($list as $item) {
            if (is_object($item)) {
                $collection = null;
                if (method_exists($item, 'relationLoaded') && $item->relationLoaded('collectionGroup')) {
                    $collection = $item->collectionGroup?->name;
                }
                $row = [
                    'id' => (int) $item->id,
                    'category' => $item->category ?? null,
                    'body_zone' => $item->body_zone ?? null,
                    'name' => $item->name ?? null,
                    'collection' => $collection,
                    'season' => $item->season ?? null,
                    'color' => $item->color ?? null,
                ];
            } elseif (is_array($item)) {
                $row = $item;
                $row['id'] = (int) ($row['id'] ?? 0);
            } else {
                continue;
            }

            if ($row['id'] <= 0) {
                continue;
            }

            $row['outfit_slot'] = GarmentAttributes::outfitSlot(
                $row['category'] ?? null,
                $row['body_zone'] ?? null,
                $row['name'] ?? null,
                $row['collection'] ?? null,
            );
            $out[] = $row;
        }

        return $out;
    }

    /**
     * Soft filters — season string match only for now.
     * TODO: formality, style, color harmony.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function applySoftFilters(array $rows, array $filters): array
    {
        $season = isset($filters['season']) ? strtolower(trim((string) $filters['season'])) : '';
        if ($season === '') {
            return $rows;
        }

        return array_values(array_filter($rows, function (array $row) use ($season) {
            $itemSeason = strtolower(trim((string) ($row['season'] ?? '')));
            if ($itemSeason === '' || $itemSeason === 'all' || $itemSeason === 'year-round') {
                return true;
            }

            return str_contains($itemSeason, $season) || str_contains($season, $itemSeason);
        }));
    }
}
