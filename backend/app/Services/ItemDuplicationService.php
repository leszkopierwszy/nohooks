<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ItemDuplicationService
{
    /** @var list<string> */
    private const COPY_ATTRIBUTES = [
        'user_id',
        'entity_id',
        'fits_all_personas',
        'fits_persona_ids',
        'default_persona_id',
        'character_id',
        'rarity',
        'like_rating',
        'brand',
        'category',
        'description',
        'color',
        'colors',
        'season',
        'size',
        'size_system',
        'category_id',
        'body_zone',
        'wear_layer',
        'garment_attributes',
        'purchase_price',
        'purchase_currency',
        'purchase_price_pln',
        'current_value',
        'purchase_date',
        'status',
        'notes',
        'gift',
        'source_url',
    ];

    public function duplicate(Item $source): Item
    {
        $source->loadMissing('images');

        $attributes = $source->only(self::COPY_ATTRIBUTES);
        $attributes['name'] = $this->copyName($source->name);

        $copy = Item::create($attributes);

        foreach ($source->images as $image) {
            $this->duplicateImage($copy, $image);
        }

        return $copy->fresh(['entity', 'character', 'images', 'defaultPersona', 'collectionGroup']);
    }

    private function copyName(?string $name): string
    {
        $base = trim((string) $name);
        if ($base === '') {
            return 'Kopia itemu';
        }

        if (preg_match('/\s+\(kopia(?:\s+\d+)?\)$/iu', $base)) {
            return $base;
        }

        return $base.' (kopia)';
    }

    private function duplicateImage(Item $copy, ItemImage $image): void
    {
        $data = [
            'item_id' => $copy->id,
            'sort_order' => $image->sort_order,
            'image_path' => null,
            'external_url' => null,
            'cutout_path' => null,
        ];

        if ($image->image_path && Storage::disk('public')->exists($image->image_path)) {
            $extension = pathinfo($image->image_path, PATHINFO_EXTENSION) ?: 'jpg';
            $destination = 'items/'.Str::uuid().'.'.strtolower($extension);

            Storage::disk('public')->copy($image->image_path, $destination);
            $data['image_path'] = $destination;
        } elseif ($image->external_url) {
            $data['external_url'] = $image->external_url;
        } else {
            return;
        }

        if ($image->cutout_path && Storage::disk('public')->exists($image->cutout_path)) {
            $extension = pathinfo($image->cutout_path, PATHINFO_EXTENSION) ?: 'png';
            $destination = 'items/cutouts/'.Str::uuid().'.'.strtolower($extension);

            Storage::disk('public')->copy($image->cutout_path, $destination);
            $data['cutout_path'] = $destination;
        }

        $copy->images()->create($data);
    }
}
