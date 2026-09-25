<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('net_salary_pln', 14, 2)->nullable()->after('bio');
        });

        $ownerId = User::query()->orderBy('id')->value('id');
        if ($ownerId) {
            User::query()->whereKey($ownerId)->update(['net_salary_pln' => 12787]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('net_salary_pln');
        });
    }
};
