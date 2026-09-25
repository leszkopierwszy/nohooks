<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->json('colors')->nullable()->after('color');
        });

        DB::table('items')
            ->whereNotNull('color')
            ->where('color', '!=', '')
            ->orderBy('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('items')
                        ->where('id', $row->id)
                        ->update([
                            'colors' => json_encode([$row->color]),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('colors');
        });
    }
};
