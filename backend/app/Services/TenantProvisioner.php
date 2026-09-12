<?php

namespace App\Services;

use App\Models\Category;
use App\Models\SavingsTarget;
use App\Models\User;

class TenantProvisioner
{
    public const DEFAULT_CATEGORIES = [
        'clothes',
        'shoes',
        'accessories',
        'electronics',
        'packing',
        'books',
    ];

    public function provision(User $user): void
    {
        $this->ensureM2mTarget($user);
        $this->ensureDefaultCategories($user);
    }

    public function ensureM2mTarget(User $user): void
    {
        $exists = SavingsTarget::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->where('id', '__m2m__')
            ->exists();

        if ($exists) {
            return;
        }

        SavingsTarget::withoutGlobalScopes()->create([
            'user_id' => $user->id,
            'id' => '__m2m__',
            'name' => 'M2M Expected Savings',
            'type' => 'm2m',
            'amount' => null,
            'color' => 'indigo',
            'is_primary' => true,
            'included_asset_ids' => null,
            'sort_order' => 0,
        ]);
    }

    public function ensureDefaultCategories(User $user): void
    {
        foreach (self::DEFAULT_CATEGORIES as $name) {
            Category::withoutGlobalScopes()->firstOrCreate(
                ['user_id' => $user->id, 'name' => $name],
            );
        }
    }
}
