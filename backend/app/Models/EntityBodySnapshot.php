<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EntityBodySnapshot extends Model
{
    protected $fillable = [
        'entity_id',
        'recorded_at',
        'height_cm',
        'weight_kg',
        'skin_tone',
        'chest_cm',
        'waist_cm',
        'hips_cm',
        'shoulder_cm',
        'inseam_cm',
        'custom_measurements',
        'notes',
    ];

    protected $casts = [
        'recorded_at' => 'date',
        'height_cm' => 'float',
        'weight_kg' => 'float',
        'chest_cm' => 'float',
        'waist_cm' => 'float',
        'hips_cm' => 'float',
        'shoulder_cm' => 'float',
        'inseam_cm' => 'float',
        'custom_measurements' => 'array',
    ];

    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }
}
