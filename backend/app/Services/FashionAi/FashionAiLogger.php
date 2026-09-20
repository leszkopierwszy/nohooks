<?php

namespace App\Services\FashionAi;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pushes OpenAI request/response traces to Backend Settings (:8190) for admin preview.
 */
class FashionAiLogger
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function record(array $payload): void
    {
        $base = config('fashion_ai.model_assistant_url');
        $token = (string) config('fashion_ai.internal_token', '');
        $timeout = min(5, (int) config('fashion_ai.timeout_seconds', 10));

        try {
            $request = Http::acceptJson()->timeout($timeout);
            if ($token !== '') {
                $request = $request->withHeaders(['X-Fashion-Ai-Token' => $token]);
            }
            $response = $request->post($base.'/api/fashion-ai/logs', $payload);
            if (! $response->successful()) {
                Log::debug('Fashion AI log push failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (Throwable $e) {
            Log::debug('Fashion AI log push unreachable', ['error' => $e->getMessage()]);
        }
    }
}
