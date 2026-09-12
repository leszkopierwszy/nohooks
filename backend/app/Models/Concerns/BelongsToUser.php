<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Scopes queries to the authenticated user and stamps user_id on create.
 */
trait BelongsToUser
{
    public static function bootBelongsToUser(): void
    {
        static::addGlobalScope('for_auth_user', function (Builder $builder) {
            if (auth()->check()) {
                $builder->where(
                    $builder->getModel()->getTable().'.user_id',
                    auth()->id()
                );
            }
        });

        static::creating(function (Model $model) {
            if ($model->getAttribute('user_id') === null && auth()->check()) {
                $model->setAttribute('user_id', auth()->id());
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function scopeForUser(Builder $query, int|string|null $userId = null): Builder
    {
        return $query->withoutGlobalScope('for_auth_user')
            ->where($this->getTable().'.user_id', $userId ?? auth()->id());
    }
}
