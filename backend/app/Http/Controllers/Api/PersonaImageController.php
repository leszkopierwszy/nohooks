<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\PersonaVisionException;
use App\Http\Controllers\Controller;
use App\Models\Entity;
use App\Services\PersonaVision\PersonaImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * API warstwy HTTP dla modułu Persona Vision.
 * Logika biznesowa: App\Services\PersonaVision\PersonaImageProcessingService
 */
class PersonaImageController extends Controller
{
    public function __construct(
        private readonly PersonaImageProcessingService $vision,
    ) {
    }

    public function status()
    {
        $comfyuiUrl = config('persona_ai.comfyui.base_url');

        return response()->json([
            'provider' => $this->vision->providerName(),
            'configured' => $this->vision->isConfigured(),
            'comfyui_url' => $comfyuiUrl,
        ]);
    }

    /**
     * POST /api/entity/{entity}/avatar/generate
     * Body: multipart photo LUB JSON { "photo_url": "https://..." }
     */
    public function generateAvatar(Request $request, Entity $entity)
    {
        $request->validate([
            'photo_url' => 'nullable|url|max:2048',
            'photo' => 'nullable|image|max:10240',
            'prompt' => 'nullable|string|max:2000',
        ]);

        try {
            $source = $request->file('photo') ?? $request->input('photo_url');

            if (! $source) {
                return response()->json([
                    'message' => 'Prześlij pole photo (plik) lub photo_url (URL).',
                ], 422);
            }

            $options = array_filter([
                'entity_id' => $entity->id,
                'prompt' => $request->input('prompt'),
            ]);

            $result = $this->vision->generateAvatarFromUserPhoto($source, $options);

            return response()->json([
                'entity_id' => $entity->id,
                'avatar_source_url' => $entity->fresh()->avatar_source_url,
                'avatar_doll_url' => $entity->fresh()->avatar_doll_url,
                ...$result->toArray(),
            ]);
        } catch (PersonaVisionException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    /**
     * POST /api/entity/{entity}/try-on
     * JSON: { "garment_image_url": "...", "item_id": 123? }
     * Używa zapisanego awatara persony — można wywołać wielokrotnie z różnymi ubraniami.
     */
    public function tryOn(Request $request, Entity $entity)
    {
        $data = $request->validate([
            'garment_image_url' => 'required|url|max:2048',
            'item_id' => [
                'nullable',
                Rule::exists('items', 'id')->where(fn ($q) => $q->where('user_id', auth()->id())),
            ],
            'avatar_image_url' => 'nullable|url|max:2048',
        ]);

        try {
            $avatarUrl = $data['avatar_image_url'] ?? $entity->avatar_doll_url;

            if (! $avatarUrl) {
                return response()->json([
                    'message' => 'Brak awatara. Najpierw wygeneruj awatar (POST .../avatar/generate).',
                ], 422);
            }

            $result = $this->vision->virtualTryOn(
                $avatarUrl,
                $data['garment_image_url'],
                [
                    'entity_id' => $entity->id,
                    'item_id' => $data['item_id'] ?? null,
                ]
            );

            return response()->json([
                'entity_id' => $entity->id,
                'avatar_image_url' => $avatarUrl,
                'garment_image_url' => $data['garment_image_url'],
                ...$result->toArray(),
            ], 201);
        } catch (PersonaVisionException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    /**
     * GET /api/entity/{entity}/try-ons — historia przymiarek
     */
    public function tryOnHistory(Entity $entity)
    {
        return $entity->tryOns()
            ->with('item:id,name')
            ->limit(50)
            ->get();
    }
}
