<?php

/**
 * Persona Vision — przetwarzanie zdjęć persony (awatar 3D + virtual try-on).
 *
 * Domyślnie: ComfyUI w kontenerze Docker (dane nie wychodzą na zewnątrz).
 *
 * W .env:
 *   PERSONA_AI_PROVIDER=comfyui
 *   COMFYUI_BASE_URL=http://comfyui:8188
 *
 * Opcjonalnie (zewnętrzne API — wyłączone domyślnie):
 *   PERSONA_AI_PROVIDER=replicate
 *   REPLICATE_API_TOKEN=...
 */
return [

    'default_provider' => env('PERSONA_AI_PROVIDER', 'comfyui'),

    'poll_interval_ms' => (int) env('PERSONA_AI_POLL_INTERVAL_MS', 1500),

    'poll_timeout_seconds' => (int) env('PERSONA_AI_POLL_TIMEOUT_SECONDS', 600),

    'comfyui' => [
        'base_url' => env('COMFYUI_BASE_URL', 'http://comfyui:8188'),

        // Ścieżka do workflow API (w kontenerze backendu = mount z repo)
        'workflows_path' => env(
            'COMFYUI_WORKFLOWS_PATH',
            '/var/www/comfyui/workflows'
        ),

        // Katalog współdzielony z kontenerem ComfyUI (input/persona)
        'exchange_input_path' => env(
            'COMFYUI_EXCHANGE_INPUT_PATH',
            storage_path('app/comfyui-exchange')
        ),

        'avatar_defaults' => [
            'prompt' => env('PERSONA_AI_AVATAR_PROMPT',
                '3D Barbie doll style character, glossy plastic skin, fashion doll proportions, '
                .'studio lighting, clean background, highly detailed, cute face, maintain exact pose from reference'
            ),
            'negative_prompt' => env('PERSONA_AI_AVATAR_NEGATIVE_PROMPT',
                'blurry, low quality, deformed, extra limbs, realistic photo, grain, watermark, text'
            ),
        ],

        // ID węzłów w plikach comfyui/workflows/*.api.json (po eksporcie z ComfyUI → Save API)
        'node_map' => [
            'avatar' => [
                'load_image' => env('COMFYUI_AVATAR_NODE_LOAD', '10'),
                'positive' => env('COMFYUI_AVATAR_NODE_POSITIVE', ''),
                'negative' => env('COMFYUI_AVATAR_NODE_NEGATIVE', ''),
                'save_image' => env('COMFYUI_AVATAR_NODE_SAVE', '11'),
            ],
            'vton' => [
                'load_human' => env('COMFYUI_VTON_NODE_HUMAN', '20'),
                'load_garment' => env('COMFYUI_VTON_NODE_GARMENT', '21'),
                'save_image' => env('COMFYUI_VTON_NODE_SAVE', '22'),
            ],
        ],
    ],

    'replicate' => [
        'api_token' => env('REPLICATE_API_TOKEN'),
        'base_url' => env('REPLICATE_API_BASE', 'https://api.replicate.com/v1'),
        'avatar_model' => env('REPLICATE_AVATAR_MODEL', 'xlabs-ai/flux-dev-controlnet'),
        'avatar_version' => env('REPLICATE_AVATAR_VERSION'),
        'vton_model' => env('REPLICATE_VTON_MODEL', 'yisol/idm-vton'),
        'vton_version' => env('REPLICATE_VTON_VERSION'),
        'avatar_defaults' => [
            'control_type' => env('PERSONA_AI_CONTROL_TYPE', 'openpose'),
            'prompt' => env('PERSONA_AI_AVATAR_PROMPT', ''),
            'negative_prompt' => env('PERSONA_AI_AVATAR_NEGATIVE_PROMPT', ''),
        ],
    ],

    'vton_input_keys' => [
        'human' => env('PERSONA_AI_VTON_HUMAN_KEY', 'human_img'),
        'garment' => env('PERSONA_AI_VTON_GARMENT_KEY', 'garm_img'),
    ],

];
