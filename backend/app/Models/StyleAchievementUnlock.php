<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StyleAchievementUnlock extends Model
{
    protected $fillable = [
        'user_id',
        'style_achievement_id',
        'unlocked_at',
    ];

    protected $casts = [
        'unlocked_at' => 'datetime',
    ];

    public function achievement(): BelongsTo
    {
        return $this->belongsTo(StyleAchievement::class, 'style_achievement_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
