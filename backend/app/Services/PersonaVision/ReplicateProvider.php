<?php

namespace App\Services\PersonaVision;

use App\Exceptions\PersonaVisionException;
use App\Services\PersonaVision\DTO\ProcessingResult;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
/**
 * Klient Replicate.com — uruchamianie modeli diffusion / VTON i polling wyniku.
 *
 * Instalacja: brak dodatkowych pakietów (używamy Illuminate\Support\Facades\Http).
 * W .env: REPLICATE_API_TOKEN=...
 */
class ReplicateProvider
{
    public function isConfigured(): bool
    {
        return (bool) config('persona_ai.replicate.api_token');
    }

    /**
     * Generuje awatar „lalka 3D / Barbie” z zdjęcia użytkownika (img2img + ControlNet OpenPose).
     *
     * @param  string  $sourceImageUrl  Publiczny URL zdjęcia użytkownika
     * @param  array<string, mixed>  $options  Nadpisanie promptu, control_type itd.
     */
    public function generateDollAvatar(string $sourceImageUrl, array $options = []): ProcessingResult
    {
        $defaults = config('persona_ai.replicate.avatar_defaults', []);

        $input = array_merge($defaults, $options, [
            // Typowe nazwy pól — dostosuj w config jeśli Twój model używa innych kluczy
            'image' => $sourceImageUrl,
            'control_image' => $sourceImageUrl,
        ]);

        return $this->runModel(
            model: config('persona_ai.replicate.avatar_model'),
            version: config('persona_ai.replicate.avatar_version'),
            input: $input,
        );
    }

    /**
     * Virtual try-on: nakłada ubranie (garment) na wcześniej wygenerowany awatar.
     * Niezależna operacja — ten sam awatar + różne zdjęcia ubrań.
     *
     * @param  string  $avatarImageUrl  URL awatara (wynik generateDollAvatar)
     * @param  string  $garmentImageUrl  URL zdjęcia ubrania (np. z itemu w kolekcji)
     */
    public function virtualTryOn(string $avatarImageUrl, string $garmentImageUrl, array $options = []): ProcessingResult
    {
        $humanKey = config('persona_ai.vton_input_keys.human', 'human_img');
        $garmentKey = config('persona_ai.vton_input_keys.garment', 'garm_img');

        $input = array_merge($options, [
            $humanKey => $avatarImageUrl,
            $garmentKey => $garmentImageUrl,
        ]);

        return $this->runModel(
            model: config('persona_ai.replicate.vton_model'),
            version: config('persona_ai.replicate.vton_version'),
            input: $input,
        );
    }

    /**
     * @param  array<string, mixed>  $input
     */
    public function runModel(string $model, ?string $version, array $input): ProcessingResult
    {
        $token = config('persona_ai.replicate.api_token');
        if (! $token) {
            throw new PersonaVisionException(
                'Brak REPLICATE_API_TOKEN w .env. Ustaw klucz API Replicate lub zmień PERSONA_AI_PROVIDER.'
            );
        }

        $baseUrl = rtrim((string) config('persona_ai.replicate.base_url'), '/');

        try {
            if ($version) {
                $createUrl = "{$baseUrl}/models/{$model}/versions/{$version}/predictions";
            } else {
                // Najnowsza wersja modelu (owner/name bez hasha)
                $createUrl = "{$baseUrl}/models/{$model}/predictions";
            }

            $createResponse = Http::withToken($token)
                ->acceptJson()
                ->timeout(60)
                ->post($createUrl, ['input' => $input]);

            $createResponse->throw();

            $prediction = $createResponse->json();
            $predictionId = $prediction['id'] ?? null;

            if (! $predictionId) {
                throw new PersonaVisionException('Replicate nie zwrócił ID predykcji.');
            }

            $final = $this->pollPrediction($baseUrl, $token, $predictionId);

            $outputUrl = $this->extractOutputUrl($final);

            return new ProcessingResult(
                outputUrl: $outputUrl,
                predictionId: $predictionId,
                provider: 'replicate',
                raw: $final,
            );
        } catch (PersonaVisionException $e) {
            throw $e;
        } catch (RequestException $e) {
            $body = $e->response?->json();
            $message = is_array($body) ? ($body['detail'] ?? $body['error'] ?? $e->getMessage()) : $e->getMessage();
            throw new PersonaVisionException('Błąd API Replicate: '.$message, (int) $e->getCode(), $e);
        } catch (ConnectionException $e) {
            throw new PersonaVisionException('Brak połączenia z Replicate: '.$e->getMessage(), 0, $e);
        } catch (\Throwable $e) {
            throw new PersonaVisionException('Nieoczekiwany błąd Replicate: '.$e->getMessage(), 0, $e);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function pollPrediction(string $baseUrl, string $token, string $predictionId): array
    {
        $intervalMs = max(500, (int) config('persona_ai.poll_interval_ms', 1500));
        $timeoutSeconds = max(30, (int) config('persona_ai.poll_timeout_seconds', 300));
        $deadline = time() + $timeoutSeconds;

        while (time() < $deadline) {
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout(30)
                ->get("{$baseUrl}/predictions/{$predictionId}");

            $response->throw();

            $data = $response->json();
            $status = $data['status'] ?? 'unknown';

            if ($status === 'succeeded') {
                return $data;
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $error = $data['error'] ?? 'Predykcja nie powiodła się.';
                throw new PersonaVisionException("Replicate ({$status}): {$error}");
            }

            usleep($intervalMs * 1000);
        }

        throw new PersonaVisionException(
            "Przekroczono czas oczekiwania na wynik Replicate ({$timeoutSeconds}s)."
        );
    }

    /**
     * @param  array<string, mixed>  $prediction
     */
    private function extractOutputUrl(array $prediction): string
    {
        $output = $prediction['output'] ?? null;

        if (is_string($output) && filter_var($output, FILTER_VALIDATE_URL)) {
            return $output;
        }

        if (is_array($output)) {
            foreach ($output as $item) {
                if (is_string($item) && filter_var($item, FILTER_VALIDATE_URL)) {
                    return $item;
                }
            }
        }

        throw new PersonaVisionException('Replicate zwrócił nieoczekiwany format output (brak URL obrazu).');
    }
}
