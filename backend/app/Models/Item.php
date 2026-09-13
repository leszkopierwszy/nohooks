<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'user_id',
        'entity_id',
        'fits_all_personas',
        'fits_persona_ids',
        'default_persona_id',
        'character_id',
        'name',
        'rarity',
        'like_rating',
        'brand',
        'category',
        'description',
        'color',
        'season',
        'size',
        'size_system',
        'category_id',
        'purchase_price',
        'purchase_currency',
        'purchase_price_pln',
        'current_value',
        'purchase_date',
        'status',
        'notes',
        'gift',
        'source_url',
    ];

    protected $casts = [
        'gift' => 'boolean',
        'fits_all_personas' => 'boolean',
        'fits_persona_ids' => 'array',
        'like_rating' => 'integer',
    ];

    protected $appends = [
        'image_url',
    ];

    public function getImageUrlAttribute(): ?string
    {
        $image = $this->relationLoaded('images')
            ? $this->images->first()
            : $this->images()->orderBy('sort_order')->first();

        return $image?->url;
    }

    public function images()
    {
        return $this->hasMany(ItemImage::class)->orderBy('sort_order');
    }

    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }

    public function defaultPersona()
    {
        return $this->belongsTo(Entity::class, 'default_persona_id');
    }

    public function fitsPersona(int $personaId): bool
    {
        if ($this->fits_all_personas) {
            return true;
        }

        $ids = array_map('intval', $this->fits_persona_ids ?? []);

        return in_array($personaId, $ids, true);
    }

    public function scopeFitsPersona($query, int $personaId)
    {
        return $query->where(function ($q) use ($personaId) {
            $q->where('fits_all_personas', true)
                ->orWhereJsonContains('fits_persona_ids', $personaId)
                ->orWhereJsonContains('fits_persona_ids', (string) $personaId);
        });
    }

    public function character()
    {
        return $this->belongsTo(Character::class);
    }

    public function collectionGroup()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function outfits()
    {
        return $this->belongsToMany(Outfit::class, 'outfit_item')
            ->withPivot('sort_order');
    }
}
