<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimelineEvent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TimelineEventController extends Controller
{
  private const TYPES = ['event', 'planned_expense', 'reminder', 'birthday', 'goal_work', 'growth_goal'];

  private const RECURRENCES = ['yearly', 'monthly', 'quarterly', 'half_yearly'];

  private function rules(bool $partial = false): array
  {
    $required = $partial ? 'sometimes' : 'required';

    return [
      'event_date' => "{$required}|date",
      'start_time' => 'nullable|date_format:H:i',
      'end_time' => 'nullable|date_format:H:i',
      'all_day' => 'boolean',
      'label' => "{$required}|string|max:255",
      'location' => 'nullable|string|max:255',
      'expense_category' => 'nullable|string|max:64',
      'is_active' => 'boolean',
      'usage_frequency' => 'nullable|string|max:32',
      'usage_times_per_month' => 'nullable|numeric|min:0.01|max:999',
      'type' => [$required, 'string', Rule::in(self::TYPES)],
      'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
      'recurrence' => ['nullable', 'string', Rule::in(self::RECURRENCES)],
      'description' => 'nullable|string|max:5000',
      'notes' => 'nullable|string|max:5000',
      'link' => 'nullable|string|max:2048',
      'planned_amount' => 'nullable|numeric|min:0',
      'currency' => 'nullable|string|size:3',
      'growth_goal_id' => [
        'nullable',
        'string',
        'max:64',
        Rule::requiredIf(fn () => in_array(request()->input('type'), ['goal_work', 'growth_goal'], true)),
      ],
      'work_minutes' => 'required_if:type,goal_work|nullable|integer|min:1|max:1440',
    ];
  }

  private function normalizeInput(array $data): array
  {
    $allDay = ! empty($data['all_day']);

    if ($allDay) {
      $data['start_time'] = null;
      $data['end_time'] = null;
    }

    if (empty($data['currency'])) {
      $data['currency'] = 'PLN';
    }

    $type = $data['type'] ?? '';

    if ($type !== 'planned_expense') {
      $data['planned_amount'] = null;
      $data['expense_category'] = null;
      if (array_key_exists('is_active', $data)) {
        unset($data['is_active']);
      }
      unset($data['usage_frequency'], $data['usage_times_per_month']);
    } else {
      if (! array_key_exists('is_active', $data)) {
        $data['is_active'] = true;
      }
      if (empty($data['usage_frequency'])) {
        $data['usage_frequency'] = 'monthly';
      }
      if (isset($data['usage_times_per_month']) && $data['usage_times_per_month'] === '') {
        $data['usage_times_per_month'] = null;
      }
      $data['all_day'] = true;
      $data['start_time'] = null;
      $data['end_time'] = null;
      if (! in_array($data['recurrence'] ?? null, TimelineEvent::PLANNED_RECURRENCES, true)) {
        $data['recurrence'] = 'monthly';
      }
    }

    if (in_array($type, ['goal_work', 'growth_goal'], true)) {
      $data['growth_goal_id'] = isset($data['growth_goal_id'])
        ? trim((string) $data['growth_goal_id']) ?: null
        : null;
      if (empty($data['growth_goal_id'])) {
        $data['growth_goal_id'] = null;
      }
    }

    if ($type === 'goal_work') {
      $data['recurrence'] = null;
      $data['all_day'] = false;
      $data['planned_amount'] = null;
      $data['expense_category'] = null;
      $data['work_minutes'] = isset($data['work_minutes'])
        ? (int) $data['work_minutes']
        : null;
    } elseif ($type === 'growth_goal') {
      $data['recurrence'] = null;
      $data['planned_amount'] = null;
      $data['expense_category'] = null;
      $data['work_minutes'] = null;
    } elseif ($type !== '') {
      $data['growth_goal_id'] = null;
      $data['work_minutes'] = null;
    }

    if ($type === 'birthday') {
      $data['recurrence'] = 'yearly';
      $data['all_day'] = true;
      $data['start_time'] = null;
      $data['end_time'] = null;
      $data['planned_amount'] = null;
      $data['expense_category'] = null;
    } elseif (! in_array($data['recurrence'] ?? null, self::RECURRENCES, true)) {
      $data['recurrence'] = null;
    }

    foreach (['location', 'notes', 'link', 'expense_category'] as $key) {
      if (array_key_exists($key, $data)) {
        $value = is_string($data[$key]) ? trim($data[$key]) : $data[$key];
        $data[$key] = $value !== '' ? $value : null;
      }
    }

    if (array_key_exists('color', $data)) {
      $c = is_string($data['color']) ? strtolower(trim($data['color'])) : '';
      $data['color'] = $c !== '' ? $c : null;
    }

    return $data;
  }

  public function index(Request $request)
  {
    $request->validate([
      'from' => 'nullable|date',
      'to' => 'nullable|date',
      'type' => ['nullable', 'string', Rule::in(self::TYPES)],
    ]);

    $query = TimelineEvent::query()
      ->orderBy('event_date')
      ->orderByRaw('start_time IS NULL')
      ->orderBy('start_time');

    if ($request->filled('type')) {
      $query->where('type', $request->input('type'));
    }

    $events = $query->get();

    if ($request->filled('from') && $request->filled('to')) {
      $from = $request->input('from');
      $to = $request->input('to');

      $events = $events->filter(function (TimelineEvent $event) use ($from, $to) {
        if ($event->type === 'birthday') {
          return TimelineEvent::yearlyOccursInRange($event->event_date, $from, $to);
        }

        if ($event->type === 'planned_expense' && $event->recurrence) {
          return TimelineEvent::intervalOccursInRange(
            $event->event_date,
            $event->recurrence,
            $from,
            $to
          );
        }

        if ($event->isYearlyRecurring()) {
          return TimelineEvent::yearlyOccursInRange($event->event_date, $from, $to);
        }

        $date = $event->event_date->format('Y-m-d');

        return $date >= $from && $date <= $to;
      })->values();
    }

    return $events;
  }

  public function store(Request $request)
  {
    $data = $this->normalizeInput($request->validate($this->rules()));

    return TimelineEvent::create($data);
  }

  public function show(TimelineEvent $timelineEvent)
  {
    return $timelineEvent;
  }

  public function update(Request $request, TimelineEvent $timelineEvent)
  {
    $data = $this->normalizeInput($request->validate($this->rules(partial: true)));
    $timelineEvent->update($data);

    return $timelineEvent->fresh();
  }

  public function destroy(TimelineEvent $timelineEvent)
  {
    $timelineEvent->delete();

    return response()->json(null, 204);
  }
}
