<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public site name
    |--------------------------------------------------------------------------
    |
    | Shown on the marketing landing page and in the app shell.
    | Set via APP_NAME in .env (or this file). Not writable via API.
    |
    */

    'name' => env('APP_NAME', 'nohooks'),

    /*
    |--------------------------------------------------------------------------
    | Frontend origin (email verification links)
    |--------------------------------------------------------------------------
    */

    'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/'),

    /*
    |--------------------------------------------------------------------------
    | Registration email verification
    |--------------------------------------------------------------------------
    |
    | When false (default), register returns a Sanctum token immediately.
    | When true, a verification email is sent and login is blocked until
    | the address is confirmed.
    | Set via EMAIL_VERIFICATION_ENABLED in .env. Not writable via API.
    |
    */

    'email_verification' => filter_var(
        env('EMAIL_VERIFICATION_ENABLED', false),
        FILTER_VALIDATE_BOOLEAN
    ),

];
