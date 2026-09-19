<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FashionAi\FashionStylistService;
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
            'occasion' => ['nullable', 'string', Rule::in([
                'school', 'work', 'home', 'outing', 'sport', 'formal', 'casual', 'travel',
            ])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $result = $stylist->suggest(
                $user,
                (int) $data['entity_id'],
                $data['occasion'] ?? null,
                $data['notes'] ?? null,
            );
        } catch (RuntimeException $e) {
            $code = str_contains(strtolower($e->getMessage()), 'not configured')
                ? Response::HTTP_SERVICE_UNAVAILABLE
                : Response::HTTP_UNPROCESSABLE_ENTITY;

            return response()->json(['message' => $e->getMessage()], $code);
        }

        return response()->json($result);
    }
}
