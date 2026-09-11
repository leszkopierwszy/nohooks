<?php

namespace App\Services\PersonaVision\DTO;

/**
 * Wynik operacji AI (awatar lub try-on).
 */
final class ProcessingResult
{
    public function __construct(
        public readonly string $outputUrl,
        public readonly ?string $predictionId = null,
        public readonly string $provider = 'replicate',
        public readonly array $raw = [],
    ) {
    }

    public function toArray(): array
    {
        return [
            'output_url' => $this->outputUrl,
            'prediction_id' => $this->predictionId,
            'provider' => $this->provider,
        ];
    }
}
