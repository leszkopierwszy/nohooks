<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class SavingsTarget extends Model
{
    use BelongsToUser;

    /** Surrogate primary key (pk); logical business id stays in `id`. */
    protected $primaryKey = 'pk';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
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

    public function getRouteKeyName(): string
    {
        return 'id';
    }
}
