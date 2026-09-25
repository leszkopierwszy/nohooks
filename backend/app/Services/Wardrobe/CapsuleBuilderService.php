<?php

namespace App\Services\Wardrobe;

use App\Models\Item;
use App\Support\GarmentAttributes;
use Illuminate\Support\Collection;

/**
 * Build capsule subsets from owned wardrobe; surface missing roles (not products).
 */
class CapsuleBuilderService
{
    public function __construct(
        private readonly OutfitCompatibilityService $compatibility,
    ) {
    }

    /**
     * Required wardrobe roles per preset.
     *
     * @return array<string, list<array{role: string, slot: string, min: int, label: string}>>
     */
    public function presetRoles(): array
    {
        return [
            'work' => [
                ['role' => 'tops', 'slot' => 'top', 'min' => 2, 'label' => 'Versatile tops'],
                ['role' => 'bottoms', 'slot' => 'bottom', 'min' => 1, 'label' => 'Work bottoms'],
                ['role' => 'outerwear', 'slot' => 'outerwear', 'min' => 1, 'label' => 'Neutral blazer'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Work footwear'],
            ],
            'travel' => [
                ['role' => 'tops', 'slot' => 'top', 'min' => 2, 'label' => 'Packable tops'],
                ['role' => 'bottoms', 'slot' => 'bottom', 'min' => 1, 'label' => 'Travel bottoms'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Comfortable shoes'],
                ['role' => 'outerwear', 'slot' => 'outerwear', 'min' => 1, 'label' => 'Light layer'],
            ],
            'summer' => [
                ['role' => 'tops_or_dresses', 'slot' => 'top', 'min' => 2, 'label' => 'Summer tops'],
                ['role' => 'bottoms', 'slot' => 'bottom', 'min' => 1, 'label' => 'Summer bottoms'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Summer footwear'],
            ],
            'winter' => [
                ['role' => 'tops', 'slot' => 'top', 'min' => 2, 'label' => 'Warm tops'],
                ['role' => 'bottoms', 'slot' => 'bottom', 'min' => 1, 'label' => 'Winter bottoms'],
                ['role' => 'outerwear', 'slot' => 'outerwear', 'min' => 1, 'label' => 'Warm coat'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Winter footwear'],
            ],
            'smart_casual' => [
                ['role' => 'tops', 'slot' => 'top', 'min' => 2, 'label' => 'Smart tops'],
                ['role' => 'bottoms', 'slot' => 'bottom', 'min' => 1, 'label' => 'Smart bottoms'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Smart casual shoes'],
            ],
            'evening' => [
                ['role' => 'one_piece_or_set', 'slot' => 'one_piece', 'min' => 1, 'label' => 'Evening dress or set'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Evening footwear'],
            ],
            'custom' => [
                ['role' => 'tops', 'slot' => 'top', 'min' => 1, 'label' => 'Tops'],
                ['role' => 'bottoms', 'slot' => 'bottom', 'min' => 1, 'label' => 'Bottoms'],
                ['role' => 'footwear', 'slot' => 'footwear', 'min' => 1, 'label' => 'Footwear'],
            ],
        ];
    }

    /**
     * @param  Collection<int, Item>  $items
     * @param  array{
     *   preset?: string,
     *   occasion?: ?string,
     *   season?: ?string,
     *   style?: ?string,
     *   target_outfit_count?: ?int,
     *   item_limit?: ?int,
     *   entity_id?: ?int
     * }  $params
     * @return array<string, mixed>
     */
    public function analyze(Collection $items, array $params = []): array
    {
        $preset = $params['preset'] ?? 'custom';
        if (! isset($this->presetRoles()[$preset])) {
            $preset = 'custom';
        }

        $roles = $this->presetRoles()[$preset];
        $targetOutfits = max(1, (int) ($params['target_outfit_count'] ?? 5));
        $itemLimit = $params['item_limit'] !== null ? max(3, (int) $params['item_limit']) : 12;

        $filtered = $items->values();
        if (! empty($params['entity_id'])) {
            $entityId = (int) $params['entity_id'];
            $filtered = $filtered->filter(fn (Item $item) => $item->fitsPersona($entityId))->values();
        }

        $season = $params['season'] ?? null;
        if ($season) {
            $seasonLower = strtolower((string) $season);
            $filtered = $filtered->filter(function (Item $item) use ($seasonLower) {
                $s = strtolower(trim((string) ($item->season ?? '')));
                if ($s === '' || $s === 'all' || $s === 'year-round') {
                    return true;
                }

                return str_contains($s, $seasonLower) || str_contains($seasonLower, $s);
            })->values();
        }

        $bySlot = $this->groupBySlot($filtered);
        $selected = $this->selectCapsuleItems($bySlot, $roles, $itemLimit);
        $analysis = $this->compatibility->analyzeBaseWardrobe(
            $selected,
            [
                'occasion' => $params['occasion'] ?? null,
                'season' => $season,
                'limit' => OutfitCompatibilityService::MAX_OUTFITS,
            ]
        );

        $roleCoverage = $this->roleCoverage($bySlot, $roles);
        $missing = [];
        foreach ($roleCoverage as $row) {
            if ($row['covered'] < $row['min']) {
                $missing[] = $this->missingRoleGap(
                    $row,
                    $selected,
                    $params['occasion'] ?? null,
                    $season,
                );
            }
        }

        // Also flag if outfit potential is below target even when roles look filled.
        $complete = $missing === [] && $analysis['outfit_count'] >= min($targetOutfits, 3);
        if ($missing === [] && $analysis['outfit_count'] < min($targetOutfits, 3)) {
            $missing[] = [
                'role' => 'versatile_layer',
                'label' => 'Neutral layering piece',
                'reason' => 'Needed to raise complete-outfit potential from the clothes you already own.',
                'unlocks_outfits_estimate' => max(1, $targetOutfits - $analysis['outfit_count']),
                'estimate' => true,
            ];
            $complete = false;
        }

        $coveredCount = count(array_filter($roleCoverage, fn ($r) => $r['covered'] >= $r['min']));
        $requiredCount = count($roles);

        return [
            'status' => $complete ? 'complete' : 'incomplete',
            'preset' => $preset,
            'item_ids' => $selected->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'items_by_slot' => $this->countBySlot($selected),
            'outfit_count' => $analysis['outfit_count'],
            'truncated' => $analysis['truncated'],
            'outfits' => array_slice($analysis['outfits'], 0, 12),
            'role_coverage' => [
                'covered' => $coveredCount,
                'required' => $requiredCount,
                'roles' => $roleCoverage,
            ],
            'missing_roles' => $missing,
            'target_outfit_count' => $targetOutfits,
        ];
    }

    /**
     * @param  Collection<int, Item>  $items
     * @return array<string, Collection<int, Item>>
     */
    private function groupBySlot(Collection $items): array
    {
        $groups = [
            'one_piece' => collect(),
            'top' => collect(),
            'bottom' => collect(),
            'footwear' => collect(),
            'outerwear' => collect(),
            'other' => collect(),
        ];

        foreach ($items as $item) {
            $slot = GarmentAttributes::outfitSlot(
                $item->category,
                $item->body_zone,
                $item->name,
                $item->collectionGroup?->name,
            );
            if (! isset($groups[$slot])) {
                $groups[$slot] = collect();
            }
            $groups[$slot]->push($item);
        }

        return $groups;
    }

    /**
     * @param  array<string, Collection<int, Item>>  $bySlot
     * @param  list<array{role: string, slot: string, min: int, label: string}>  $roles
     * @return Collection<int, Item>
     */
    private function selectCapsuleItems(array $bySlot, array $roles, int $itemLimit): Collection
    {
        $picked = collect();
        $seen = [];

        foreach ($roles as $role) {
            $slot = $role['slot'];
            $need = (int) $role['min'];
            $pool = $bySlot[$slot] ?? collect();

            // Evening preset: allow tops+bottoms if no one_piece.
            if ($slot === 'one_piece' && $pool->isEmpty()) {
                foreach (['top', 'bottom'] as $alt) {
                    foreach (($bySlot[$alt] ?? collect())->take(2) as $item) {
                        if (! isset($seen[$item->id])) {
                            $seen[$item->id] = true;
                            $picked->push($item);
                        }
                    }
                }
                continue;
            }

            foreach ($pool->take($need + 1) as $item) {
                if (! isset($seen[$item->id])) {
                    $seen[$item->id] = true;
                    $picked->push($item);
                }
            }
        }

        // Fill remaining budget with extras from core slots for more combinations.
        foreach (['top', 'bottom', 'footwear', 'outerwear', 'one_piece'] as $slot) {
            if ($picked->count() >= $itemLimit) {
                break;
            }
            foreach (($bySlot[$slot] ?? collect()) as $item) {
                if ($picked->count() >= $itemLimit) {
                    break;
                }
                if (! isset($seen[$item->id])) {
                    $seen[$item->id] = true;
                    $picked->push($item);
                }
            }
        }

        return $picked->values();
    }

    /**
     * @param  array<string, Collection<int, Item>>  $bySlot
     * @param  list<array{role: string, slot: string, min: int, label: string}>  $roles
     * @return list<array{role: string, slot: string, min: int, covered: int, label: string}>
     */
    private function roleCoverage(array $bySlot, array $roles): array
    {
        $out = [];
        foreach ($roles as $role) {
            $covered = ($bySlot[$role['slot']] ?? collect())->count();
            if ($role['slot'] === 'one_piece' && $covered === 0) {
                $tops = ($bySlot['top'] ?? collect())->count();
                $bottoms = ($bySlot['bottom'] ?? collect())->count();
                $covered = min($tops, $bottoms) > 0 ? 1 : 0;
            }
            $out[] = [
                'role' => $role['role'],
                'slot' => $role['slot'],
                'min' => $role['min'],
                'covered' => $covered,
                'label' => $role['label'],
            ];
        }

        return $out;
    }

    /**
     * @param  array{role: string, slot: string, min: int, covered: int, label: string}  $role
     * @param  Collection<int, Item>  $selected
     * @return array{role: string, label: string, reason: string, unlocks_outfits_estimate: int, estimate: bool}
     */
    private function missingRoleGap(array $role, Collection $selected, ?string $occasion, ?string $season): array
    {
        $baseline = $this->compatibility->analyzeBaseWardrobe($selected, [
            'occasion' => $occasion,
            'season' => $season,
            'limit' => OutfitCompatibilityService::MAX_OUTFITS,
        ]);

        // Hypothetical filler item in the missing slot — estimate only.
        $hypothetical = $selected->values()->all();
        $hypothetical[] = [
            'id' => -1,
            'category' => match ($role['slot']) {
                'footwear' => 'shoes',
                'bottom' => 'pants',
                'top' => 'shirt',
                'outerwear' => 'blazer',
                'one_piece' => 'dress',
                default => 'top',
            },
            'body_zone' => null,
            'name' => $role['label'],
            'collection' => null,
        ];

        $withGapFilled = $this->compatibility->analyzeBaseWardrobe($hypothetical, [
            'occasion' => $occasion,
            'season' => $season,
            'limit' => OutfitCompatibilityService::MAX_OUTFITS,
        ]);

        $unlock = max(0, $withGapFilled['outfit_count'] - $baseline['outfit_count']);
        if ($unlock === 0) {
            $unlock = max(1, $role['min'] - $role['covered']);
        }

        return [
            'role' => $role['role'],
            'label' => $role['label'],
            'reason' => sprintf(
                'Needed as a %s to complete more outfits using clothes you already own.',
                strtolower($role['label'])
            ),
            'unlocks_outfits_estimate' => $unlock,
            'estimate' => true,
        ];
    }

    /**
     * @param  Collection<int, Item>  $items
     * @return array<string, int>
     */
    private function countBySlot(Collection $items): array
    {
        $counts = [];
        foreach ($items as $item) {
            $slot = GarmentAttributes::outfitSlot(
                $item->category,
                $item->body_zone,
                $item->name,
                $item->collectionGroup?->name,
            );
            $counts[$slot] = ($counts[$slot] ?? 0) + 1;
        }

        return $counts;
    }
}
