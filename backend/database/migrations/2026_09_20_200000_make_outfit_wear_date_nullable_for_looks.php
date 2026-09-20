<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outfits', function (Blueprint $table) {
            $table->date('wear_date')->nullable()->change();
        });

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE outfits DROP CONSTRAINT IF EXISTS outfits_user_id_entity_id_wear_date_unique');
            DB::statement(
                'CREATE UNIQUE INDEX IF NOT EXISTS outfits_user_entity_wear_date_unique ON outfits (user_id, entity_id, wear_date) WHERE wear_date IS NOT NULL'
            );
        } elseif ($driver === 'sqlite') {
            // SQLite: recreate index via raw SQL after dropping the named unique index if present.
            try {
                Schema::table('outfits', function (Blueprint $table) {
                    $table->dropUnique(['user_id', 'entity_id', 'wear_date']);
                });
            } catch (\Throwable) {
                // Index may already be gone.
            }
            DB::statement(
                'CREATE UNIQUE INDEX IF NOT EXISTS outfits_user_entity_wear_date_unique ON outfits (user_id, entity_id, wear_date) WHERE wear_date IS NOT NULL'
            );
        } else {
            Schema::table('outfits', function (Blueprint $table) {
                $table->dropUnique(['user_id', 'entity_id', 'wear_date']);
            });
            DB::statement(
                'CREATE UNIQUE INDEX outfits_user_entity_wear_date_unique ON outfits (user_id, entity_id, wear_date) WHERE wear_date IS NOT NULL'
            );
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS outfits_user_entity_wear_date_unique');

        DB::table('outfits')
            ->whereNull('wear_date')
            ->orderBy('id')
            ->each(function ($row) {
                DB::table('outfits')->where('id', $row->id)->update([
                    'wear_date' => '1970-01-01',
                ]);
            });

        Schema::table('outfits', function (Blueprint $table) {
            $table->date('wear_date')->nullable(false)->change();
            $table->unique(['user_id', 'entity_id', 'wear_date']);
        });
    }
};
