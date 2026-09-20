<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Capsule;
use App\Models\Item;
use App\Services\Wardrobe\CapsuleBuilderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CapsuleController extends Controller
{
    public function __construct(
        private readonly CapsuleBuilderService $builder,
    ) {
    }

    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'entity_id' => [
                $required,
                'integer',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', auth()->id())),
            ],
            'name' => "{$required}|string|max:120",
            'preset' => ['nullable', 'string', Rule::in(Capsule::PRESETS)],
            'occasion' => ['nullable', 'string', 'max:32'],
            'season' => ['nullable', 'string', 'max:32'],
            'style' => ['nullable', 'string', 'max:64'],
            'target_outfit_count' => ['nullable', 'integer', 'min:1', 'max:60'],
            'item_limit' => ['nullable', 'integer', 'min:3', 'max:40'],
            'item_ids' => ['nullable', 'array'],
            'item_ids.*' => ['integer'],
        ];
    }

    private function syncItems(Capsule $capsule, ?array $itemIds): void
    {
        if ($itemIds === null) {
            return;
        }

        $orderedIds = [];
        foreach ($itemIds as $id) {
            $id = (int) $id;
            if ($id > 0 && ! in_array($id, $orderedIds, true)) {
                $orderedIds[] = $id;
            }
        }

        if ($orderedIds !== []) {
            $ownedCount = Item::query()
                ->where('user_id', auth()->id())
                ->whereIn('id', $orderedIds)
                ->count();
            if ($ownedCount !== count($orderedIds)) {
                throw ValidationException::withMessages([
                    'item_ids' => ['One or more items were not found.'],
                ]);
            }
        }

        $sync = [];
        foreach ($orderedIds as $index => $itemId) {
            $sync[$itemId] = ['sort_order' => $index];
        }
        $capsule->items()->sync($sync);
    }

    private function loadCapsule(Capsule $capsule): Capsule
    {
        return $capsule->load([
            'entity:id,name,type',
            'items' => fn ($q) => $q->with(['images', 'collectionGroup']),
        ]);
    }

    private function fashionItemsForUser(?int $entityId = null)
    {
        $query = Item::query()->with(['images', 'collectionGroup']);
        if ($entityId) {
            $query->fitsPersona($entityId);
        }

        return $query->get()->filter(function (Item $item) {
            $collection = strtolower((string) ($item->collectionGroup?->name ?? ''));
            if (preg_match('/electron|gadget|tech|book|ksi/', $collection)) {
                return false;
            }
            // Prefer clothing/shoes/accessories collections; include uncategorized fashion-ish categories.
            if ($collection !== '' && preg_match('/cloth|ubrania|shoe|buty|accessor|akcesor|wardrobe|szafa/', $collection)) {
                return true;
            }
            $slot = \App\Support\GarmentAttributes::outfitSlot(
                $item->category,
                $item->body_zone,
                $item->name,
                $item->collectionGroup?->name,
            );

            return in_array($slot, ['one_piece', 'top', 'bottom', 'footwear', 'outerwear'], true);
        })->values();
    }

    public function index(Request $request)
    {
        $request->validate([
            'entity_id' => 'nullable|integer',
        ]);

        $query = Capsule::query()
            ->with([
                'entity:id,name,type',
                'items' => fn ($q) => $q->with(['images', 'collectionGroup']),
            ])
            ->orderByDesc('id');

        if ($request->filled('entity_id')) {
            $query->where('entity_id', (int) $request->input('entity_id'));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $itemIds = $data['item_ids'] ?? null;
        unset($data['item_ids']);
        $data['preset'] = $data['preset'] ?? 'custom';

        $capsule = DB::transaction(function () use ($data, $itemIds) {
            $capsule = Capsule::create($data);
            if ($itemIds === null) {
                $analysis = $this->builder->analyze(
                    $this->fashionItemsForUser((int) $data['entity_id']),
                    [
                        'preset' => $data['preset'],
                        'occasion' => $data['occasion'] ?? null,
                        'season' => $data['season'] ?? null,
                        'style' => $data['style'] ?? null,
                        'target_outfit_count' => $data['target_outfit_count'] ?? null,
                        'item_limit' => $data['item_limit'] ?? null,
                        'entity_id' => (int) $data['entity_id'],
                    ]
                );
                $itemIds = $analysis['item_ids'];
            }
            $this->syncItems($capsule, $itemIds);

            return $capsule;
        });

        return response()->json($this->loadCapsule($capsule->fresh()), 201);
    }

    public function show(Capsule $capsule)
    {
        return $this->loadCapsule($capsule);
    }

    public function update(Request $request, Capsule $capsule)
    {
        $data = $request->validate($this->rules(partial: true));
        $itemIds = array_key_exists('item_ids', $data) ? $data['item_ids'] : null;
        unset($data['item_ids']);

        DB::transaction(function () use ($capsule, $data, $itemIds) {
            if ($data !== []) {
                $capsule->update($data);
            }
            $this->syncItems($capsule, $itemIds);
        });

        return $this->loadCapsule($capsule->fresh());
    }

    public function destroy(Capsule $capsule)
    {
        $capsule->delete();

        return response()->json(null, 204);
    }

    /**
     * Analyze without saving.
     */
    public function analyze(Request $request)
    {
        $data = $request->validate([
            'entity_id' => [
                'required',
                'integer',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', auth()->id())),
            ],
            'preset' => ['nullable', 'string', Rule::in(Capsule::PRESETS)],
            'occasion' => ['nullable', 'string', 'max:32'],
            'season' => ['nullable', 'string', 'max:32'],
            'style' => ['nullable', 'string', 'max:64'],
            'target_outfit_count' => ['nullable', 'integer', 'min:1', 'max:60'],
            'item_limit' => ['nullable', 'integer', 'min:3', 'max:40'],
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        $analysis = $this->builder->analyze(
            $this->fashionItemsForUser((int) $data['entity_id']),
            [
                'preset' => $data['preset'] ?? 'custom',
                'occasion' => $data['occasion'] ?? null,
                'season' => $data['season'] ?? null,
                'style' => $data['style'] ?? null,
                'target_outfit_count' => $data['target_outfit_count'] ?? null,
                'item_limit' => $data['item_limit'] ?? null,
                'entity_id' => (int) $data['entity_id'],
            ]
        );

        $items = Item::query()
            ->with(['images', 'collectionGroup'])
            ->whereIn('id', $analysis['item_ids'])
            ->get();

        return response()->json([
            ...$analysis,
            'items' => $items,
            'name' => $data['name'] ?? null,
        ]);
    }

    public function analyzeSaved(Capsule $capsule)
    {
        $analysis = $this->builder->analyze(
            $this->fashionItemsForUser((int) $capsule->entity_id),
            [
                'preset' => $capsule->preset,
                'occasion' => $capsule->occasion,
                'season' => $capsule->season,
                'style' => $capsule->style,
                'target_outfit_count' => $capsule->target_outfit_count,
                'item_limit' => $capsule->item_limit,
                'entity_id' => (int) $capsule->entity_id,
            ]
        );

        return response()->json([
            ...$analysis,
            'capsule' => $this->loadCapsule($capsule),
        ]);
    }
}
