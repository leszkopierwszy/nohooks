<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->string('usage_frequency', 32)->nullable()->after('is_active');
            $table->decimal('usage_times_per_month', 8, 2)->nullable()->after('usage_frequency');
        });
    }

    public function down(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->dropColumn(['usage_frequency', 'usage_times_per_month']);
        });
    }
};
