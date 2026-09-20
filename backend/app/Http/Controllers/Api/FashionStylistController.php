<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Outfit;
use App\Services\FashionAi\FashionStylistService;
use App\Services\Wardrobe\OutfitCompatibilityService;
use App\Support\GarmentAttributes;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class FashionStylistController extends Controller
{
    public function status(FashionStylistService $stylist)
    {
        return response()->json([
            'configured' => $stylist->isConfigured(),
        ]);
    }

    public function suggest(Request $request, FashionStylistService $stylist)
    {
        $user = $request->user();

        $data = $request->validate([
            'entity_id' => [
                'required',
                'integer',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', $user->id)),
            ],
            'occasion' => ['nullable', 'string', Rule::in(Outfit::OCCASIONS)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'anchor_item_id' => [
                'nullable',
                'integer',
                Rule::exists('items', 'id')->where(fn ($q) => $q->where('user_id', $user->id)),
            ],
        ]);

        $notes = $data['notes'] ?? '';
        if (! empty($data['anchor_item_id'])) {
            $anchor = Item::query()->find((int) $data['anchor_item_id']);
            if ($anchor) {
                $anchorLine = 'Create an outfit around this owned item: #'
                    .$anchor->id
                    .' '.$anchor->name
                    .($anchor->category ? " ({$anchor->category})" : '')
                    .'.';
                $notes = trim($notes === '' ? $anchorLine : $notes."\n".$anchorLine);
            }
        }

        try {
            $result = $stylist->suggest(
                $user,
                (int) $data['entity_id'],
                $data['occasion'] ?? null,
                $notes !== '' ? $notes : null,
            );
        } catch (RuntimeException $e) {
            $code = str_contains(strtolower($e->getMessage()), 'not configured')
                ? Response::HTTP_SERVICE_UNAVAILABLE
                : Response::HTTP_UNPROCESSABLE_ENTITY;

            return response()->json(['message' => $e->getMessage()], $code);
        }

        return response()->json($result);
    }

    /**
     * Deterministic base-wardrobe analysis (no LLM).
     */
    public function baseWardrobe(Request $request, OutfitCompatibilityService $compatibility)
    {
        $user = $request->user();

        $data = $request->validate([
            'entity_id' => [
                'required',
                'integer',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', $user->id)),
            ],
            'occasion' => ['nullable', 'string', Rule::in(Outfit::OCCASIONS)],
            'season' => ['nullable', 'string', 'max:32'],
            'style' => ['nullable', 'string', 'max:64'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:80'],
        ]);

        $entityId = (int) $data['entity_id'];
        $items = Item::query()
            ->with(['images', 'collectionGroup'])
            ->fitsPersona($entityId)
            ->get()
            ->filter(function (Item $item) {
                $slot = GarmentAttributes::outfitSlot(
                    $item->category,
                    $item->body_zone,
                    $item->name,
                    $item->collectionGroup?->name,
                );

                return in_array($slot, ['one_piece', 'top', 'bottom', 'footwear', 'outerwear'], true);
            })
            ->values();

        $analysis = $compatibility->analyzeBaseWardrobe($items, [
            'occasion' => $data['occasion'] ?? null,
            'season' => $data['season'] ?? null,
            'style' => $data['style'] ?? null,
            'limit' => $data['limit'] ?? OutfitCompatibilityService::MAX_OUTFITS,
        ]);

        return response()->json($analysis);
    }
}
