<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->orderBy('id')->first();
        if (! $owner) {
            return;
        }

        foreach (TenantProvisioner::DEFAULT_CATEGORIES as $name) {
            Category::withoutGlobalScopes()->firstOrCreate(
                ['user_id' => $owner->id, 'name' => $name],
            );
        }
    }
}
