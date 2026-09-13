<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class Outfit extends Model
{
    use BelongsToUser;

    public const SOURCES = ['manual', 'llm'];

    protected $fillable = [
        'user_id',
        'entity_id',
        'wear_date',
        'label',
        'notes',
        'source',
    ];

    protected $casts = [
        'wear_date' => 'date:Y-m-d',
    ];

    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'outfit_item')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }
}
