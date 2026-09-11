<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RemoteImageImportService;
use Illuminate\Http\Request;
use RuntimeException;

class MediaController extends Controller
{
    public function importFromUrl(Request $request, RemoteImageImportService $importer)
    {
        $validated = $request->validate([
            'url' => 'required|url|max:2048',
        ]);

        try {
            $result = $importer->import($validated['url']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $path = parse_url($result['resolved_url'], PHP_URL_PATH) ?? '';
        $basename = basename($path) ?: 'imported.jpg';
        if (! preg_match('/\.(jpe?g|png|webp|gif)$/i', $basename)) {
            $ext = match ($result['mime']) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                default => 'jpg',
            };
            $basename = 'imported.'.$ext;
        }

        return response()->json([
            'mime' => $result['mime'],
            'filename' => $basename,
            'resolved_url' => $result['resolved_url'],
            'data_base64' => base64_encode($result['binary']),
        ]);
    }
}
