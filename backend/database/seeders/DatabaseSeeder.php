<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Bartosz',
            'username' => 'bartosz',
            'email' => 'bartosz@example.com',
            'bio' => 'Building pxlstg.',
        ]);

        $this->call([
            CategorySeeder::class,
            ExpenseCategorySeeder::class,
            EntitySeeder::class,
        ]);
    }
}
