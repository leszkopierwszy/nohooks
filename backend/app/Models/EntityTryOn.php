<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntityTryOn extends Model
{
    protected $fillable = [
        'entity_id',
        'item_id',
        'avatar_image_url',
        'garment_image_url',
        'result_image_url',
        'provider',
        'prediction_id',
    ];

    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
