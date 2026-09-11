<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            $table->string('species', 64)->nullable()->after('gender');
            $table->date('birth_date')->nullable()->after('species');
            $table->string('sex', 16)->nullable()->after('birth_date');
        });
    }

    public function down(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            $table->dropColumn(['species', 'birth_date', 'sex']);
        });
    }
};
