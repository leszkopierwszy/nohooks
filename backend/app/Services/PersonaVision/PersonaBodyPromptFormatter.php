<?php

namespace App\Services\PersonaVision;

use App\Models\EntityBodySnapshot;

/**
 * Formatuje ostatni snapshot ciała persony (Entity) jako blok tekstu do promptu ComfyUI.
 */
class PersonaBodyPromptFormatter
{
    public function format(?EntityBodySnapshot $snapshot): string
    {
        if ($snapshot === null) {
            return '';
        }

        $lines = ['Body measurements and appearance (use for realistic proportions):'];

        $this->line($lines, 'Height', $snapshot->height_cm, 'cm');
        $this->line($lines, 'Weight', $snapshot->weight_kg, 'kg');
        $this->line($lines, 'Chest', $snapshot->chest_cm, 'cm');
        $this->line($lines, 'Waist', $snapshot->waist_cm, 'cm');
        $this->line($lines, 'Hips', $snapshot->hips_cm, 'cm');
        $this->line($lines, 'Shoulders', $snapshot->shoulder_cm, 'cm');
        $this->line($lines, 'Inseam', $snapshot->inseam_cm, 'cm');

        if (! empty($snapshot->skin_tone)) {
            $lines[] = 'Skin tone: '.$snapshot->skin_tone;
        }

        if (! empty($snapshot->notes)) {
            $lines[] = 'Notes: '.$snapshot->notes;
        }

        if (count($lines) === 1) {
            return '';
        }

        return implode("\n", $lines);
    }

    /**
     * @param  list<string>  $lines
     */
    private function line(array &$lines, string $label, mixed $value, string $unit): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $formatted = is_numeric($value)
            ? rtrim(rtrim(number_format((float) $value, 1, '.', ''), '0'), '.')
            : (string) $value;

        $lines[] = "{$label}: {$formatted} {$unit}";
    }
}
