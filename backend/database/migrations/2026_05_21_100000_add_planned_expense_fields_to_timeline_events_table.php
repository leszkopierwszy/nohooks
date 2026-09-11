<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->string('expense_category', 64)->nullable()->after('location');
            $table->boolean('is_active')->default(true)->after('expense_category');
        });
    }

    public function down(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->dropColumn(['expense_category', 'is_active']);
        });
    }
};
