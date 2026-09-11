<?php

namespace App\Services\PersonaVision;

use App\Exceptions\PersonaVisionException;

/**
 * Ładuje workflow w formacie API ComfyUI i wstrzykuje wejścia do węzłów.
 */
class ComfyUIWorkflowBuilder
{
    public function load(string $name): array
    {
        $path = $this->workflowPath($name);

        if (! is_readable($path)) {
            throw new PersonaVisionException("Brak workflow ComfyUI: {$path}");
        }

        $data = json_decode((string) file_get_contents($path), true);

        if (! is_array($data)) {
            throw new PersonaVisionException("Nieprawidłowy JSON workflow: {$name}");
        }

        unset($data['_meta']);

        return $data;
    }

    /**
     * @param  array<string, array<string, mixed>>  $nodeInputs  [ nodeId => [ inputKey => value ] ]
     */
    public function inject(array $workflow, array $nodeInputs): array
    {
        foreach ($nodeInputs as $nodeId => $inputs) {
            if (! isset($workflow[$nodeId])) {
                throw new PersonaVisionException(
                    "Workflow nie zawiera węzła {$nodeId}. Zaktualizuj node_map w config/persona_ai.php."
                );
            }

            $workflow[$nodeId]['inputs'] = array_merge(
                $workflow[$nodeId]['inputs'] ?? [],
                $inputs
            );
        }

        return $workflow;
    }

    private function workflowPath(string $name): string
    {
        $base = rtrim((string) config('persona_ai.comfyui.workflows_path'), '/');

        return "{$base}/{$name}.api.json";
    }
}
