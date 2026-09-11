<?php

namespace App\Services\PersonaVision;

use App\Exceptions\PersonaVisionException;
use App\Models\Entity;
use App\Services\PersonaVision\DTO\ProcessingResult;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Persona Image Processing — awatar 3D + virtual try-on.
 *
 * Domyślnie: ComfyUI w kontenerze Docker (COMFYUI_BASE_URL=http://comfyui:8188).
 * Zdjęcia nie opuszczają stacku — wspólny volume comfyui-exchange.
 */
class PersonaImageProcessingService
{
    public function __construct(
        private readonly ComfyUIProvider $comfyui,
        private readonly ReplicateProvider $replicate,
    ) {
    }

    public function providerName(): string
    {
        return (string) config('persona_ai.default_provider', 'comfyui');
    }

    public function isConfigured(): bool
    {
        return match ($this->providerName()) {
            'comfyui' => $this->comfyui->isConfigured(),
            'replicate' => $this->replicate->isConfigured(),
            default => false,
        };
    }

    public function generateAvatarFromUserPhoto(
        string|UploadedFile $source,
        array $options = []
    ): ProcessingResult {
        $entityId = $options['entity_id'] ?? null;
        unset($options['entity_id']);

        try {
            $localPath = $this->resolveSourceToLocalPath($source);

            if ($entityId) {
                $this->persistSourcePhoto((int) $entityId, $source, $localPath);
            }

            $result = $this->dispatchAvatarGeneration($localPath, $options);

            if ($entityId) {
                $this->persistGeneratedAvatar((int) $entityId, $result->outputUrl);
            }

            return $result;
        } catch (PersonaVisionException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new PersonaVisionException(
                'Generowanie awatara nie powiodło się: '.$e->getMessage(),
                0,
                $e
            );
        }
    }

    public function virtualTryOn(
        string $avatarImageUrl,
        string $garmentImageUrl,
        array $options = []
    ): ProcessingResult {
        $entityId = $options['entity_id'] ?? null;
        $itemId = $options['item_id'] ?? null;
        unset($options['entity_id'], $options['item_id']);

        try {
            $avatarPath = $this->resolveUrlOrPathToLocal($avatarImageUrl);
            $garmentPath = $this->resolveUrlOrPathToLocal($garmentImageUrl);

            $result = $this->dispatchVirtualTryOn($avatarPath, $garmentPath, $options);

            if ($entityId) {
                $this->recordTryOnSession(
                    (int) $entityId,
                    $avatarImageUrl,
                    $garmentImageUrl,
                    $result,
                    $itemId
                );
            }

            return $result;
        } catch (PersonaVisionException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new PersonaVisionException(
                'Virtual try-on nie powiódł się: '.$e->getMessage(),
                0,
                $e
            );
        }
    }

    public function virtualTryOnForEntity(
        Entity $entity,
        string $garmentImageUrl,
        array $options = []
    ): ProcessingResult {
        $avatarRef = $entity->avatar_doll_url ?? $entity->avatar_source_url;

        if (! $avatarRef) {
            throw new PersonaVisionException(
                'Persona nie ma zapisanego awatara. Najpierw wygeneruj awatar ze zdjęcia.'
            );
        }

        $options['entity_id'] = $entity->id;

        return $this->virtualTryOn($avatarRef, $garmentImageUrl, $options);
    }

    private function dispatchAvatarGeneration(string $localPath, array $options): ProcessingResult
    {
        return match ($this->providerName()) {
            'comfyui' => $this->comfyui->generateDollAvatar($localPath, $options),
            'replicate' => $this->replicate->generateDollAvatar(
                $this->ensurePublicUrl($localPath),
                $options
            ),
            default => throw new PersonaVisionException(
                "Nieobsługiwany PERSONA_AI_PROVIDER: {$this->providerName()}"
            ),
        };
    }

    private function dispatchVirtualTryOn(
        string $avatarPath,
        string $garmentPath,
        array $options
    ): ProcessingResult {
        return match ($this->providerName()) {
            'comfyui' => $this->comfyui->virtualTryOn($avatarPath, $garmentPath, $options),
            'replicate' => $this->replicate->virtualTryOn(
                $this->ensurePublicUrl($avatarPath),
                $this->ensurePublicUrl($garmentPath),
                $options
            ),
            default => throw new PersonaVisionException(
                "Nieobsługiwany PERSONA_AI_PROVIDER: {$this->providerName()}"
            ),
        };
    }

    /**
     * Plik uploadowany lub ścieżka lokalna — bez wysyłki na zewnętrzne API.
     */
    public function resolveSourceToLocalPath(string|UploadedFile $source): string
    {
        if ($source instanceof UploadedFile) {
            $path = $source->getRealPath();
            if ($path && is_readable($path)) {
                return $path;
            }

            throw new PersonaVisionException('Nie udało się odczytać przesłanego pliku.');
        }

        $source = trim($source);

        if ($source !== '' && is_readable($source)) {
            return $source;
        }

        if (filter_var($source, FILTER_VALIDATE_URL)) {
            return $this->comfyui->downloadToTemp($source);
        }

        throw new PersonaVisionException(
            'Źródło musi być plikiem lub ścieżką/URL do obrazu.'
        );
    }

    private function resolveUrlOrPathToLocal(string $ref): string
    {
        $ref = trim($ref);

        if ($ref !== '' && is_readable($ref)) {
            return $ref;
        }

        if (filter_var($ref, FILTER_VALIDATE_URL)) {
            // URL z własnego storage (backend) — pobierz wewnątrz sieci
            return $this->comfyui->downloadToTemp($ref);
        }

        throw new PersonaVisionException("Nie można odczytać obrazu: {$ref}");
    }

    /** Dla providera replicate — tymczasowy publiczny URL. */
    private function ensurePublicUrl(string $localPath): string
    {
        if (filter_var($localPath, FILTER_VALIDATE_URL)) {
            return $localPath;
        }

        $path = Storage::disk('public')->putFile(
            'persona-ai/tmp',
            new \Illuminate\Http\File($localPath)
        );

        return Storage::disk('public')->url($path);
    }

    private function persistSourcePhoto(int $entityId, string|UploadedFile $source, string $localPath): void
    {
        $entity = Entity::query()->find($entityId);
        if (! $entity) {
            return;
        }

        $stored = Storage::disk('public')->putFile(
            'persona-ai/sources/'.date('Y/m'),
            new \Illuminate\Http\File($localPath)
        );

        $entity->avatar_source_url = Storage::disk('public')->url($stored);
        $entity->save();
    }

    private function persistGeneratedAvatar(int $entityId, string $dollUrl): void
    {
        $entity = Entity::query()->find($entityId);
        if (! $entity) {
            return;
        }

        $entity->avatar_doll_url = $dollUrl;
        $entity->avatar_generated_at = now();
        $entity->save();
    }

    private function recordTryOnSession(
        int $entityId,
        string $avatarUrl,
        string $garmentUrl,
        ProcessingResult $result,
        ?int $itemId = null
    ): void {
        if (! class_exists(\App\Models\EntityTryOn::class)) {
            return;
        }

        \App\Models\EntityTryOn::query()->create([
            'entity_id' => $entityId,
            'item_id' => $itemId,
            'avatar_image_url' => $avatarUrl,
            'garment_image_url' => $garmentUrl,
            'result_image_url' => $result->outputUrl,
            'provider' => $result->provider,
            'prediction_id' => $result->predictionId,
        ]);
    }
}
