<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-tenant ownership without deleting existing rows.
 * Legacy rows are assigned to the earliest user (bartosz).
 */
return new class extends Migration
{
    public function up(): void
    {
        $ownerId = User::query()->orderBy('id')->value('id');

        foreach (['entities', 'items', 'categories', 'timeline_events', 'savings_targets', 'expense_categories'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreignId('user_id')
                    ->nullable()
                    ->constrained()
                    ->cascadeOnDelete();
                $blueprint->index('user_id');
            });
        }

        if ($ownerId) {
            foreach (['entities', 'items', 'categories', 'timeline_events', 'savings_targets'] as $table) {
                DB::table($table)->whereNull('user_id')->update(['user_id' => $ownerId]);
            }

            DB::table('expense_categories')
                ->whereNull('user_id')
                ->where('is_builtin', false)
                ->update(['user_id' => $ownerId]);
        }

        foreach (['entities', 'items', 'categories', 'timeline_events', 'savings_targets'] as $table) {
            DB::statement("ALTER TABLE {$table} ALTER COLUMN user_id SET NOT NULL");
        }

        // Logical id (__m2m__) can repeat per user; surrogate pk for Eloquent.
        DB::statement('ALTER TABLE savings_targets DROP CONSTRAINT savings_targets_pkey');
        DB::statement('ALTER TABLE savings_targets ADD COLUMN pk BIGSERIAL PRIMARY KEY');
        Schema::table('savings_targets', function (Blueprint $table) {
            $table->unique(['user_id', 'id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->unique(['user_id', 'name']);
        });

        // Builtins keep user_id NULL; customs are unique per user.
        DB::statement('ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS expense_categories_slug_unique');
        // Partial unique: builtins by slug, customs by (user_id, slug)
        DB::statement('CREATE UNIQUE INDEX expense_categories_builtin_slug_unique ON expense_categories (slug) WHERE user_id IS NULL');
        DB::statement('CREATE UNIQUE INDEX expense_categories_user_slug_unique ON expense_categories (user_id, slug) WHERE user_id IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS expense_categories_user_slug_unique');
        DB::statement('DROP INDEX IF EXISTS expense_categories_builtin_slug_unique');
        Schema::table('expense_categories', function (Blueprint $table) {
            $table->unique('slug');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'name']);
        });

        Schema::table('savings_targets', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'id']);
            $table->dropColumn('pk');
        });
        DB::statement('ALTER TABLE savings_targets ADD PRIMARY KEY (id)');

        foreach (['entities', 'items', 'categories', 'timeline_events', 'savings_targets', 'expense_categories'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropConstrainedForeignId('user_id');
            });
        }
    }
};
