<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            $table->string('gender', 16)->nullable()->after('type');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->boolean('fits_all_personas')->default(true)->after('entity_id');
            $table->json('fits_persona_ids')->nullable()->after('fits_all_personas');
            $table->foreignId('default_persona_id')
                ->nullable()
                ->after('fits_persona_ids')
                ->constrained('entities')
                ->nullOnDelete();
        });

        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('entity_id')->nullable()->change();
        });

        if (Schema::hasColumn('items', 'entity_id')) {
            DB::table('items')->whereNotNull('entity_id')->update([
                'default_persona_id' => DB::raw('entity_id'),
                'fits_all_personas' => true,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['default_persona_id']);
            $table->dropColumn(['fits_all_personas', 'fits_persona_ids', 'default_persona_id']);
        });

        Schema::table('entities', function (Blueprint $table) {
            $table->dropColumn('gender');
        });
    }
};
