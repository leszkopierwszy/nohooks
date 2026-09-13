<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'user_id',
        'name',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
