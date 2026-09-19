<?php

namespace App\Services\FashionAi;

use App\Models\Entity;
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

        $persona = $this->resolvePersona($user, $entityId);
        $gender = $this->normalizeGender($persona['gender'] ?? null);
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
            persona: $persona,
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
            $title = trim((string) ($row['title'] ?? ''));
            $itemType = trim((string) ($row['item_type'] ?? ''));
            if ($title === '' && $itemType === '') {
                continue;
            }
            if ($title === '') {
                $title = $itemType;
            }
            // Reject overly vague category-only titles.
            $vague = preg_match('/^(tops?|pants?|trousers?|shoes?|dresses?|skirts?|jackets?|spodnie|buty|sukienki|góra|dół)$/iu', $title);
            if ($vague && trim((string) ($row['details'] ?? '')) === '') {
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
            $primaryStore = trim((string) ($row['store'] ?? ''));
            if ($primaryStore !== '' && ! in_array($primaryStore, $stores, true)) {
                array_unshift($stores, $primaryStore);
            }
            $storeUrl = trim((string) ($row['store_url'] ?? ''));
            if ($storeUrl === '') {
                $storeUrl = $this->matchPreferredStoreUrl($preferredStores, $stores[0] ?? $primaryStore) ?? '';
            }
            $examples = [];
            foreach ($row['example_products'] ?? [] as $ex) {
                $ex = trim((string) $ex);
                if ($ex !== '') {
                    $examples[] = $ex;
                }
            }
            $searchQuery = trim((string) ($row['search_query'] ?? ''));
            if ($searchQuery === '') {
                $searchQuery = trim($title.' '.((string) ($row['color'] ?? '')));
            }
            $searchUrl = $storeUrl !== ''
                ? $this->buildStoreSearchUrl($storeUrl, $searchQuery, $gender)
                : null;

            $shopping[] = [
                'title' => $title,
                'item_type' => $itemType !== '' ? $itemType : null,
                'color' => isset($row['color']) && $row['color'] !== '' ? (string) $row['color'] : null,
                'details' => isset($row['details']) && trim((string) $row['details']) !== ''
                    ? (string) $row['details']
                    : null,
                'example_products' => array_values(array_unique(array_slice($examples, 0, 3))),
                'search_query' => $searchQuery !== '' ? $searchQuery : null,
                'search_url' => $searchUrl,
                'why' => isset($row['why']) ? (string) $row['why'] : null,
                'store' => $primaryStore !== '' ? $primaryStore : ($stores[0] ?? null),
                'store_url' => $storeUrl !== '' ? $storeUrl : null,
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
     * @param  list<array{name: string, brand: ?string, url: string}>  $preferredStores
     */
    private function matchPreferredStoreUrl(array $preferredStores, ?string $name): ?string
    {
        if ($name === null || $name === '') {
            return $preferredStores[0]['url'] ?? null;
        }
        $needle = mb_strtolower($name);
        foreach ($preferredStores as $store) {
            $candidates = [mb_strtolower($store['name']), mb_strtolower((string) ($store['brand'] ?? ''))];
            foreach ($candidates as $c) {
                if ($c !== '' && ($c === $needle || str_contains($c, $needle) || str_contains($needle, $c))) {
                    return $store['url'];
                }
            }
        }

        return $preferredStores[0]['url'] ?? null;
    }

    /**
     * @return array{id: int, name: ?string, gender: ?string}
     */
    private function resolvePersona(User $user, int $entityId): array
    {
        $entity = Entity::query()
            ->where('user_id', $user->id)
            ->whereKey($entityId)
            ->first(['id', 'name', 'gender']);

        return [
            'id' => $entityId,
            'name' => $entity?->name,
            'gender' => $this->normalizeGender($entity?->gender),
        ];
    }

    /**
     * @return 'female'|'male'|null
     */
    private function normalizeGender(?string $gender): ?string
    {
        $g = strtolower(trim((string) $gender));
        if (in_array($g, ['female', 'f', 'woman', 'women', 'kobieta', 'damska'], true)) {
            return 'female';
        }
        if (in_array($g, ['male', 'm', 'man', 'men', 'facet', 'mezczyzna', 'mężczyzna', 'meska', 'męska'], true)) {
            return 'male';
        }

        return null;
    }

    /**
     * Build a store search URL scoped to the Prim's gender section when possible.
     *
     * @param  'female'|'male'|null  $gender
     */
    private function buildStoreSearchUrl(string $storeUrl, string $query, ?string $gender = null): ?string
    {
        $query = trim($query);
        if ($query === '') {
            return rtrim($storeUrl, '/') ?: null;
        }
        $q = rawurlencode($query);
        $host = strtolower((string) (parse_url($storeUrl, PHP_URL_HOST) ?: ''));
        $isWoman = $gender === 'female';
        $isMan = $gender === 'male';

        if (str_contains($host, 'zara.com')) {
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.zara.com/pl/pl/search?searchTerm='.$q;

            return $section ? $url.'&section='.$section : $url;
        }
        if (str_contains($host, 'hm.com')) {
            // H&M PL: department=ladies | men scopes the search grid.
            $dept = $isWoman ? 'ladies' : ($isMan ? 'men' : null);
            $url = 'https://www2.hm.com/pl_pl/search-results.html?q='.$q;

            return $dept ? $url.'&department='.$dept : $url;
        }
        if (str_contains($host, 'mango.com') || str_contains($host, 'shop.mango')) {
            // Mango: /search/woman or /search/man
            $seg = $isWoman ? 'woman' : ($isMan ? 'man' : null);
            $base = $seg
                ? 'https://shop.mango.com/pl/search/'.$seg
                : 'https://shop.mango.com/pl/search';

            return $base.'?q='.$q;
        }
        if (str_contains($host, 'reserved.com')) {
            $seg = $isWoman ? 'woman' : ($isMan ? 'man' : null);
            $url = 'https://www.reserved.com/pl/pl/search?q='.$q;

            return $seg ? $url.'&gender='.$seg : $url;
        }
        if (str_contains($host, 'uniqlo.com')) {
            $seg = $isWoman ? 'women' : ($isMan ? 'men' : null);
            $url = 'https://www.uniqlo.com/pl/pl/search?q='.$q;

            return $seg ? $url.'&path='.rawurlencode('/'.$seg) : $url;
        }
        if (str_contains($host, 'massimodutti.com')) {
            // Inditex sibling of Zara — same section param.
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.massimodutti.com/pl/search?q='.$q;

            return $section ? $url.'&section='.$section : $url;
        }
        if (str_contains($host, 'pullandbear.com')) {
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.pullandbear.com/pl/pl/search?q='.$q;

            return $section ? $url.'&section='.$section : $url;
        }
        if (str_contains($host, 'bershka.com')) {
            $section = $isWoman ? 'WOMAN' : ($isMan ? 'MAN' : null);
            $url = 'https://www.bershka.com/pl/pl/search?q='.$q;

            return $section ? $url.'&section='.$section : $url;
        }

        $sep = str_contains($storeUrl, '?') ? '&' : '?';
        $url = rtrim($storeUrl, '/').$sep.'q='.$q;
        if ($isWoman) {
            return $url.'&gender=woman';
        }
        if ($isMan) {
            return $url.'&gender=man';
        }

        return $url;
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
     * @param  array{id: int, name: ?string, gender: ?string}  $persona
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
        array $persona = [],
    ): array {
        $userMsg = [
            'persona' => $persona,
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

        if ($this->settings->usesAgent()) {
            return $this->callOpenAiAgent(
                userMsg: $userMsg,
                occasion: $occasion,
                notes: $notes,
                userId: $userId,
                entityId: $entityId,
                catalogCount: count($catalog),
            );
        }

        return $this->callOpenAiChat(
            userMsg: $userMsg,
            occasion: $occasion,
            notes: $notes,
            userId: $userId,
            entityId: $entityId,
            catalogCount: count($catalog),
        );
    }

    /**
     * Chat Completions — system prompt lives in Backend Settings.
     *
     * @param  array<string, mixed>  $userMsg
     * @return array<string, mixed>
     */
    private function callOpenAiChat(
        array $userMsg,
        ?string $occasion,
        ?string $notes,
        int $userId,
        int $entityId,
        int $catalogCount,
    ): array {
        $apiKey = $this->settings->getApiKey();
        $model = $this->settings->getModel();
        $baseUrl = $this->settings->getBaseUrl();
        $system = $this->settings->getSystemPrompt();
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
        $logRequest = [
            'invocation_mode' => 'chat',
            'messages' => $messages,
            'temperature' => 0.7,
            'response_format' => ['type' => 'json_object'],
        ];

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
                'catalog_count' => $catalogCount,
                'http_status' => $e->response?->status(),
                'request' => $logRequest,
                'response' => null,
                'error' => $e->response?->body() ?: $e->getMessage(),
            ]);
            Log::warning('Fashion AI OpenAI chat request failed', [
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
            ]);
            throw new RuntimeException('OpenAI request failed. Check the API key and model in Backend Settings.');
        }

        $json = $response->json();
        $content = data_get($json, 'choices.0.message.content');

        return $this->parseAndLogOpenAiJson(
            content: is_string($content) ? $content : null,
            json: is_array($json) ? $json : [],
            model: $model,
            host: (string) $host,
            started: $started,
            entityId: $entityId,
            userId: $userId,
            occasion: $occasion,
            notes: $notes,
            catalogCount: $catalogCount,
            httpStatus: $response->status(),
            logRequest: $logRequest,
        );
    }

    /**
     * Responses API — logic lives in an OpenAI Prompt/Agent (pmpt_…).
     * App only sends Prim wardrobe + occasion payload.
     *
     * @param  array<string, mixed>  $userMsg
     * @return array<string, mixed>
     */
    private function callOpenAiAgent(
        array $userMsg,
        ?string $occasion,
        ?string $notes,
        int $userId,
        int $entityId,
        int $catalogCount,
    ): array {
        $apiKey = $this->settings->getApiKey();
        $model = $this->settings->getModel();
        $baseUrl = $this->settings->getBaseUrl();
        $agentId = $this->settings->getAgentId();
        if ($agentId === null || $agentId === '') {
            throw new RuntimeException('Fashion AI agent mode requires an OpenAI Prompt/Agent ID in Backend Settings.');
        }

        $userContent = json_encode($userMsg, JSON_UNESCAPED_UNICODE);
        $requestBody = [
            'prompt' => ['id' => $agentId],
            'input' => [
                [
                    'role' => 'user',
                    'content' => $userContent,
                ],
            ],
            'text' => [
                'format' => ['type' => 'json_object'],
            ],
            'store' => false,
        ];
        // Model is optional when the Prompt already pins one; send as fallback.
        if ($model !== '') {
            $requestBody['model'] = $model;
        }

        $started = microtime(true);
        $host = parse_url($baseUrl, PHP_URL_HOST) ?: $baseUrl;
        $logRequest = [
            'invocation_mode' => 'agent',
            'agent_id' => $agentId,
            'input' => $requestBody['input'],
            'text' => $requestBody['text'],
            'model' => $model,
        ];

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(120)
                ->post($baseUrl.'/responses', $requestBody)
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
                'catalog_count' => $catalogCount,
                'http_status' => $e->response?->status(),
                'request' => $logRequest,
                'response' => null,
                'error' => $e->response?->body() ?: $e->getMessage(),
            ]);
            Log::warning('Fashion AI OpenAI agent request failed', [
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
                'agent_id' => $agentId,
            ]);
            throw new RuntimeException('OpenAI agent request failed. Check the Prompt/Agent ID and API key in Backend Settings.');
        }

        $json = $response->json();
        $content = $this->extractResponsesOutputText(is_array($json) ? $json : []);

        return $this->parseAndLogOpenAiJson(
            content: $content,
            json: is_array($json) ? $json : [],
            model: (string) (data_get($json, 'model') ?: $model),
            host: (string) $host,
            started: $started,
            entityId: $entityId,
            userId: $userId,
            occasion: $occasion,
            notes: $notes,
            catalogCount: $catalogCount,
            httpStatus: $response->status(),
            logRequest: $logRequest,
        );
    }

    /**
     * @param  array<string, mixed>  $json
     */
    private function extractResponsesOutputText(array $json): ?string
    {
        $direct = data_get($json, 'output_text');
        if (is_string($direct) && trim($direct) !== '') {
            return $direct;
        }

        $chunks = [];
        foreach ($json['output'] ?? [] as $item) {
            if (! is_array($item)) {
                continue;
            }
            if (($item['type'] ?? '') !== 'message') {
                continue;
            }
            foreach ($item['content'] ?? [] as $part) {
                if (! is_array($part)) {
                    continue;
                }
                $type = (string) ($part['type'] ?? '');
                if (in_array($type, ['output_text', 'text'], true) && isset($part['text']) && is_string($part['text'])) {
                    $chunks[] = $part['text'];
                }
            }
        }

        if (! $chunks) {
            return null;
        }

        return implode("\n", $chunks);
    }

    /**
     * @param  array<string, mixed>  $json
     * @param  array<string, mixed>  $logRequest
     * @return array<string, mixed>
     */
    private function parseAndLogOpenAiJson(
        ?string $content,
        array $json,
        string $model,
        string $host,
        float $started,
        int $entityId,
        int $userId,
        ?string $occasion,
        ?string $notes,
        int $catalogCount,
        int $httpStatus,
        array $logRequest,
    ): array {
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
                'catalog_count' => $catalogCount,
                'http_status' => $httpStatus,
                'request' => $logRequest,
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
            // Agents sometimes wrap JSON in markdown fences.
            if (preg_match('/\{.*\}/s', $content, $m)) {
                $decoded = json_decode($m[0], true);
            }
        }
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
                'catalog_count' => $catalogCount,
                'http_status' => $httpStatus,
                'request' => $logRequest,
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
            'catalog_count' => $catalogCount,
            'http_status' => $httpStatus,
            'request' => $logRequest,
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
