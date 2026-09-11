<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->string('growth_goal_id', 64)->nullable()->after('type');
            $table->unsignedInteger('work_minutes')->nullable()->after('growth_goal_id');
        });
    }

    public function down(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->dropColumn(['growth_goal_id', 'work_minutes']);
        });
    }
};
