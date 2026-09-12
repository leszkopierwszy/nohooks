<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'user_id',
        'slug',
        'name',
        'is_builtin',
    ];

    protected $casts = [
        'is_builtin' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('visible_to_auth_user', function (Builder $builder) {
            if (! auth()->check()) {
                return;
            }

            $builder->where(function (Builder $q) {
                $q->where('is_builtin', true)
                    ->orWhere('user_id', auth()->id());
            });
        });

        static::creating(function (Model $model) {
            if ($model->getAttribute('is_builtin')) {
                $model->setAttribute('user_id', null);

                return;
            }
            if ($model->getAttribute('user_id') === null && auth()->check()) {
                $model->setAttribute('user_id', auth()->id());
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
