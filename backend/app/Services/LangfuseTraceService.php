<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Minimalny klient Langfuse (ingestion API) — trace item.create + wybór zdjęć.
 */
class LangfuseTraceService
{
    public function enabled(): bool
    {
        $flag = env('LANGFUSE_TRACING_ENABLED', 'true');

        if (in_array(strtolower((string) $flag), ['0', 'false', 'no', 'off'], true)) {
            return false;
        }

        return (bool) env('LANGFUSE_PUBLIC_KEY') && (bool) env('LANGFUSE_SECRET_KEY');
    }

    public function newTraceId(): string
    {
        return Str::replace('-', '', Str::uuid()->toString());
    }

    public function uiTraceUrl(string $traceId): ?string
    {
        $base = rtrim((string) env('LANGFUSE_UI_URL', env('LANGFUSE_NEXTAUTH_URL', '')), '/');
        if ($base === '') {
            return null;
        }

        return $base.'/trace/'.$traceId;
    }

    /**
     * @param  callable(string $traceId): mixed  $callback
     */
    public function runTrace(string $name, callable $callback, array $input = [], array $metadata = [], ?string $traceId = null): mixed
    {
        $traceId = $traceId ?: $this->newTraceId();

        if (! $this->enabled()) {
            return $callback($traceId);
        }

        $this->pushEvent('trace-create', [
            'id' => $traceId,
            'name' => $name,
            'input' => $input,
            'metadata' => $metadata,
        ]);

        try {
            $result = $callback($traceId);
            $output = is_array($result)
                ? $this->summarizeForTrace($result)
                : ['result' => $result];
            $this->pushEvent('trace-create', [
                'id' => $traceId,
                'output' => $output,
            ]);

            return $result;
        } catch (Throwable $e) {
            $this->pushEvent('trace-create', [
                'id' => $traceId,
                'output' => ['error' => $e->getMessage()],
                'metadata' => array_merge($metadata, ['level' => 'ERROR']),
            ]);
            throw $e;
        }
    }

    public function span(
        string $traceId,
        string $name,
        array $input = [],
        array $output = [],
        array $metadata = [],
        ?string $parentObservationId = null,
    ): string {
        $spanId = Str::replace('-', '', Str::uuid()->toString());

        if (! $this->enabled()) {
            return $spanId;
        }

        $body = [
            'id' => $spanId,
            'traceId' => $traceId,
            'name' => $name,
            'input' => $input,
            'output' => $output ?: null,
            'metadata' => $metadata,
        ];

        if ($parentObservationId) {
            $body['parentObservationId'] = $parentObservationId;
        }

        $this->pushEvent('span-create', $body);
        $this->pushEvent('span-update', [
            'id' => $spanId,
            'output' => $output ?: null,
            'metadata' => $metadata,
        ]);

        return $spanId;
    }

    /**
     * Pełny katalog zdjęć jest w spanie product_parser.image_catalog — nie duplikuj w trace output.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function summarizeForTrace(array $data): array
    {
        $summary = $data;

        if (isset($summary['image_catalog']) && is_array($summary['image_catalog'])) {
            $catalog = $summary['image_catalog'];
            $summary['image_catalog'] = [
                'raw_count' => $catalog['raw_count'] ?? null,
                'catalog_output_count' => $catalog['catalog_output_count'] ?? null,
                'all_scored_count' => is_array($catalog['all_scored'] ?? null)
                    ? count($catalog['all_scored'])
                    : null,
            ];
        }

        if (isset($summary['image_urls']) && is_array($summary['image_urls'])) {
            $summary['image_urls_count'] = count($summary['image_urls']);
            $summary['image_urls'] = array_slice($summary['image_urls'], 0, 4);
        }

        return $summary;
    }

    private function pushEvent(string $type, array $body): void
    {
        $host = rtrim((string) env('LANGFUSE_HOST', ''), '/');
        $public = env('LANGFUSE_PUBLIC_KEY');
        $secret = env('LANGFUSE_SECRET_KEY');

        if ($host === '' || ! $public || ! $secret) {
            return;
        }

        $timestamp = now()->utc()->format('Y-m-d\TH:i:s.v\Z');

        try {
            Http::timeout(3)
                ->withBasicAuth((string) $public, (string) $secret)
                ->acceptJson()
                ->post($host.'/api/public/ingestion', [
                    'batch' => [
                        [
                            'type' => $type,
                            'id' => Str::uuid()->toString(),
                            'timestamp' => $timestamp,
                            'body' => $body,
                        ],
                    ],
                ]);
        } catch (Throwable) {
            // Tracing nie może blokować zapisu itemu.
        }
    }
}
