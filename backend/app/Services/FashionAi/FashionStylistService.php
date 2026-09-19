<?php

namespace App\Services\FashionAi;

use App\Models\Item;
use App\Models\User;
use App\Support\FashionCollection;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class FashionStylistService
{
    public function __construct(
        private FashionAiSettings $settings,
        private FashionAiLogger $logger,
    ) {}

    public function isConfigured(): bool
    {
        return $this->settings->isConfigured();
    }

    /**
     * @return array{
     *   analysis: array{wardrobe_overview: ?string, possible_sets_estimate: ?int, possible_sets_note: ?string},
     *   suggestions: list<array{label: ?string, occasion: ?string, notes: ?string, item_ids: list<int>, rationale: ?string}>,
     *   shopping: list<array{item_type: string, color: ?string, why: ?string, stores: list<string>, pairs_with_item_ids: list<int>}>
     * }
     */
    public function suggest(
        User $user,
        int $entityId,
        ?string $occasion = null,
        ?string $notes = null,
    ): array {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Fashion AI is not configured. An admin must add an OpenAI API key in Backend Settings.');
        }

        $catalog = $this->buildCatalog($user, $entityId);
        if (count($catalog) < 2) {
            throw new RuntimeException('Not enough fashion items in the wardrobe for this Prim (need at least 2).');
        }

        $summary = $this->buildWardrobeSummary($catalog);
        $preferredStores = $this->preferredStoresFor($user);
        $allowedIds = array_map(fn ($row) => (int) $row['id'], $catalog);
        $payload = $this->callOpenAi(
            catalog: $catalog,
            summary: $summary,
            preferredStores: $preferredStores,
            occasion: $occasion,
            notes: $notes,
            userId: (int) $user->id,
            entityId: $entityId,
        );

        $suggestions = [];
        foreach ($payload['suggestions'] ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $ids = [];
            foreach ($row['item_ids'] ?? [] as $id) {
                $id = (int) $id;
                if (in_array($id, $allowedIds, true)) {
                    $ids[] = $id;
                }
            }
            $ids = array_values(array_unique($ids));
            if (count($ids) < 1) {
                continue;
            }
            $suggestions[] = [
                'label' => isset($row['label']) ? (string) $row['label'] : null,
                'occasion' => isset($row['occasion']) && $row['occasion'] !== ''
                    ? (string) $row['occasion']
                    : ($occasion ?: null),
                'notes' => isset($row['notes']) ? (string) $row['notes'] : null,
                'item_ids' => $ids,
                'rationale' => isset($row['rationale']) ? (string) $row['rationale'] : null,
            ];
        }

        if (! $suggestions) {
            throw new RuntimeException('Fashion AI returned no valid outfits from the wardrobe.');
        }

        $analysisRaw = is_array($payload['analysis'] ?? null) ? $payload['analysis'] : [];
        $estimate = $analysisRaw['possible_sets_estimate'] ?? null;
        $analysis = [
            'wardrobe_overview' => isset($analysisRaw['wardrobe_overview'])
                ? (string) $analysisRaw['wardrobe_overview']
                : ($summary['narrative'] ?? null),
            'possible_sets_estimate' => is_numeric($estimate) ? (int) $estimate : null,
            'possible_sets_note' => isset($analysisRaw['possible_sets_note'])
                ? (string) $analysisRaw['possible_sets_note']
                : null,
        ];

        $shopping = [];
        foreach ($payload['shopping'] ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $itemType = trim((string) ($row['item_type'] ?? ''));
            if ($itemType === '') {
                continue;
            }
            $pairIds = [];
            foreach ($row['pairs_with_item_ids'] ?? [] as $id) {
                $id = (int) $id;
                if (in_array($id, $allowedIds, true)) {
                    $pairIds[] = $id;
                }
            }
            $stores = [];
            foreach ($row['stores'] ?? [] as $store) {
                $store = trim((string) $store);
                if ($store !== '') {
                    $stores[] = $store;
                }
            }
            $shopping[] = [
                'item_type' => $itemType,
                'color' => isset($row['color']) && $row['color'] !== '' ? (string) $row['color'] : null,
                'why' => isset($row['why']) ? (string) $row['why'] : null,
                'stores' => array_values(array_unique($stores)),
                'pairs_with_item_ids' => array_values(array_unique($pairIds)),
            ];
        }

        return [
            'analysis' => $analysis,
            'suggestions' => array_slice($suggestions, 0, 3),
            'shopping' => array_slice($shopping, 0, 6),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildCatalog(User $user, int $entityId): array
    {
        $items = Item::query()
            ->where('user_id', $user->id)
            ->fitsPersona($entityId)
            ->with(['collectionGroup:id,name'])
            ->orderBy('name')
            ->get();

        $catalog = [];
        foreach ($items as $item) {
            $groupName = $item->collectionGroup?->name;
            if (! FashionCollection::isFashion($groupName) && ! FashionCollection::isFashion($item->category)) {
                continue;
            }

            $catalog[] = [
                'id' => (int) $item->id,
                'name' => $item->name,
                'brand' => $item->brand,
                'color' => $item->color,
                'category' => $item->category,
                'collection' => $groupName,
                'body_zone' => $item->body_zone,
                'wear_layer' => $item->wear_layer,
                'season' => $item->season,
            ];
        }

        return $catalog;
    }

    /**
     * @param  list<array<string, mixed>>  $catalog
     * @return array{total_items: int, by_body_zone: array<string, int>, by_category: array<string, int>, by_color: array<string, int>, narrative: string}
     */
    private function buildWardrobeSummary(array $catalog): array
    {
        $byZone = [];
        $byCategory = [];
        $byColor = [];

        foreach ($catalog as $row) {
            $zone = strtolower(trim((string) ($row['body_zone'] ?? ''))) ?: 'other';
            $category = trim((string) ($row['category'] ?? '')) ?: 'other';
            $color = trim((string) ($row['color'] ?? '')) ?: 'unknown';

            $byZone[$zone] = ($byZone[$zone] ?? 0) + 1;
            $byCategory[$category] = ($byCategory[$category] ?? 0) + 1;
            $byColor[$color] = ($byColor[$color] ?? 0) + 1;
        }

        arsort($byZone);
        arsort($byCategory);
        arsort($byColor);

        $parts = [];
        foreach ($byCategory as $name => $count) {
            $parts[] = "{$count}× {$name}";
        }
        $colorBits = [];
        foreach (array_slice($byColor, 0, 8, true) as $name => $count) {
            $colorBits[] = "{$count} {$name}";
        }

        $narrative = 'You have '.count($catalog).' fashion items'
            .($parts ? ': '.implode(', ', array_slice($parts, 0, 12)) : '')
            .($colorBits ? '. Colors: '.implode(', ', $colorBits).'.' : '.');

        return [
            'total_items' => count($catalog),
            'by_body_zone' => $byZone,
            'by_category' => $byCategory,
            'by_color' => $byColor,
            'narrative' => $narrative,
        ];
    }

    /**
     * @return list<array{name: string, brand: ?string, url: string}>
     */
    private function preferredStoresFor(User $user): array
    {
        $raw = $user->fashion_stores;
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }
            $name = trim((string) ($row['name'] ?? ''));
            $url = trim((string) ($row['url'] ?? ''));
            if ($name === '' || $url === '') {
                continue;
            }
            $out[] = [
                'name' => $name,
                'brand' => isset($row['brand']) && trim((string) $row['brand']) !== ''
                    ? trim((string) $row['brand'])
                    : null,
                'url' => $url,
            ];
        }

        return array_slice($out, 0, 30);
    }

    /**
     * @param  list<array<string, mixed>>  $catalog
     * @param  array<string, mixed>  $summary
     * @param  list<array{name: string, brand: ?string, url: string}>  $preferredStores
     * @return array<string, mixed>
     */
    private function callOpenAi(
        array $catalog,
        array $summary,
        array $preferredStores,
        ?string $occasion,
        ?string $notes,
        int $userId,
        int $entityId,
    ): array {
        $apiKey = $this->settings->getApiKey();
        $model = $this->settings->getModel();
        $baseUrl = $this->settings->getBaseUrl();
        $system = $this->settings->getSystemPrompt();

        $userMsg = [
            'occasion' => $occasion,
            'notes' => $notes,
            'wardrobe_summary' => $summary,
            'preferred_stores' => $preferredStores,
            'catalog' => $catalog,
            'ask' => [
                'how_many_complete_outfits_can_i_compose_from_owned_items',
                'propose_concrete_outfits_from_catalog',
                'what_should_i_buy_next_preferring_my_preferred_stores_and_brands',
            ],
        ];
        $userContent = json_encode($userMsg, JSON_UNESCAPED_UNICODE);
        $messages = [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $userContent],
        ];
        $requestBody = [
            'model' => $model,
            'temperature' => 0.7,
            'response_format' => ['type' => 'json_object'],
            'messages' => $messages,
        ];

        $started = microtime(true);
        $host = parse_url($baseUrl, PHP_URL_HOST) ?: $baseUrl;

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(90)
                ->post($baseUrl.'/chat/completions', $requestBody)
                ->throw();
        } catch (RequestException $e) {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => count($catalog),
                'http_status' => $e->response?->status(),
                'request' => [
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'response_format' => ['type' => 'json_object'],
                ],
                'response' => null,
                'error' => $e->response?->body() ?: $e->getMessage(),
            ]);
            Log::warning('Fashion AI OpenAI request failed', [
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
            ]);
            throw new RuntimeException('OpenAI request failed. Check the API key and model in Backend Settings.');
        }

        $json = $response->json();
        $content = data_get($json, 'choices.0.message.content');
        $durationMs = (int) round((microtime(true) - $started) * 1000);

        if (! is_string($content) || trim($content) === '') {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => $durationMs,
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => count($catalog),
                'http_status' => $response->status(),
                'request' => [
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'response_format' => ['type' => 'json_object'],
                ],
                'response' => [
                    'raw' => $json,
                    'content' => $content,
                ],
                'usage' => data_get($json, 'usage'),
                'error' => 'OpenAI returned an empty response.',
            ]);
            throw new RuntimeException('OpenAI returned an empty response.');
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded)) {
            $this->logger->record([
                'status' => 'error',
                'model' => $model,
                'base_url_host' => $host,
                'duration_ms' => $durationMs,
                'entity_id' => $entityId,
                'user_id' => $userId,
                'occasion' => $occasion,
                'notes' => $notes,
                'catalog_count' => count($catalog),
                'http_status' => $response->status(),
                'request' => [
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'response_format' => ['type' => 'json_object'],
                ],
                'response' => [
                    'content' => $content,
                ],
                'usage' => data_get($json, 'usage'),
                'error' => 'OpenAI returned invalid JSON.',
            ]);
            throw new RuntimeException('OpenAI returned invalid JSON.');
        }

        $this->logger->record([
            'status' => 'ok',
            'model' => $model,
            'base_url_host' => $host,
            'duration_ms' => $durationMs,
            'entity_id' => $entityId,
            'user_id' => $userId,
            'occasion' => $occasion,
            'notes' => $notes,
            'catalog_count' => count($catalog),
            'http_status' => $response->status(),
            'request' => [
                'messages' => $messages,
                'temperature' => 0.7,
                'response_format' => ['type' => 'json_object'],
            ],
            'response' => [
                'content' => $content,
                'parsed' => $decoded,
            ],
            'usage' => data_get($json, 'usage'),
            'error' => null,
        ]);

        return $decoded;
    }
}
