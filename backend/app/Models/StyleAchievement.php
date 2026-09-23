<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StyleAchievement extends Model
{
    protected $fillable = [
        'code',
        'title',
        'description',
        'icon',
        'rule',
        'xp_bonus',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'rule' => 'array',
        'xp_bonus' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function unlocks(): HasMany
    {
        return $this->hasMany(StyleAchievementUnlock::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
