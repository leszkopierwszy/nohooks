<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class ConfigController extends Controller
{
    /**
     * Read-only public bootstrap from config/site.php + config/landing.php.
     * Nothing here is writable via API.
     */
    public function show()
    {
        return response()->json([
            'appName' => (string) config('site.name', 'nohooks'),
            'emailVerificationRequired' => (bool) config('site.email_verification', false),
            'landing' => config('landing', []),
        ]);
    }
}
