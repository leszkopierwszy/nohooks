<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemImage;
use App\Services\ItemImageOrientationService;
use Illuminate\Http\Request;

class ItemImageController extends Controller
{
    public function orientToRight(
        Request $request,
        Item $item,
        ItemImage $itemImage,
        ItemImageOrientationService $orientation
    ) {
        if ((int) $itemImage->item_id !== (int) $item->id) {
            abort(404);
        }

        $validated = $request->validate([
            'force' => 'sometimes|boolean',
        ]);

        $result = $orientation->orientToRight($itemImage, (bool) ($validated['force'] ?? false));

        return response()->json([
            ...$result,
            'image' => $itemImage->fresh(),
        ]);
    }

    public function detectFacing(Item $item, ItemImage $itemImage, ItemImageOrientationService $orientation)
    {
        if ((int) $itemImage->item_id !== (int) $item->id) {
            abort(404);
        }

        return response()->json($orientation->detectFacingForImage($itemImage));
    }
}
