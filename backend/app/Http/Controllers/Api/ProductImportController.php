<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LangfuseTraceService;
use App\Services\ProductPageParserService;
use Illuminate\Http\Request;

class ProductImportController extends Controller
{
    public function parseFromUrl(
        Request $request,
        ProductPageParserService $parser,
        LangfuseTraceService $langfuse,
    ) {
        $validated = $request->validate([
            'url' => 'required|url|max:2048',
            'is_footwear' => 'sometimes|boolean',
            'product_class_hint' => 'sometimes|nullable|string|max:32',
            'trace_id' => 'sometimes|nullable|string|max:64',
        ]);

        $traceId = $validated['trace_id']
            ?? $request->header('X-Langfuse-Trace-Id')
            ?? $langfuse->newTraceId();

        $data = $langfuse->runTrace(
            'item.import',
            function (string $id) use ($parser, $validated, $langfuse) {
                $parsed = $parser->parse(
                    $validated['url'],
                    (bool) ($validated['is_footwear'] ?? false),
                    $validated['product_class_hint'] ?? null,
                    $id,
                );

                $catalog = $parsed['image_catalog'] ?? null;
                if ($catalog) {
                    $langfuse->span(
                        $id,
                        'product_parser.image_catalog',
                        ['url' => $validated['url']],
                        $catalog,
                        ['service' => 'product-parser'],
                    );
                }

                return $parsed;
            },
            [
                'url' => $validated['url'],
                'is_footwear' => (bool) ($validated['is_footwear'] ?? false),
            ],
            ['flow' => 'product-import'],
            $traceId,
        );

        $data['trace_id'] = $traceId;
        $data['trace_url'] = $langfuse->uiTraceUrl($traceId);

        // Frontend używa image_urls / image_meta; pełny katalog jest w Langfuse.
        unset($data['image_catalog']);

        return response()->json($data);
    }
}
