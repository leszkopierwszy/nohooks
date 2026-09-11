<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->string('image_path')->nullable();
            $table->string('external_url', 2048)->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        if (Schema::hasColumn('items', 'image_path') || Schema::hasColumn('items', 'external_image_url')) {
            foreach (DB::table('items')->get() as $item) {
                $sortOrder = 0;

                if ($item->image_path) {
                    DB::table('item_images')->insert([
                        'item_id' => $item->id,
                        'image_path' => $item->image_path,
                        'external_url' => null,
                        'sort_order' => $sortOrder++,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } elseif ($item->external_image_url ?? null) {
                    DB::table('item_images')->insert([
                        'item_id' => $item->id,
                        'image_path' => null,
                        'external_url' => $item->external_image_url,
                        'sort_order' => $sortOrder,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            Schema::table('items', function (Blueprint $table) {
                if (Schema::hasColumn('items', 'image_path')) {
                    $table->dropColumn('image_path');
                }
                if (Schema::hasColumn('items', 'external_image_url')) {
                    $table->dropColumn('external_image_url');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('image_path')->nullable();
            $table->string('external_image_url', 2048)->nullable();
        });

        foreach (DB::table('item_images')->orderBy('sort_order')->get() as $row) {
            $item = DB::table('items')->where('id', $row->item_id)->first();
            if (!$item) {
                continue;
            }

            $updates = [];
            if ($row->image_path && !$item->image_path) {
                $updates['image_path'] = $row->image_path;
            } elseif ($row->external_url && !$item->external_image_url) {
                $updates['external_image_url'] = $row->external_url;
            }

            if ($updates !== []) {
                DB::table('items')->where('id', $row->item_id)->update($updates);
            }
        }

        Schema::dropIfExists('item_images');
    }
};
