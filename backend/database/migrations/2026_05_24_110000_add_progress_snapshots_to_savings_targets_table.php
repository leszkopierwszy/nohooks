<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('savings_targets', function (Blueprint $table) {
            $table->json('progress_snapshots')->nullable()->after('included_asset_ids');
        });
    }

    public function down(): void
    {
        Schema::table('savings_targets', function (Blueprint $table) {
            $table->dropColumn('progress_snapshots');
        });
    }
};
