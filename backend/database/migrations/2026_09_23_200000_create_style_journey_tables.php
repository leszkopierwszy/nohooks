<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('style_modules', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('gender', 16)->nullable(); // null = all; female|male|nonbinary|gay
            $table->unsignedInteger('xp_reward')->default(25);
            $table->string('completion_mode', 16)->default('auto'); // auto|manual
            $table->json('requirements')->nullable();
            $table->timestamps();
        });

        Schema::create('style_module_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('style_module_id')->constrained('style_modules')->cascadeOnDelete();
            $table->timestamp('completed_at');
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'entity_id', 'style_module_id'], 'style_module_completions_unique');
        });

        Schema::create('style_module_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('style_module_id')->constrained('style_modules')->cascadeOnDelete();
            $table->json('checklist')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'entity_id', 'style_module_id'], 'style_module_progress_unique');
        });

        Schema::create('style_achievements', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->string('icon', 64)->nullable();
            $table->json('rule');
            $table->unsignedInteger('xp_bonus')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('style_achievement_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('style_achievement_id')->constrained('style_achievements')->cascadeOnDelete();
            $table->timestamp('unlocked_at');
            $table->timestamps();

            $table->unique(['user_id', 'style_achievement_id'], 'style_achievement_unlocks_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('style_achievement_unlocks');
        Schema::dropIfExists('style_achievements');
        Schema::dropIfExists('style_module_progress');
        Schema::dropIfExists('style_module_completions');
        Schema::dropIfExists('style_modules');
    }
};
