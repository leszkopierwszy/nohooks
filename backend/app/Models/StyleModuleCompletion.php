<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StyleModuleCompletion extends Model
{
    protected $fillable = [
        'user_id',
        'entity_id',
        'style_module_id',
        'completed_at',
        'xp_awarded',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'xp_awarded' => 'integer',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(StyleModule::class, 'style_module_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function entity(): BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }
}
