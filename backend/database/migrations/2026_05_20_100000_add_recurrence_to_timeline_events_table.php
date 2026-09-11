<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->string('recurrence', 16)->nullable()->after('type');
        });

        DB::table('timeline_events')
            ->where('type', 'birthday')
            ->update(['recurrence' => 'yearly']);
    }

    public function down(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->dropColumn('recurrence');
        });
    }
};
