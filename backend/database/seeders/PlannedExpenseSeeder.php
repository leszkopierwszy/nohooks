<?php

namespace Database\Seeders;

use App\Models\TimelineEvent;
use Illuminate\Database\Seeder;

class PlannedExpenseSeeder extends Seeder
{
    /**
     * Subskrypcje z pierwotnego mocka (TableBadge.vue).
     * Dzień płatności: rozłożone w miesiącu (1–17), bo mock miał tylko „co miesiąc”.
     */
    private const SUBSCRIPTIONS = [
        ['name' => 'Spotify', 'plan' => 'Premium Individual', 'category' => 'Music', 'status' => true, 'price' => '23.99', 'currency' => 'PLN', 'day' => 1],
        ['name' => 'Netflix', 'plan' => 'Premium 1080', 'category' => 'VoD', 'status' => true, 'price' => '80.00', 'currency' => 'PLN', 'day' => 2],
        ['name' => 'Apple', 'plan' => 'Apple TV', 'category' => 'VoD', 'status' => true, 'price' => '34.99', 'currency' => 'PLN', 'day' => 3],
        ['name' => 'Apple', 'plan' => 'iCloud+ with 200GB', 'category' => 'Music', 'status' => true, 'price' => '14.99', 'currency' => 'PLN', 'day' => 4],
        ['name' => 'Dualingo', 'plan' => 'Super Dualingo', 'category' => 'Language', 'status' => true, 'price' => '37.99', 'currency' => 'PLN', 'day' => 5],
        ['name' => 'Orange', 'plan' => 'Orange Flex 75GB', 'category' => 'Communication', 'status' => true, 'price' => '35.00', 'currency' => 'PLN', 'day' => 6],
        ['name' => 'Open AI', 'plan' => 'Plus', 'category' => 'AI', 'status' => true, 'price' => '99.00', 'currency' => 'PLN', 'day' => 7],
        ['name' => 'Kuchnia Wikinga', 'plan' => 'Dieta Active Pro', 'category' => 'Food', 'status' => true, 'price' => '1300.00', 'currency' => 'PLN', 'day' => 10],
        ['name' => 'Kuchnia Wikinga', 'plan' => 'Dieta Active Pro (nieaktywna)', 'category' => 'Food', 'status' => false, 'price' => '1300.00', 'currency' => 'PLN', 'day' => 10],
    ];

    public function run(): void
    {
        $anchorYear = (int) date('Y');
        $anchorMonth = 1;

        foreach (self::SUBSCRIPTIONS as $sub) {
            $day = min((int) $sub['day'], 28);
            $eventDate = sprintf('%04d-%02d-%02d', $anchorYear, $anchorMonth, $day);

            TimelineEvent::firstOrCreate(
                [
                    'type' => 'planned_expense',
                    'label' => $sub['plan'],
                    'location' => $sub['name'],
                    'is_active' => $sub['status'],
                ],
                [
                    'event_date' => $eventDate,
                    'recurrence' => 'monthly',
                    'all_day' => true,
                    'expense_category' => $sub['category'],
                    'planned_amount' => $sub['price'],
                    'currency' => $sub['currency'],
                    'start_time' => null,
                    'end_time' => null,
                ]
            );
        }
    }
}
