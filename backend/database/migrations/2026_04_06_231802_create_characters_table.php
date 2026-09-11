<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained()->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->string('fname')->nullable();
            $table->string('lname')->nullable();
            $table->string('nickname')->nullable();
            $table->string('birth_gender')->nullable();
            $table->string('birthday')->nullable();
            $table->string('height')->nullable();
            $table->string('weight')->nullable();
            $table->string('hair_color')->nullable();
            $table->string('current_hair_color')->nullable();
            $table->string('hair_length')->nullable();
            $table->string('hair_style')->nullable();
            $table->string('hair_texture')->nullable();
            $table->string('eye_color')->nullable();
            $table->string('skin_color')->nullable();
            $table->string('blood_type')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
