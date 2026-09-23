<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capsules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entity_id')->constrained('entities')->cascadeOnDelete();
            $table->string('name');
            $table->string('preset', 32)->default('custom');
            $table->string('occasion', 32)->nullable();
            $table->string('season', 32)->nullable();
            $table->string('style', 64)->nullable();
            $table->unsignedSmallInteger('target_outfit_count')->nullable();
            $table->unsignedSmallInteger('item_limit')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'entity_id']);
        });

        Schema::create('capsule_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('capsule_id')->constrained('capsules')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);

            $table->unique(['capsule_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capsule_item');
        Schema::dropIfExists('capsules');
    }
};
