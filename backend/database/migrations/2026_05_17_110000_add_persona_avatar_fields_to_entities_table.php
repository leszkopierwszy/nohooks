<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entities', function (Blueprint $table) {
            $table->string('avatar_source_url', 2048)->nullable()->after('gender');
            $table->string('avatar_doll_url', 2048)->nullable()->after('avatar_source_url');
            $table->timestamp('avatar_generated_at')->nullable()->after('avatar_doll_url');
        });

        Schema::create('entity_try_ons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('avatar_image_url', 2048);
            $table->string('garment_image_url', 2048);
            $table->string('result_image_url', 2048);
            $table->string('provider', 32)->default('replicate');
            $table->string('prediction_id', 128)->nullable();
            $table->timestamps();

            $table->index(['entity_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_try_ons');

        Schema::table('entities', function (Blueprint $table) {
            $table->dropColumn(['avatar_source_url', 'avatar_doll_url', 'avatar_generated_at']);
        });
    }
};
