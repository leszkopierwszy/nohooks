<?php

namespace App\Services\Style;

use App\Models\Item;
use App\Support\GarmentAttributes;
use Illuminate\Support\Collection;

/**
 * Evaluates auto style-module requirements against a Prim's wardrobe.
 *
 * requirements shape:
 * { "all": [ { "slot": "footwear", "min": 1 }, { "category": "jeans", "min": 1, "colors": ["white"] } ] }
 */
class StyleModuleEvaluator
{
    /**
     * @param  Collection<int, Item>|list<Item>  $items
     * @param  array<string, mixed>|null  $requirements
     * @return array{met: bool, missing: list<array<string, mixed>>, details: list<array<string, mixed>>}
     */
    public function evaluate(Collection|array $items, ?array $requirements): array
    {
        $rows = $items instanceof Collection ? $items : collect($items);
        $conditions = $requirements['all'] ?? [];
        if (! is_array($conditions) || $conditions === []) {
            return ['met' => true, 'missing' => [], 'details' => []];
        }

        $details = [];
        $missing = [];

        foreach ($conditions as $index => $condition) {
            if (! is_array($condition)) {
                continue;
            }
            $result = $this->evaluateCondition($rows, $condition);
            $details[] = array_merge(['index' => $index], $result);
            if (! $result['ok']) {
                $missing[] = array_merge(['index' => $index], $condition, [
                    'have' => $result['count'],
                    'need' => $result['min'],
                ]);
            }
        }

        return [
            'met' => $missing === [],
            'missing' => $missing,
            'details' => $details,
        ];
    }

    /**
     * @param  Collection<int, Item>  $items
     * @param  array<string, mixed>  $condition
     * @return array{ok: bool, count: int, min: int}
     */
    private function evaluateCondition(Collection $items, array $condition): array
    {
        $min = max(1, (int) ($condition['min'] ?? 1));
        $slot = isset($condition['slot']) ? strtolower(trim((string) $condition['slot'])) : null;
        $category = isset($condition['category']) ? strtolower(trim((string) $condition['category'])) : null;
        $colors = [];
        if (! empty($condition['colors']) && is_array($condition['colors'])) {
            $colors = array_values(array_filter(array_map(
                static fn ($c) => strtolower(trim((string) $c)),
                $condition['colors'],
            )));
        }

        $matched = $items->filter(function (Item $item) use ($slot, $category, $colors) {
            if ($slot) {
                $itemSlot = GarmentAttributes::outfitSlot(
                    $item->category,
                    $item->body_zone,
                    $item->name,
                    $item->collectionGroup?->name,
                );
                if ($itemSlot !== $slot) {
                    return false;
                }
            }

            if ($category) {
                $cat = strtolower(trim((string) ($item->category ?? '')));
                $name = strtolower(trim((string) ($item->name ?? '')));
                if ($cat !== $category && ! str_contains($cat, $category) && ! str_contains($name, $category)) {
                    return false;
                }
            }

            if ($colors !== []) {
                $itemColors = array_map('strtolower', array_filter(array_map(
                    'strval',
                    is_array($item->colors) ? $item->colors : [],
                )));
                if ($item->color) {
                    $itemColors[] = strtolower((string) $item->color);
                }
                $itemColors = array_values(array_unique($itemColors));
                $hit = false;
                foreach ($colors as $want) {
                    foreach ($itemColors as $have) {
                        if ($have === $want || str_contains($have, $want)) {
                            $hit = true;
                            break 2;
                        }
                    }
                }
                if (! $hit) {
                    return false;
                }
            }

            return true;
        });

        $count = $matched->count();

        return [
            'ok' => $count >= $min,
            'count' => $count,
            'min' => $min,
        ];
    }

    /**
     * Manual checklist: all defined check ids must be present in $doneIds.
     *
     * @param  array<string, mixed>|null  $requirements
     * @param  list<string>  $doneIds
     */
    public function evaluateManual(?array $requirements, array $doneIds): array
    {
        $checks = $requirements['checks'] ?? [];
        if (! is_array($checks) || $checks === []) {
            return ['met' => true, 'missing' => [], 'details' => []];
        }

        $done = array_fill_keys(array_map('strval', $doneIds), true);
        $missing = [];
        $details = [];

        foreach ($checks as $check) {
            if (! is_array($check)) {
                continue;
            }
            $id = (string) ($check['id'] ?? '');
            if ($id === '') {
                continue;
            }
            $ok = isset($done[$id]);
            $details[] = ['id' => $id, 'label' => $check['label'] ?? $id, 'ok' => $ok];
            if (! $ok) {
                $missing[] = ['id' => $id, 'label' => $check['label'] ?? $id];
            }
        }

        return [
            'met' => $missing === [],
            'missing' => $missing,
            'details' => $details,
        ];
    }
}
