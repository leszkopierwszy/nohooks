<?php

namespace App\Services\FashionAi;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Reads OpenAI connector settings from Backend Settings (model-assistant :8190).
 */
class FashionAiSettings
{
    public function isConfigured(): bool
    {
        return (bool) ($this->runtime()['configured'] ?? false);
    }

    public function getApiKey(): ?string
    {
        $key = $this->runtime()['api_key'] ?? null;

        return is_string($key) && $key !== '' ? $key : null;
    }

    public function getModel(): string
    {
        $model = trim((string) ($this->runtime()['model'] ?? ''));

        return $model !== '' ? $model : 'gpt-4o-mini';
    }

    public function getBaseUrl(): string
    {
        $url = rtrim(trim((string) ($this->runtime()['base_url'] ?? '')), '/');

        return $url !== '' ? $url : 'https://api.openai.com/v1';
    }

    public function getSystemPrompt(): string
    {
        $prompt = trim((string) ($this->runtime()['system_prompt'] ?? ''));

        return $prompt !== '' ? $prompt : self::defaultSystemPrompt();
    }

    /**
     * @return 'chat'|'agent'
     */
    public function getInvocationMode(): string
    {
        $mode = strtolower(trim((string) ($this->runtime()['invocation_mode'] ?? 'chat')));

        return $mode === 'agent' ? 'agent' : 'chat';
    }

    public function getAgentId(): ?string
    {
        $id = trim((string) ($this->runtime()['agent_id'] ?? ''));

        return $id !== '' ? $id : null;
    }

    public function usesAgent(): bool
    {
        return $this->getInvocationMode() === 'agent' && $this->getAgentId() !== null;
    }

    public static function defaultSystemPrompt(): string
    {
        return <<<'PROMPT'
You are a personal fashion stylist AI. The user already owns a wardrobe (catalog + summary counts). They may also list preferred_stores (name, brand, url) — shops/brands they like. The JSON includes persona (name, gender: female|male|null). Answer in two parts.

1) What they can wear NOW from owned items:
- Read wardrobe_summary (counts by type/color) and the detailed catalog.
- Estimate how many distinct complete outfits/sets they can reasonably compose from what they own (top+bottom or dress, plus shoes; accessories optional). Explain the estimate briefly.
- Propose 2–3 concrete outfits using ONLY item ids from the catalog. Never invent owned products.

2) What to BUY to unlock more looks:
- Identify wardrobe gaps that unlock more combinations with owned pieces.
- Suggest 3–6 SPECIFIC products — never vague category-only answers like "top", "pants", or "shoes".
- Match persona.gender: female → women's wear only; male → men's wear only. Never cross gender sections.
- Each suggestion must read like a real store product listing title + short product card:
  - title: concrete product name (e.g. "Fitted navy blazer with flap pockets", "High-waist straight black jeans", "Strappy block-heel sandals in beige").
  - details: cut/fit, length, fabric or finish, neckline/waist/heel if relevant.
  - example_products: 1–2 example product titles as they might appear on that store's site (PL or EN matching the store).
  - search_query: short query for that store's WOMEN or MEN section (no opposite-gender words).
  - color, why, primary store from preferred_stores (use store name + url), pairs_with_item_ids from catalog.
- Prefer preferred_stores; if empty, use Zara / H&M / Mango / Reserved / Uniqlo.

Rules:
- Prefer coherent color, season, and body-zone layering.
- Shopping items are NEW products (not in catalog) — do not invent catalog ids for them.
- Always include analysis + shopping. Shopping empty only if no meaningful gaps.
- Respond with JSON only matching:
{"analysis":{"wardrobe_overview":"string","possible_sets_estimate":12,"possible_sets_note":"string"},"suggestions":[{"label":"string","occasion":"school|work|home|outing|sport|formal|casual|travel|null","notes":"string|null","item_ids":[1,2],"rationale":"short why"}],"shopping":[{"title":"Fitted navy blazer with flap pockets","item_type":"blazer","color":"navy","details":"slim fit, single-breasted, light structured fabric","example_products":["BLAZER WITH FLAP POCKETS","STRUCTURED BLAZER"],"search_query":"navy blazer flap pockets","why":"string","store":"Zara","store_url":"https://www.zara.com/pl/","stores":["Zara"],"pairs_with_item_ids":[1,2]}]}
PROMPT;
    }

    /**
     * @return array{
     *   configured?: bool,
     *   api_key?: ?string,
     *   model?: string,
     *   base_url?: string,
     *   system_prompt?: string,
     *   invocation_mode?: string,
     *   agent_id?: ?string
     * }
     */
    private function runtime(): array
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $base = config('fashion_ai.model_assistant_url');
        $token = (string) config('fashion_ai.internal_token', '');
        $timeout = (int) config('fashion_ai.timeout_seconds', 10);

        try {
            $request = Http::acceptJson()->timeout($timeout);
            if ($token !== '') {
                $request = $request->withHeaders(['X-Fashion-Ai-Token' => $token]);
            }
            $response = $request->get($base.'/api/fashion-ai/runtime');
            if (! $response->successful()) {
                Log::warning('Fashion AI runtime fetch failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                $cache = ['configured' => false];

                return $cache;
            }
            $cache = $response->json() ?? ['configured' => false];
        } catch (Throwable $e) {
            Log::warning('Fashion AI runtime unreachable', ['error' => $e->getMessage()]);
            $cache = ['configured' => false];
        }

        return $cache;
    }

    /** Clear request-scoped cache (tests / after settings change in same process). */
    public function flushCache(): void
    {
        // static reset via new instance is enough; keep for explicit use
    }
}
