<?php

/**
 * Fashion AI — credentials live on Backend Settings (model-assistant :8190).
 *
 * Laravel only reads runtime credentials over HTTP.
 */
return [

    'model_assistant_url' => rtrim(
        (string) env('MODEL_ASSISTANT_URL', 'http://model-assistant:8080'),
        '/'
    ),

    'internal_token' => env('FASHION_AI_INTERNAL_TOKEN', ''),

    'timeout_seconds' => (int) env('FASHION_AI_TIMEOUT_SECONDS', 10),

];
