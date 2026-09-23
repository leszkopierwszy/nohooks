<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StyleModule extends Model
{
    public const MODE_AUTO = 'auto';

    public const MODE_MANUAL = 'manual';

    protected $fillable = [
        'title',
        'description',
        'sort_order',
        'is_active',
        'gender',
        'xp_reward',
        'completion_mode',
        'requirements',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'xp_reward' => 'integer',
        'requirements' => 'array',
    ];

    public function completions(): HasMany
    {
        return $this->hasMany(StyleModuleCompletion::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVisibleForGender($query, ?string $gender)
    {
        $g = $gender ? strtolower(trim($gender)) : null;
        if (! in_array($g, ['female', 'male'], true)) {
            return $query->whereNull('gender');
        }

        return $query->where(function ($q) use ($g) {
            $q->whereNull('gender')->orWhere('gender', $g);
        });
    }
}
