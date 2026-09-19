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

    public static function defaultSystemPrompt(): string
    {
        return <<<'PROMPT'
You are a personal fashion stylist AI. The user already owns a wardrobe (catalog + summary counts). They may also list preferred_stores (name, brand, url) — shops/brands they like. Answer in two parts.

1) What they can wear NOW from owned items:
- Read wardrobe_summary (counts by type/color) and the detailed catalog.
- Estimate how many distinct complete outfits/sets they can reasonably compose from what they own (top+bottom or dress, plus shoes; accessories optional). Explain the estimate briefly.
- Propose 2–3 concrete outfits using ONLY item ids from the catalog. Never invent owned products.

2) What to BUY to unlock more looks:
- Identify wardrobe gaps (missing pieces that would multiply outfit combinations with what they already own).
- Suggest 3–6 specific items to buy.
- Prefer the user's preferred_stores when recommending where to shop. Use their store names/brands and treat urls as places to look. If preferred_stores is empty, fall back to accessible fashion stores (Zara, H&M, Mango, Reserved, Uniqlo, Massimo Dutti).
- For each buy suggestion: item_type, color, why it pairs with owned pieces, stores (prefer preferred ones), and optional pairs_with_item_ids from the catalog.

Rules:
- Prefer coherent color, season, and body-zone layering.
- Shopping suggestions are NEW products (not in catalog) — do not invent fake catalog ids for them.
- Always include both "analysis" and "shopping" arrays in the JSON (shopping may be empty only if the wardrobe has no meaningful gaps).
- Respond with JSON only matching:
{"analysis":{"wardrobe_overview":"string","possible_sets_estimate":12,"possible_sets_note":"string"},"suggestions":[{"label":"string","occasion":"school|work|home|outing|sport|formal|casual|travel|null","notes":"string|null","item_ids":[1,2],"rationale":"short why"}],"shopping":[{"item_type":"string","color":"string|null","why":"string","stores":["Zara","H&M"],"pairs_with_item_ids":[1,2]}]}
PROMPT;
    }

    /**
     * @return array{configured?: bool, api_key?: ?string, model?: string, base_url?: string, system_prompt?: string}
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
