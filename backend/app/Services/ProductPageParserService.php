<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ProductPageParserService
{
    public function parse(
        string $url,
        bool $isFootwear = false,
        ?string $productClassHint = null,
        ?string $traceId = null,
    ): array {
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Nieprawidłowy adres URL.');
        }

        $base = self::parserBaseUrl();

        try {
            $headers = [];
            if ($traceId) {
                $headers['X-Langfuse-Trace-Id'] = $traceId;
            }

            $response = Http::timeout(120)
                ->acceptJson()
                ->withHeaders($headers)
                ->post($base.'/api/parse', array_filter([
                    'url' => $url,
                    'is_footwear' => $isFootwear,
                    'product_class_hint' => $productClassHint,
                    'trace_id' => $traceId,
                ], fn ($value) => $value !== null && $value !== ''));
        } catch (ConnectionException $e) {
            throw new RuntimeException($this->connectionErrorMessage($base, $e), 0, $e);
        }

        if ($response->status() === 422) {
            $message = $response->json('detail') ?? $response->json('message') ?? 'Nie udało się odczytać produktu ze strony.';
            if (is_array($message)) {
                $message = $message[0]['msg'] ?? json_encode($message);
            }
            throw new RuntimeException((string) $message);
        }

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            throw new RuntimeException(
                'Parser produktów zwrócił błąd: '.(is_string($detail) ? $detail : 'HTTP '.$response->status())
            );
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new RuntimeException('Nieprawidłowa odpowiedź parsera produktów.');
        }

        $data['source_url'] = $data['source_url'] ?? $url;

        return $data;
    }

    /**
     * W kontenerze backendu localhost to sam kontener — zawsze używamy nazwy serwisu product-parser.
     */
    public static function parserBaseUrl(): string
    {
        $configured = env('PRODUCT_PARSER_URL');
        $inDocker = file_exists('/.dockerenv');

        if ($inDocker) {
            if (is_string($configured) && $configured !== '' && ! self::isLoopbackUrl($configured)) {
                return rtrim($configured, '/');
            }

            return 'http://product-parser:8080';
        }

        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '/');
        }

        return 'http://127.0.0.1:8191';
    }

    private static function isLoopbackUrl(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);

        return in_array($host, ['127.0.0.1', 'localhost', '0.0.0.0'], true);
    }

    private function connectionErrorMessage(string $base, ConnectionException $e): string
    {
        $hint = ' Uruchom: docker compose up -d product-parser';

        if (file_exists('/.dockerenv') && self::isLoopbackUrl($base)) {
            $hint .= ' (w Dockerze nie używaj 127.0.0.1 — backend łączy się przez http://product-parser:8080).';
        }

        return 'Nie można połączyć z parserem produktów ('.$base.').'.$hint;
    }
}
