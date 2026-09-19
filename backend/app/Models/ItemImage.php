<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemImage extends Model
{
    protected $fillable = [
        'item_id',
        'image_path',
        'external_url',
        'cutout_path',
        'sort_order',
    ];

    protected $appends = [
        'url',
        'cutout_url',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function getUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return '/storage/'.ltrim($this->image_path, '/');
        }

        return $this->external_url;
    }

    public function getCutoutUrlAttribute(): ?string
    {
        if (!$this->cutout_path) {
            return null;
        }

        return '/storage/'.ltrim($this->cutout_path, '/');
    }
}
