<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_workspace_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('document_key', 96);
            $table->json('payload');
            $table->timestamps();

            $table->unique(['user_id', 'document_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_workspace_documents');
    }
};
