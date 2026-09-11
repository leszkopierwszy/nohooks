<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entity_body_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained()->cascadeOnDelete();
            $table->date('recorded_at');
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->string('skin_tone', 64)->nullable();
            $table->decimal('chest_cm', 5, 1)->nullable();
            $table->decimal('waist_cm', 5, 1)->nullable();
            $table->decimal('hips_cm', 5, 1)->nullable();
            $table->decimal('shoulder_cm', 5, 1)->nullable();
            $table->decimal('inseam_cm', 5, 1)->nullable();
            $table->json('custom_measurements')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['entity_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_body_snapshots');
    }
};
