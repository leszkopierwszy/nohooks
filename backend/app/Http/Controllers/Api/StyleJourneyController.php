<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entity;
use App\Models\StyleModule;
use App\Services\Style\StyleJourneyService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StyleJourneyController extends Controller
{
    public function __construct(
        private readonly StyleJourneyService $journey,
    ) {
    }

    private function resolveEntity(Request $request): Entity
    {
        $data = $request->validate([
            'entity_id' => [
                'required',
                'integer',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', $request->user()->id)),
            ],
        ]);

        return Entity::query()
            ->where('user_id', $request->user()->id)
            ->where('id', $data['entity_id'])
            ->firstOrFail();
    }

    public function show(Request $request)
    {
        $entity = $this->resolveEntity($request);

        return response()->json($this->journey->buildJourneyPayload($request->user(), $entity));
    }

    public function sync(Request $request)
    {
        $entity = $this->resolveEntity($request);
        $result = $this->journey->sync($request->user(), $entity);

        return response()->json($result);
    }

    public function complete(Request $request, StyleModule $styleModule)
    {
        $entity = $this->resolveEntity($request);
        $data = $request->validate([
            'check_ids' => ['nullable', 'array'],
            'check_ids.*' => ['string', 'max:64'],
        ]);

        $payload = $this->journey->complete(
            $request->user(),
            $entity,
            $styleModule,
            $data['check_ids'] ?? [],
        );

        return response()->json($payload);
    }

    public function scoreboard(Request $request)
    {
        $limit = (int) ($request->query('limit') ?? config('style_journey.scoreboard_limit', 10));

        return response()->json([
            'entries' => $this->journey->scoreboard($limit),
            'me' => [
                'xp' => $this->journey->totalXpForUser($request->user()->id),
                'level' => $this->journey->levelForXp($this->journey->totalXpForUser($request->user()->id)),
                'rank' => $this->journey->rankForUser($request->user()->id),
            ],
        ]);
    }
}
