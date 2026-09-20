<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Outfit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OutfitController extends Controller
{
    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'entity_id' => [
                $required,
                'integer',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', auth()->id())),
            ],
            'wear_date' => "{$required}|date",
            'label' => 'nullable|string|max:255',
            'occasion' => ['nullable', 'string', Rule::in(Outfit::OCCASIONS)],
            'notes' => 'nullable|string|max:5000',
            'source' => ['nullable', 'string', Rule::in(Outfit::SOURCES)],
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'integer',
        ];
    }

    private function normalizeInput(array $data): array
    {
        if (array_key_exists('label', $data)) {
            $label = is_string($data['label']) ? trim($data['label']) : $data['label'];
            $data['label'] = $label !== '' ? $label : null;
        }

        if (array_key_exists('notes', $data)) {
            $notes = is_string($data['notes']) ? trim($data['notes']) : $data['notes'];
            $data['notes'] = $notes !== '' ? $notes : null;
        }

        if (array_key_exists('occasion', $data)) {
            $data['occasion'] = Outfit::normalizeOccasion($data['occasion'] ?? null);
        }

        if (empty($data['source'])) {
            $data['source'] = 'manual';
        }

        return $data;
    }

    private function prepareOccasionInput(Request $request): void
    {
        if (! $request->has('occasion')) {
            return;
        }

        $request->merge([
            'occasion' => Outfit::normalizeOccasion($request->input('occasion')),
        ]);
    }

    private function syncItems(Outfit $outfit, ?array $itemIds): void
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

        $outfit->items()->sync($sync);
    }

    private function loadOutfit(Outfit $outfit): Outfit
    {
        return $outfit->load([
            'entity:id,name,type,avatar_doll_url,avatar_source_url',
            'items' => fn ($q) => $q->with(['images', 'collectionGroup']),
        ]);
    }

    public function index(Request $request)
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'entity_id' => 'nullable|integer',
            'occasion' => ['nullable', 'string', Rule::in(Outfit::OCCASIONS)],
        ]);

        $query = Outfit::query()
            ->with([
                'entity:id,name,type,avatar_doll_url,avatar_source_url',
                'items' => fn ($q) => $q->with(['images', 'collectionGroup']),
            ])
            ->orderBy('wear_date')
            ->orderBy('id');

        if ($request->filled('entity_id')) {
            $query->where('entity_id', (int) $request->input('entity_id'));
        }

        if ($request->filled('occasion')) {
            $query->where('occasion', $request->input('occasion'));
        }

        if ($request->filled('from')) {
            $query->whereDate('wear_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('wear_date', '<=', $request->input('to'));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $this->prepareOccasionInput($request);
        $data = $this->normalizeInput($request->validate($this->rules()));
        $itemIds = $data['item_ids'] ?? [];
        unset($data['item_ids']);

        $created = false;

        $outfit = DB::transaction(function () use ($data, $itemIds, &$created) {
            $existing = Outfit::query()
                ->where('entity_id', $data['entity_id'])
                ->whereDate('wear_date', $data['wear_date'])
                ->first();

            if ($existing) {
                $existing->update($data);
                $this->syncItems($existing, $itemIds);

                return $existing;
            }

            $created = true;
            $outfit = Outfit::create($data);
            $this->syncItems($outfit, $itemIds);

            return $outfit;
        });

        return response()->json($this->loadOutfit($outfit->fresh()), $created ? 201 : 200);
    }

    public function show(Outfit $outfit)
    {
        return $this->loadOutfit($outfit);
    }

    public function update(Request $request, Outfit $outfit)
    {
        $this->prepareOccasionInput($request);
        $data = $this->normalizeInput($request->validate($this->rules(partial: true)));
        $itemIds = array_key_exists('item_ids', $data) ? $data['item_ids'] : null;
        unset($data['item_ids']);

        DB::transaction(function () use ($outfit, $data, $itemIds) {
            if ($data !== []) {
                $conflict = null;
                $entityId = $data['entity_id'] ?? $outfit->entity_id;
                $wearDate = $data['wear_date'] ?? $outfit->wear_date?->format('Y-m-d');

                if (
                    (array_key_exists('entity_id', $data) || array_key_exists('wear_date', $data))
                    && ($entityId != $outfit->entity_id || $wearDate !== $outfit->wear_date?->format('Y-m-d'))
                ) {
                    $conflict = Outfit::query()
                        ->where('entity_id', $entityId)
                        ->whereDate('wear_date', $wearDate)
                        ->where('id', '!=', $outfit->id)
                        ->exists();
                }

                if ($conflict) {
                    throw ValidationException::withMessages([
                        'wear_date' => ['An outfit for this Prim on this date already exists.'],
                    ]);
                }

                $outfit->update($data);
            }

            $this->syncItems($outfit, $itemIds);
        });

        return $this->loadOutfit($outfit->fresh());
    }

    public function destroy(Outfit $outfit)
    {
        $outfit->delete();

        return response()->json(null, 204);
    }
}
