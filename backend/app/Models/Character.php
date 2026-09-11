<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Character extends Model
{
    //
    protected $fillable = [
        'entity_id',
        'description',
        'fname',
        'lname',
        'nickname',
        'birth_gender',
        'height',
        'weight',
        'hair_color',
        'current_hair_color',
        'hair_length',
        'hair_style',
        'hair_texture',
        'eye_color',
        'skin_color',
        'blood_type'
    ];
    public function entity()
    {
        return $this->belongsTo(Entity::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
