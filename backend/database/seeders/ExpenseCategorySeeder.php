<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $builtins = [
            ['slug' => 'groceries', 'name' => 'Groceries'],
            ['slug' => 'transport', 'name' => 'Transport'],
            ['slug' => 'dining', 'name' => 'Dining out'],
            ['slug' => 'housing', 'name' => 'Housing'],
            ['slug' => 'health', 'name' => 'Health'],
            ['slug' => 'entertainment', 'name' => 'Entertainment'],
            ['slug' => 'shopping', 'name' => 'Shopping'],
            ['slug' => 'subscriptions', 'name' => 'Subscriptions'],
            ['slug' => 'pets', 'name' => 'Pets'],
            ['slug' => 'loterie', 'name' => 'Loterie'],
            ['slug' => 'other', 'name' => 'Other'],
        ];

        foreach ($builtins as $row) {
            ExpenseCategory::updateOrCreate(
                ['slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'is_builtin' => true,
                ],
            );
        }
    }
}
