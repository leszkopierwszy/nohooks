<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'is_builtin',
    ];

    protected $casts = [
        'is_builtin' => 'boolean',
    ];
}
