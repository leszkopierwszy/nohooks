<?php

namespace Database\Seeders;

use App\Models\StyleAchievement;
use App\Models\StyleModule;
use Illuminate\Database\Seeder;

class StyleJourneySeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'title' => 'Footwear foundation',
                'description' => 'Own at least one pair of shoes that fit this Prim.',
                'sort_order' => 10,
                'gender' => null,
                'xp_reward' => 25,
                'completion_mode' => 'auto',
                'requirements' => [
                    'all' => [
                        ['slot' => 'footwear', 'min' => 1],
                    ],
                ],
            ],
            [
                'title' => 'Classic formula',
                'description' => 'Top + bottom + shoes — the everyday complete look.',
                'sort_order' => 20,
                'gender' => null,
                'xp_reward' => 50,
                'completion_mode' => 'auto',
                'requirements' => [
                    'all' => [
                        ['slot' => 'top', 'min' => 1],
                        ['slot' => 'bottom', 'min' => 1],
                        ['slot' => 'footwear', 'min' => 1],
                    ],
                ],
            ],
            [
                'title' => 'One-piece look',
                'description' => 'Dress or jumpsuit plus shoes.',
                'sort_order' => 30,
                'gender' => 'female',
                'xp_reward' => 40,
                'completion_mode' => 'auto',
                'requirements' => [
                    'all' => [
                        ['slot' => 'one_piece', 'min' => 1],
                        ['slot' => 'footwear', 'min' => 1],
                    ],
                ],
            ],
            [
                'title' => 'Outer layer',
                'description' => 'Add a jacket, coat, or blazer to the wardrobe.',
                'sort_order' => 40,
                'gender' => null,
                'xp_reward' => 30,
                'completion_mode' => 'auto',
                'requirements' => [
                    'all' => [
                        ['slot' => 'outerwear', 'min' => 1],
                    ],
                ],
            ],
            [
                'title' => 'Style awareness check',
                'description' => 'Confirm you know your basic wardrobe roles.',
                'sort_order' => 50,
                'gender' => null,
                'xp_reward' => 20,
                'completion_mode' => 'manual',
                'requirements' => [
                    'checks' => [
                        ['id' => 'know_tops', 'label' => 'I know which items are tops'],
                        ['id' => 'know_bottoms', 'label' => 'I know which items are bottoms'],
                        ['id' => 'know_shoes', 'label' => 'I know which items are footwear'],
                    ],
                ],
            ],
        ];

        foreach ($modules as $row) {
            StyleModule::query()->updateOrCreate(
                ['title' => $row['title']],
                array_merge($row, ['is_active' => true]),
            );
        }

        StyleAchievement::query()->updateOrCreate(
            ['code' => 'first_module'],
            [
                'title' => 'First step',
                'description' => 'Complete your first style module.',
                'icon' => 'sparkles',
                'rule' => ['type' => 'modules_completed', 'count' => 1],
                'xp_bonus' => 15,
                'is_active' => true,
                'sort_order' => 10,
            ],
        );

        StyleAchievement::query()->updateOrCreate(
            ['code' => 'xp_200'],
            [
                'title' => 'Style explorer',
                'description' => 'Reach 200 style XP.',
                'icon' => 'trophy',
                'rule' => ['type' => 'xp_total', 'min' => 200],
                'xp_bonus' => 25,
                'is_active' => true,
                'sort_order' => 20,
            ],
        );
    }
}
