<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('body_zone', 16)->nullable()->after('category');
            $table->string('wear_layer', 16)->nullable()->after('body_zone');
            $table->index(['body_zone', 'wear_layer']);
        });

        $map = [
            // head
            'czapka' => ['head', 'outer'],
            'szalik' => ['head', 'mid'],
            'rekawiczki' => ['head', 'accent'],
            'okulary' => ['head', 'accent'],
            'kolczyki' => ['head', 'accent'],
            'bizuteria' => ['head', 'accent'],
            'naszyjnik' => ['head', 'accent'],
            // torso outer → base
            'kurtka' => ['torso', 'outer'],
            'marynarka' => ['torso', 'outer'],
            'plaszcz' => ['torso', 'outer'],
            'bluza' => ['torso', 'mid'],
            'sweter' => ['torso', 'mid'],
            'cardigan' => ['torso', 'mid'],
            'koszulka' => ['torso', 'base'],
            't-shirt' => ['torso', 'base'],
            'polowka' => ['torso', 'base'],
            'koszula' => ['torso', 'base'],
            'top' => ['torso', 'base'],
            'bielizna' => ['torso', 'base'],
            // legs
            'spodnie' => ['legs', 'mid'],
            'jeansy' => ['legs', 'mid'],
            'szorty' => ['legs', 'mid'],
            'spodnica' => ['legs', 'mid'],
            'legginsy' => ['legs', 'base'],
            'rajstopy' => ['legs', 'base'],
            'skarpety' => ['feet', 'base'],
            // feet
            'buty' => ['feet', 'outer'],
            'sneakers' => ['feet', 'outer'],
            'trampki' => ['feet', 'outer'],
            // full
            'sukienka' => ['full', 'mid'],
            'garnitur' => ['full', 'outer'],
            'dres' => ['full', 'mid'],
            'pizama' => ['full', 'base'],
            'kombinezon' => ['full', 'mid'],
        ];

        foreach ($map as $category => [$zone, $layer]) {
            DB::table('items')
                ->whereRaw('LOWER(category) = ?', [$category])
                ->whereNull('body_zone')
                ->update([
                    'body_zone' => $zone,
                    'wear_layer' => $layer,
                ]);
        }

        // Obuwie bez category — po nazwie kolekcji trudniej w SQL; zostawiamy null (FE/BE inferują).
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['body_zone', 'wear_layer']);
            $table->dropColumn(['body_zone', 'wear_layer']);
        });
    }
};
