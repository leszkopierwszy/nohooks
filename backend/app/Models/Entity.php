<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entity extends Model
{
    //
    protected $fillable = [
        'name',
        'description',
        'type',
        'gender',
        'species',
        'birth_date',
        'sex',
        'avatar_source_url',
        'avatar_doll_url',
        'avatar_generated_at',
    ];

    protected $casts = [
        'avatar_generated_at' => 'datetime',
        'birth_date' => 'date',
    ];
    
    public function characters()
    {
        return $this->hasMany(Character::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function bodySnapshots()
    {
        return $this->hasMany(EntityBodySnapshot::class)->orderByDesc('recorded_at')->orderByDesc('id');
    }

    public function tryOns()
    {
        return $this->hasMany(EntityTryOn::class)->latest();
    }
}
