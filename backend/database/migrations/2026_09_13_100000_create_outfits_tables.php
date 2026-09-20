<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outfits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entity_id')->constrained('entities')->cascadeOnDelete();
            $table->date('wear_date');
            $table->string('label')->nullable();
            $table->text('notes')->nullable();
            $table->string('source', 16)->default('manual');
            $table->timestamps();

            $table->unique(['user_id', 'entity_id', 'wear_date']);
            $table->index(['user_id', 'wear_date']);
            $table->index(['entity_id', 'wear_date']);
        });

        Schema::create('outfit_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outfit_id')->constrained('outfits')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);

            $table->unique(['outfit_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outfit_item');
        Schema::dropIfExists('outfits');
    }
};
