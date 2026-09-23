<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StyleModule extends Model
{
    public const MODE_AUTO = 'auto';

    public const MODE_MANUAL = 'manual';

    public const GENDER_FEMALE = 'female';

    public const GENDER_MALE = 'male';

    public const GENDER_NONBINARY = 'nonbinary';

    public const GENDER_GAY = 'gay';

    /** @var list<string> */
    public const GENDERS = [
        self::GENDER_FEMALE,
        self::GENDER_MALE,
        self::GENDER_NONBINARY,
        self::GENDER_GAY,
    ];

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

    /**
     * Module gender tags a Prim may see (plus always unisex / null).
     * nonbinary is the backdoor: shares female + male style modules.
     *
     * @return list<string>|null null = only unisex modules
     */
    public static function moduleGendersForEntity(?string $entityGender): ?array
    {
        $g = $entityGender ? strtolower(trim($entityGender)) : null;

        return match ($g) {
            self::GENDER_FEMALE => [self::GENDER_FEMALE],
            self::GENDER_MALE => [self::GENDER_MALE],
            self::GENDER_NONBINARY => [
                self::GENDER_FEMALE,
                self::GENDER_MALE,
                self::GENDER_NONBINARY,
            ],
            self::GENDER_GAY => [self::GENDER_MALE, self::GENDER_GAY],
            default => null,
        };
    }

    public function isVisibleToEntityGender(?string $entityGender): bool
    {
        if (! $this->gender) {
            return true;
        }

        $allowed = self::moduleGendersForEntity($entityGender);

        return is_array($allowed) && in_array($this->gender, $allowed, true);
    }

    public function scopeVisibleForGender($query, ?string $gender)
    {
        $allowed = self::moduleGendersForEntity($gender);
        if ($allowed === null) {
            return $query->whereNull('gender');
        }

        return $query->where(function ($q) use ($allowed) {
            $q->whereNull('gender')->orWhereIn('gender', $allowed);
        });
    }
}
