<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entity;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EntityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        return Entity::with('characters')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|in:persona,animal',
            'gender' => 'nullable|string|max:32',
            'species' => 'required_if:type,animal|nullable|string|max:64',
            'birth_date' => 'nullable|date',
            'sex' => 'nullable|string|in:female,male,unknown',
        ]);

        if (! isset($data['type'])) {
            $data['type'] = 'persona';
        }

        if ($data['type'] !== 'animal') {
            unset($data['species'], $data['birth_date'], $data['sex']);
        }

        $entity = Entity::create($data);

        return response()->json($entity, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Entity $entity)
    {
        $entity->load([
            'characters',
            'bodySnapshots' => fn ($q) => $q->orderByDesc('recorded_at')->orderByDesc('id'),
        ]);

        // Nie używamy hasMany przez entity_id — lista wg dopasowania (fits_all_personas itd.)
        $entity->setRelation(
            'items',
            Item::query()
                ->with(['images', 'collectionGroup', 'defaultPersona'])
                ->fitsPersona((int) $entity->id)
                ->latest()
                ->get()
        );

        return $entity;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Entity $entity)
    {
        //
        $rules = [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'gender' => 'nullable|string|max:32',
            'species' => 'nullable|string|max:64',
            'birth_date' => 'nullable|date',
            'sex' => 'nullable|string|in:female,male,unknown',
        ];

        if ($entity->type === 'animal') {
            $rules['species'] = 'sometimes|required|string|max:64';
        }

        $data = $request->validate($rules);

        $entity->update($data);

        return $entity;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Entity $entity)
    {
        //
        $entity->delete();

        return response()->json(null, 204);
    }
}
