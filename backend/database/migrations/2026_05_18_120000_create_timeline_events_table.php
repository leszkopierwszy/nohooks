<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timeline_events', function (Blueprint $table) {
            $table->id();
            $table->date('event_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('all_day')->default(false);
            $table->string('label');
            $table->string('type', 32)->default('event');
            $table->text('description')->nullable();
            $table->decimal('planned_amount', 12, 2)->nullable();
            $table->string('currency', 3)->default('PLN');
            $table->timestamps();

            $table->index(['event_date', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timeline_events');
    }
};
