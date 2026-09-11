<?php

namespace Database\Seeders;

use App\Models\Entity;
use Illuminate\Database\Seeder;

class EntitySeeder extends Seeder
{
    public function run(): void
    {
        $personas = [
            [
                'name' => 'Bartosz Szczypiorski',
                'description' => 'Max Max Super Max',
                'type' => 'persona',
                'gender' => 'male',
            ],
            [
                'name' => 'Nathalie Rose LeBlanc',
                'description' => 'Life Passenger Princess',
                'type' => 'persona',
                'gender' => 'female',
            ],
        ];

        foreach ($personas as $persona) {
            Entity::updateOrCreate(
                ['name' => $persona['name']],
                [
                    'description' => $persona['description'],
                    'type' => $persona['type'],
                    'gender' => $persona['gender'] ?? null,
                ]
            );
        }
    }
}
