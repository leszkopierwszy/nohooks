<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class Capsule extends Model
{
    use BelongsToUser;

    public const PRESETS = [
        'work',
        'travel',
        'summer',
        'winter',
        'smart_casual',
        'evening',
        'custom',
    ];

    protected $fillable = [
        'user_id',
        'entity_id',
        'name',
        'preset',
        'occasion',
        'season',
        'style',
        'target_outfit_count',
        'item_limit',
    ];

    protected $casts = [
        'target_outfit_count' => 'integer',
        'item_limit' => 'integer',
    ];

    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'capsule_item')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }
}
