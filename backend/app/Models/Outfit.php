<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class Outfit extends Model
{
    use BelongsToUser;

    public const SOURCES = ['manual', 'llm'];

    public const OCCASIONS = [
        'school',
        'work',
        'home',
        'outing',
        'sport',
        'formal',
        'casual',
        'travel',
    ];

    /**
     * Map free-text / AI occasion labels to a stored enum value.
     */
    public static function normalizeOccasion(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $raw = trim((string) $value);
        if ($raw === '') {
            return null;
        }

        $lower = mb_strtolower($raw);
        if (in_array($lower, self::OCCASIONS, true)) {
            return $lower;
        }

        $compact = $lower;
        if (class_exists(\Normalizer::class)) {
            $compact = \Normalizer::normalize($compact, \Normalizer::FORM_D) ?: $compact;
        }
        $compact = preg_replace('/\p{M}/u', '', $compact) ?? $compact;
        $compact = str_replace('ł', 'l', $compact);

        $aliases = [
            'szkola' => 'school',
            'school' => 'school',
            'work' => 'work',
            'office' => 'work',
            'biuro' => 'work',
            'praca' => 'work',
            'home' => 'home',
            'dom' => 'home',
            'outing' => 'outing',
            'going out' => 'outing',
            'wyjscie' => 'outing',
            'sport' => 'sport',
            'gym' => 'sport',
            'formal' => 'formal',
            'elegant' => 'formal',
            'gala' => 'formal',
            'wedding' => 'formal',
            'wesele' => 'formal',
            'casual' => 'casual',
            'everyday' => 'casual',
            'codzienny' => 'casual',
            'travel' => 'travel',
            'podroz' => 'travel',
        ];

        if (isset($aliases[$compact])) {
            return $aliases[$compact];
        }
        if (isset($aliases[$lower])) {
            return $aliases[$lower];
        }

        foreach (self::OCCASIONS as $occasion) {
            if (str_contains($compact, $occasion) || str_contains($lower, $occasion)) {
                return $occasion;
            }
        }

        foreach ($aliases as $alias => $canonical) {
            if (strlen($alias) >= 4 && (str_contains($compact, $alias) || str_contains($lower, $alias))) {
                return $canonical;
            }
        }

        return null;
    }

    protected $fillable = [
        'user_id',
        'entity_id',
        'wear_date',
        'label',
        'occasion',
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
