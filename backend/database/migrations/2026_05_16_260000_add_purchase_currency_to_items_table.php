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
            $table->string('purchase_currency', 3)->default('PLN')->after('purchase_price');
            $table->decimal('purchase_price_pln', 12, 2)->nullable()->after('purchase_currency');
        });

        DB::table('items')
            ->whereNotNull('purchase_price')
            ->where('gift', false)
            ->update([
                'purchase_currency' => 'PLN',
                'purchase_price_pln' => DB::raw('purchase_price'),
            ]);
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['purchase_currency', 'purchase_price_pln']);
        });
    }
};
