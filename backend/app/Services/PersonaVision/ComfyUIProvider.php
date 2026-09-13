<?php

namespace App\Services\PersonaVision;

use App\Exceptions\PersonaVisionException;
use App\Services\PersonaVision\DTO\ProcessingResult;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Klient ComfyUI API — lokalnie (natywnie na Macu MPS lub opcjonalnie kontener docker-comfyui).
 *
 * Zdjęcia: katalog comfyui-exchange/input/persona (współdzielony z hostem).
 * Mac: ./scripts/start-comfyui-native.sh — backend: COMFYUI_BASE_URL=http://host.docker.internal:8188
 */
class ComfyUIProvider
{
    public function __construct(
        private readonly ComfyUIWorkflowBuilder $workflows,
    ) {
    }

    public function isConfigured(): bool
    {
        try {
            $this->healthCheck();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function healthCheck(): void
    {
        $response = Http::timeout(5)->get($this->baseUrl().'/system_stats');

        if (! $response->successful()) {
            throw new PersonaVisionException('ComfyUI nie odpowiada na /system_stats.');
        }
    }

    /**
     * Awatar „lalka 3D” — workflow avatar.api.json (podmień na SD+ControlNet w ComfyUI).
     *
     * @param  string  $localImagePath  Absolutna ścieżka do zdjęcia użytkownika na dysku Laravela
     */
    public function generateDollAvatar(string $localImagePath, array $options = []): ProcessingResult
    {
        $stagedName = $this->stageInputImage($localImagePath);

        $map = config('persona_ai.comfyui.node_map.avatar', []);
        $defaults = config('persona_ai.comfyui.avatar_defaults', []);

        $workflow = $this->workflows->load('avatar');

        $nodeInputs = [
            ($map['load_image'] ?? '10') => ['image' => $stagedName],
        ];

        if (! empty($map['positive'])) {
            $nodeInputs[$map['positive']] = [
                'text' => $options['prompt'] ?? $defaults['prompt'] ?? '',
            ];
        }

        if (! empty($map['negative'])) {
            $nodeInputs[$map['negative']] = [
                'text' => $options['negative_prompt'] ?? $defaults['negative_prompt'] ?? '',
            ];
        }

        $workflow = $this->workflows->inject($workflow, $nodeInputs);

        return $this->runWorkflow($workflow, 'avatar');
    }

    /**
     * Virtual try-on — workflow vton.api.json (IDM-VTON po instalacji custom nodes).
     */
    public function virtualTryOn(
        string $localAvatarPath,
        string $localGarmentPath,
        array $options = []
    ): ProcessingResult {
        $humanName = $this->stageInputImage($localAvatarPath, 'human');
        $garmentName = $this->stageInputImage($localGarmentPath, 'garment');

        $map = config('persona_ai.comfyui.node_map.vton', []);

        $workflow = $this->workflows->load('vton');
        $inject = [];

        if (! empty($map['load_human'])) {
            $inject[$map['load_human']] = ['image' => $humanName];
        }
        if (! empty($map['load_garment'])) {
            $inject[$map['load_garment']] = ['image' => $garmentName];
        }

        $workflow = $this->workflows->inject($workflow, $inject);

        return $this->runWorkflow($workflow, 'vton');
    }

    // -------------------------------------------------------------------------
    // Staging — pliki trafiają do volume współdzielonego z ComfyUI
    // -------------------------------------------------------------------------

    public function stageInputImage(string $absolutePath, string $suffix = 'src'): string
    {
        if (! is_readable($absolutePath)) {
            throw new PersonaVisionException("Nie można odczytać pliku: {$absolutePath}");
        }

        $exchangeDir = $this->exchangeInputDir();
        $ext = pathinfo($absolutePath, PATHINFO_EXTENSION) ?: 'png';
        $filename = sprintf(
            '%s_%s.%s',
            $suffix,
            Str::uuid()->toString(),
            strtolower($ext)
        );

        $target = $exchangeDir.DIRECTORY_SEPARATOR.$filename;

        if (! copy($absolutePath, $target)) {
            throw new PersonaVisionException('Nie udało się skopiować obrazu do wymiany ComfyUI.');
        }

        // Volume → ComfyUI/input/persona/ — w LoadImage ścieżka względem katalogu input.
        return 'persona/'.$filename;
    }

    /**
     * Pobiera obraz z URL do pliku tymczasowego (wewnątrz sieci Docker — np. storage backendu).
     */
    public function downloadToTemp(string $url): string
    {
        try {
            $response = Http::timeout(60)->get($url);
            $response->throw();

            $tmp = tempnam(sys_get_temp_dir(), 'persona_');
            $path = $tmp.'.png';
            rename($tmp, $path);
            file_put_contents($path, $response->body());

            return $path;
        } catch (RequestException|ConnectionException $e) {
            throw new PersonaVisionException('Nie udało się pobrać obrazu: '.$e->getMessage(), 0, $e);
        }
    }

    // -------------------------------------------------------------------------
    // ComfyUI queue + polling
    // -------------------------------------------------------------------------

    /**
     * @param  array<string, mixed>  $workflow
     */
    private function runWorkflow(array $workflow, string $label): ProcessingResult
    {
        try {
            $clientId = (string) Str::uuid();

            $queueResponse = Http::timeout(30)
                ->acceptJson()
                ->post($this->baseUrl().'/prompt', [
                    'prompt' => $workflow,
                    'client_id' => $clientId,
                    'unload_models' => true,
                ]);

            $queueResponse->throw();

            $promptId = $queueResponse->json('prompt_id');

            if (! $promptId) {
                throw new PersonaVisionException('ComfyUI nie zwrócił prompt_id.');
            }

            $history = $this->waitForCompletion($promptId);

            $outputFile = $this->extractFirstOutputImage($history);
            $publicUrl = $this->persistOutputLocally($outputFile, $label);

            return new ProcessingResult(
                outputUrl: $publicUrl,
                predictionId: $promptId,
                provider: 'comfyui',
                raw: ['history' => $history, 'comfy_output' => $outputFile],
            );
        } catch (PersonaVisionException $e) {
            throw $e;
        } catch (RequestException $e) {
            $detail = $e->response?->json('error')
                ?? $e->response?->json()
                ?? $e->response?->body()
                ?? $e->getMessage();

            if (is_array($detail)) {
                $detail = json_encode($detail, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            throw new PersonaVisionException(
                'Błąd ComfyUI API: '.(string) $detail,
                (int) $e->getCode(),
                $e
            );
        } catch (ConnectionException $e) {
            throw new PersonaVisionException(
                'Brak połączenia z ComfyUI ('.$this->baseUrl().'). Mac: ./scripts/start-comfyui-native.sh',
                0,
                $e
            );
        } catch (\Throwable $e) {
            throw new PersonaVisionException('ComfyUI: '.$e->getMessage(), 0, $e);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function waitForCompletion(string $promptId): array
    {
        $intervalMs = max(500, (int) config('persona_ai.poll_interval_ms', 1500));
        $timeoutSeconds = max(60, (int) config('persona_ai.poll_timeout_seconds', 600));
        $deadline = time() + $timeoutSeconds;

        while (time() < $deadline) {
            $response = Http::timeout(30)->get($this->baseUrl().'/history/'.$promptId);

            if ($response->successful()) {
                $history = $response->json();

                if (! empty($history[$promptId])) {
                    $entry = $history[$promptId];
                    $status = $entry['status'] ?? null;

                    if (! empty($entry['outputs'])) {
                        return $entry;
                    }

                    if ($status && str_contains((string) $status, 'error')) {
                        throw new PersonaVisionException('ComfyUI zgłosił błąd wykonania workflow.');
                    }
                }
            }

            usleep($intervalMs * 1000);
        }

        throw new PersonaVisionException(
            "Przekroczono czas oczekiwania ComfyUI ({$timeoutSeconds}s)."
        );
    }

    /**
     * @param  array<string, mixed>  $historyEntry
     * @return array{filename: string, subfolder: string, type: string}
     */
    private function extractFirstOutputImage(array $historyEntry): array
    {
        $outputs = $historyEntry['outputs'] ?? [];

        foreach ($outputs as $nodeOutput) {
            $images = $nodeOutput['images'] ?? [];

            foreach ($images as $image) {
                if (! empty($image['filename'])) {
                    return [
                        'filename' => $image['filename'],
                        'subfolder' => $image['subfolder'] ?? '',
                        'type' => $image['type'] ?? 'output',
                    ];
                }
            }
        }

        throw new PersonaVisionException(
            'ComfyUI zakończył workflow, ale nie zwrócił obrazu wyjściowego.'
        );
    }

    /**
     * Pobiera wynik z ComfyUI /view i zapisuje w public storage Laravela.
     *
     * @param  array{filename: string, subfolder: string, type: string}  $file
     */
    private function persistOutputLocally(array $file, string $label): string
    {
        $response = Http::timeout(120)->get($this->baseUrl().'/view', [
            'filename' => $file['filename'],
            'subfolder' => $file['subfolder'],
            'type' => $file['type'],
        ]);

        $response->throw();

        $path = 'persona-ai/results/'.$label.'/'.date('Y/m').'/'.
            pathinfo($file['filename'], PATHINFO_FILENAME).'_'.Str::uuid()->toString().'.png';

        Storage::disk('public')->put($path, $response->body());

        return Storage::disk('public')->url($path);
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('persona_ai.comfyui.base_url'), '/');
    }

    private function exchangeInputDir(): string
    {
        $dir = (string) config('persona_ai.comfyui.exchange_input_path');

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }
}
