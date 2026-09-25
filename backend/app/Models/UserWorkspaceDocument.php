<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Illuminate\Database\Eloquent\Model;

class UserWorkspaceDocument extends Model
{
    use BelongsToUser;

    protected $fillable = [
        'user_id',
        'document_key',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
