<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entity;
use App\Models\EntityBodySnapshot;
use App\Services\PersonaVision\PersonaBodyPromptFormatter;
use Illuminate\Http\Request;

class EntityBodySnapshotController extends Controller
{
    private function validateSnapshot(Request $request): array
    {
        $data = $request->validate([
            'recorded_at' => 'required|date',
            'height_cm' => 'nullable|numeric|min:0|max:300',
            'weight_kg' => 'nullable|numeric|min:0|max:500',
            'skin_tone' => 'nullable|string|max:64',
            'chest_cm' => 'nullable|numeric|min:0|max:300',
            'waist_cm' => 'nullable|numeric|min:0|max:300',
            'hips_cm' => 'nullable|numeric|min:0|max:300',
            'shoulder_cm' => 'nullable|numeric|min:0|max:300',
            'inseam_cm' => 'nullable|numeric|min:0|max:200',
            'custom_measurements' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        foreach (['height_cm', 'weight_kg', 'chest_cm', 'waist_cm', 'hips_cm', 'shoulder_cm', 'inseam_cm'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null) {
                $data[$field] = (float) $data[$field];
            }
        }

        if (isset($data['skin_tone']) && $data['skin_tone'] === '') {
            $data['skin_tone'] = null;
        }

        if (empty($data['custom_measurements'])) {
            $data['custom_measurements'] = null;
        }

        return $data;
    }

    public function index(Entity $entity)
    {
        return $entity->bodySnapshots()
            ->orderByDesc('recorded_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Blok tekstu do wklejenia w ComfyUI (workflow „Persona Turnaround Sheet”).
     * Tymczasowa integracja — pozniej automatyczne wstrzykiwanie przez API.
     */
    public function promptSnippet(Entity $entity, PersonaBodyPromptFormatter $formatter)
    {
        $snapshot = $entity->bodySnapshots()->first();

        return response()->json([
            'entity_id' => $entity->id,
            'snapshot_id' => $snapshot?->id,
            'recorded_at' => $snapshot?->recorded_at,
            'prompt_snippet' => $formatter->format($snapshot),
        ]);
    }

    public function store(Request $request, Entity $entity)
    {
        $snapshot = $entity->bodySnapshots()->create($this->validateSnapshot($request));

        return response()->json($snapshot, 201);
    }

    public function update(Request $request, Entity $entity, EntityBodySnapshot $bodySnapshot)
    {
        $this->assertSnapshotBelongsToEntity($entity, $bodySnapshot);

        $bodySnapshot->update($this->validateSnapshot($request));

        return $bodySnapshot->fresh();
    }

    public function destroy(Entity $entity, EntityBodySnapshot $bodySnapshot)
    {
        $this->assertSnapshotBelongsToEntity($entity, $bodySnapshot);

        $bodySnapshot->delete();

        return response()->json(null, 204);
    }

    private function assertSnapshotBelongsToEntity(Entity $entity, EntityBodySnapshot $bodySnapshot): void
    {
        if ((int) $bodySnapshot->entity_id !== (int) $entity->id) {
            abort(404);
        }
    }
}
