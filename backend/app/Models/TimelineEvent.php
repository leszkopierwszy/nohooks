<?php

namespace App\Models;

use App\Models\Concerns\BelongsToUser;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class TimelineEvent extends Model
{
    use BelongsToUser;

    public const PLANNED_RECURRENCES = ['monthly', 'quarterly', 'half_yearly', 'yearly'];

    protected $fillable = [
        'user_id',
        'event_date',
        'start_time',
        'end_time',
        'all_day',
        'label',
        'location',
        'expense_category',
        'is_active',
        'usage_frequency',
        'usage_times_per_month',
        'type',
        'growth_goal_id',
        'work_minutes',
        'color',
        'recurrence',
        'description',
        'notes',
        'link',
        'planned_amount',
        'currency',
    ];

    protected $casts = [
        'event_date' => 'date:Y-m-d',
        'all_day' => 'boolean',
        'is_active' => 'boolean',
        'planned_amount' => 'decimal:2',
        'usage_times_per_month' => 'decimal:2',
        'work_minutes' => 'integer',
    ];

    public static function yearlyOccurrence(\Carbon\CarbonInterface $anchor, int $year): string
    {
        $month = (int) $anchor->format('m');
        $day = (int) $anchor->format('d');

        if ($month === 2 && $day === 29 && ! checkdate(2, 29, $year)) {
            $day = 28;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    public static function monthlyOccurrence(int $year, int $month, int $anchorDay, int $anchorMonth = 0): string
    {
        $day = $anchorDay;
        if ($anchorMonth === 2 && $anchorDay === 29 && ! checkdate(2, 29, $year)) {
            $day = 28;
        }

        $lastDay = (int) Carbon::create($year, $month, 1)->endOfMonth()->format('d');
        $day = min($day, $lastDay);

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    public static function occursInBillingMonth(\Carbon\CarbonInterface $anchor, string $recurrence, int $year, int $month): bool
    {
        $anchorMonth = (int) $anchor->format('m');
        $diff = ($month - $anchorMonth + 12) % 12;

        return match ($recurrence) {
            'monthly' => true,
            'quarterly' => $diff % 3 === 0,
            'half_yearly' => $diff % 6 === 0,
            'yearly' => $month === $anchorMonth,
            default => false,
        };
    }

    public static function yearlyOccursInRange($eventDate, string $from, string $to): bool
    {
        $anchor = Carbon::parse($eventDate);
        $fromYear = (int) substr($from, 0, 4);
        $toYear = (int) substr($to, 0, 4);

        for ($year = $fromYear; $year <= $toYear; $year++) {
            $occurrence = self::yearlyOccurrence($anchor, $year);
            if ($occurrence >= $from && $occurrence <= $to) {
                return true;
            }
        }

        return false;
    }

    public static function intervalOccursInRange($eventDate, string $recurrence, string $from, string $to): bool
    {
        $anchor = Carbon::parse($eventDate);
        $anchorDay = (int) $anchor->format('d');
        $anchorMonth = (int) $anchor->format('m');
        $cursor = Carbon::parse($from)->startOfMonth();
        $end = Carbon::parse($to)->endOfMonth();

        while ($cursor <= $end) {
            $year = (int) $cursor->format('Y');
            $month = (int) $cursor->format('m');

            if (self::occursInBillingMonth($anchor, $recurrence, $year, $month)) {
                $occurrence = $recurrence === 'yearly'
                    ? self::yearlyOccurrence($anchor, $year)
                    : self::monthlyOccurrence($year, $month, $anchorDay, $anchorMonth);

                if ($occurrence >= $from && $occurrence <= $to) {
                    return true;
                }
            }

            $cursor->addMonth();
        }

        return false;
    }

    public function isYearlyRecurring(): bool
    {
        return $this->type === 'birthday'
            || ($this->type === 'planned_expense' && $this->recurrence === 'yearly');
    }

    public function isPlannedIntervalRecurring(): bool
    {
        return $this->type === 'planned_expense'
            && in_array($this->recurrence, ['monthly', 'quarterly', 'half_yearly'], true);
    }

    public function isCalendarRecurring(): bool
    {
        return $this->isYearlyRecurring() || $this->isPlannedIntervalRecurring();
    }

    /** @deprecated */
    public function isMonthlyRecurring(): bool
    {
        return $this->type === 'planned_expense' && $this->recurrence === 'monthly';
    }
}
