<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outfits', function (Blueprint $table) {
            $table->string('occasion', 32)->nullable()->after('label');
            $table->index(['user_id', 'occasion']);
        });
    }

    public function down(): void
    {
        Schema::table('outfits', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'occasion']);
            $table->dropColumn('occasion');
        });
    }
};
