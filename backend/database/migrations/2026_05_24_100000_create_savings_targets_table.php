<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('savings_targets', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('type', 16); // m2m | fixed
            $table->decimal('amount', 14, 2)->nullable();
            $table->string('color', 32)->default('indigo');
            $table->boolean('is_primary')->default(false);
            /** null = wszystkie aktywa z portfela (po stronie klienta) */
            $table->json('included_asset_ids')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('savings_targets');
    }
};
