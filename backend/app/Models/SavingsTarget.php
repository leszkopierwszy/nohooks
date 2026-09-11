<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavingsTarget extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'type',
        'amount',
        'color',
        'is_primary',
        'included_asset_ids',
        'progress_snapshots',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'is_primary' => 'boolean',
            'included_asset_ids' => 'array',
            'progress_snapshots' => 'array',
            'sort_order' => 'integer',
        ];
    }
}
