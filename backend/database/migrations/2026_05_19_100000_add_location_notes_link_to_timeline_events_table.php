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
            $table->string('location')->nullable()->after('label');
            $table->text('notes')->nullable()->after('description');
            $table->string('link', 2048)->nullable()->after('notes');
        });

        DB::table('timeline_events')
            ->whereNotNull('description')
            ->where(function ($query) {
                $query->whereNull('notes')->orWhere('notes', '');
            })
            ->update([
                'notes' => DB::raw('description'),
            ]);
    }

    public function down(): void
    {
        Schema::table('timeline_events', function (Blueprint $table) {
            $table->dropColumn(['location', 'notes', 'link']);
        });
    }
};
