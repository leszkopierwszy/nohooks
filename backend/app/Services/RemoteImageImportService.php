<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class RemoteImageImportService
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    private const MAX_REDIRECTS = 2;

    /**
     * @return array{binary: string, mime: string, resolved_url: string}
     */
    public function import(string $url, int $depth = 0): array
    {
        if ($depth > self::MAX_REDIRECTS) {
            throw new RuntimeException('Zbyt wiele przekierowań przy pobieraniu obrazu.');
        }

        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Nieprawidłowy adres URL.');
        }

        $url = $this->preferRasterUrl($url);

        $response = Http::timeout(30)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; Nohooks/1.0; +https://localhost)',
                // Bez AVIF — PHP/GD często nie dekoduje; Nike zwróci PNG/WebP/JPEG.
                'Accept' => 'image/webp,image/apng,image/png,image/jpeg,image/*,*/*;q=0.8,text/html;q=0.5',
            ])
            ->get($url);

        $response->throw();

        $body = $response->body();
        if (strlen($body) > self::MAX_BYTES) {
            throw new RuntimeException('Obraz jest większy niż 5 MB.');
        }

        $contentType = strtolower((string) $response->header('Content-Type'));

        if ($this->isImageResponse($contentType, $body)) {
            $this->assertValidImage($body);
            $mime = $this->guessMime($contentType, $body);
            $normalized = $this->normalizeForStorage($body, $mime);

            return [
                'binary' => $normalized['binary'],
                'mime' => $normalized['mime'],
                'resolved_url' => $url,
            ];
        }

        if ($depth >= 1) {
            throw new RuntimeException('Pod adresem nie ma pliku graficznego.');
        }

        $imageUrl = $this->extractImageUrlFromHtml($body, $url);

        if ($imageUrl === null) {
            throw new RuntimeException(
                'Nie znaleziono zdjęcia na stronie (brak og:image). Wklej bezpośredni link do pliku .jpg/.png.'
            );
        }

        return $this->import($imageUrl, $depth + 1);
    }

    private function isImageResponse(string $contentType, string $body): bool
    {
        if (str_contains($contentType, 'image/')) {
            return true;
        }

        return $this->looksLikeImageBinary($body);
    }

    private function looksLikeImageBinary(string $body): bool
    {
        if ($body === '') {
            return false;
        }

        return str_starts_with($body, "\x89PNG\r\n\x1a\n")
            || str_starts_with($body, "\xFF\xD8\xFF")
            || (str_starts_with($body, 'RIFF') && str_contains(substr($body, 0, 16), 'WEBP'))
            || str_starts_with($body, 'GIF87a')
            || str_starts_with($body, 'GIF89a');
    }

    private function assertValidImage(string $binary): void
    {
        if (@getimagesizefromstring($binary) === false) {
            throw new RuntimeException('Pobrana treść nie jest prawidłowym obrazem.');
        }
    }

    private function extractImageUrlFromHtml(string $html, string $pageUrl): ?string
    {
        $candidates = [];

        if (preg_match_all('/<meta[^>]+>/i', $html, $metas)) {
            foreach ($metas[0] as $tag) {
                if (! preg_match('/\bproperty=["\']og:image(?::secure_url)?["\']/i', $tag)
                    && ! preg_match('/\bname=["\']twitter:image(?::src)?["\']/i', $tag)
                    && ! preg_match('/\bproperty=["\']twitter:image(?::src)?["\']/i', $tag)) {
                    continue;
                }

                if (preg_match('/\bcontent=["\']([^"\']+)["\']/i', $tag, $m)) {
                    $candidates[] = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
                }
            }
        }

        if (preg_match('/<link[^>]+rel=["\']image_src["\'][^>]*>/i', $html, $linkTag)) {
            if (preg_match('/\bhref=["\']([^"\']+)["\']/i', $linkTag[0], $m)) {
                $candidates[] = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
            }
        }

        foreach ($candidates as $candidate) {
            $resolved = $this->resolveUrl($candidate, $pageUrl);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return null;
    }

    private function resolveUrl(string $maybeRelative, string $base): ?string
    {
        $maybeRelative = trim($maybeRelative);
        if ($maybeRelative === '') {
            return null;
        }

        if (filter_var($maybeRelative, FILTER_VALIDATE_URL)) {
            return $maybeRelative;
        }

        $parts = parse_url($base);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $origin = $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');

        if (str_starts_with($maybeRelative, '//')) {
            return $parts['scheme'].':'.$maybeRelative;
        }

        if (str_starts_with($maybeRelative, '/')) {
            return $origin.$maybeRelative;
        }

        $path = $parts['path'] ?? '/';
        $dir = preg_replace('#/[^/]*$#', '/', $path) ?: '/';

        return $origin.$dir.ltrim($maybeRelative, '/');
    }

    private function guessMime(string $contentType, string $binary): string
    {
        if (str_contains($contentType, 'png')) {
            return 'image/png';
        }
        if (str_contains($contentType, 'webp')) {
            return 'image/webp';
        }
        if (str_contains($contentType, 'gif')) {
            return 'image/gif';
        }
        if (str_contains($contentType, 'avif')) {
            return 'image/avif';
        }
        if (str_starts_with($binary, "\x89PNG\r\n\x1a\n")) {
            return 'image/png';
        }
        if (str_starts_with($binary, 'RIFF') && str_contains(substr($binary, 0, 16), 'WEBP')) {
            return 'image/webp';
        }

        return 'image/jpeg';
    }

    /**
     * Laravel `image` nie akceptuje AVIF — konwersja do JPEG przy imporcie.
     *
     * @return array{binary: string, mime: string}
     */
    private function normalizeForStorage(string $binary, string $mime): array
    {
        if ($mime !== 'image/avif' && ! str_contains($mime, 'avif')) {
            return ['binary' => $binary, 'mime' => $mime];
        }

        if (! function_exists('imagecreatefromstring')) {
            throw new RuntimeException('Serwer nie obsługuje konwersji AVIF.');
        }

        $image = @imagecreatefromstring($binary);
        if ($image === false) {
            throw new RuntimeException(
                'Nie udało się przekonwertować obrazu AVIF. Użyj linku PNG/JPEG lub dodaj zdjęcia jako URL bez pobierania.'
            );
        }

        ob_start();
        imagejpeg($image, null, 90);
        $jpeg = ob_get_clean() ?: '';
        imagedestroy($image);

        if ($jpeg === '') {
            throw new RuntimeException('Konwersja AVIF do JPEG nie powiodła się.');
        }

        return ['binary' => $jpeg, 'mime' => 'image/jpeg'];
    }

    /** Nike CDN: f_auto często zwraca AVIF — wymuś format rastrowy. */
    private function preferRasterUrl(string $url): string
    {
        if (! str_contains($url, 'static.nike.com')) {
            return $url;
        }

        $url = preg_replace('/\/f_auto\b/', '/f_png', $url) ?? $url;
        $url = preg_replace('/,f_auto\b/', ',f_png', $url) ?? $url;

        return $url;
    }
}
