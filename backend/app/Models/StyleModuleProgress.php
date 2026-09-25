<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StyleModuleProgress extends Model
{
    protected $table = 'style_module_progress';

    protected $fillable = [
        'user_id',
        'entity_id',
        'style_module_id',
        'checklist',
    ];

    protected $casts = [
        'checklist' => 'array',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(StyleModule::class, 'style_module_id');
    }
}
