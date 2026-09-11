<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LangfuseTraceService;
use Illuminate\Http\Request;

class ProductImportTraceController extends Controller
{
    public function reportSelection(Request $request, LangfuseTraceService $langfuse)
    {
        $validated = $request->validate([
            'trace_id' => 'required|string|max:64',
            'source_url' => 'nullable|url|max:2048',
            'selected' => 'required|array|max:16',
            'selected.*.catalog_index' => 'nullable|integer|min:1',
            'selected.*.selection_order' => 'nullable|integer|min:1',
            'selected.*.url' => 'required|url|max:2048',
            'selected.*.view_hint' => 'nullable|string|max:64',
            'selected.*.is_pair' => 'nullable|boolean',
            'gallery_count' => 'nullable|integer|min:0|max:16',
        ]);

        if ($langfuse->enabled()) {
            $langfuse->span(
                $validated['trace_id'],
                'item.import.gallery_selection',
                [
                    'source_url' => $validated['source_url'] ?? null,
                    'selected' => $validated['selected'],
                ],
                [
                    'gallery_count' => $validated['gallery_count'] ?? count($validated['selected']),
                    'selected_count' => count($validated['selected']),
                ],
                ['phase' => 'frontend'],
            );
        }

        return response()->json([
            'ok' => true,
            'trace_id' => $validated['trace_id'],
            'trace_url' => $langfuse->uiTraceUrl($validated['trace_id']),
        ]);
    }
}
