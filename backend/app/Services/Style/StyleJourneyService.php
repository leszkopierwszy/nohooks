<?php

namespace App\Services\Style;

use App\Models\Entity;
use App\Models\Item;
use App\Models\StyleAchievement;
use App\Models\StyleAchievementUnlock;
use App\Models\StyleModule;
use App\Models\StyleModuleCompletion;
use App\Models\StyleModuleProgress;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StyleJourneyService
{
    public function __construct(
        private readonly StyleModuleEvaluator $evaluator,
    ) {
    }

    public function levelForXp(int $xp): int
    {
        $per = max(1, (int) config('style_journey.xp_per_level', 100));

        return (int) floor($xp / $per) + 1;
    }

    public function totalXpForUser(int $userId): int
    {
        $fromModules = (int) StyleModuleCompletion::query()
            ->where('user_id', $userId)
            ->sum('xp_awarded');

        $fromAchievements = (int) StyleAchievementUnlock::query()
            ->where('user_id', $userId)
            ->join('style_achievements', 'style_achievements.id', '=', 'style_achievement_unlocks.style_achievement_id')
            ->sum('style_achievements.xp_bonus');

        return $fromModules + $fromAchievements;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function scoreboard(int $limit = 10): array
    {
        $limit = max(1, min(50, $limit));

        $moduleXp = StyleModuleCompletion::query()
            ->selectRaw('user_id, SUM(xp_awarded) as xp')
            ->groupBy('user_id')
            ->pluck('xp', 'user_id');

        $bonusXp = StyleAchievementUnlock::query()
            ->join('style_achievements', 'style_achievements.id', '=', 'style_achievement_unlocks.style_achievement_id')
            ->selectRaw('style_achievement_unlocks.user_id, SUM(COALESCE(style_achievements.xp_bonus, 0)) as xp')
            ->groupBy('style_achievement_unlocks.user_id')
            ->pluck('xp', 'user_id');

        $userIds = $moduleXp->keys()->merge($bonusXp->keys())->unique()->values();
        if ($userIds->isEmpty()) {
            return [];
        }

        $users = User::query()
            ->whereIn('id', $userIds)
            ->get(['id', 'name', 'username', 'avatar'])
            ->keyBy('id');

        $rows = [];
        foreach ($userIds as $uid) {
            $xp = (int) ($moduleXp[$uid] ?? 0) + (int) ($bonusXp[$uid] ?? 0);
            $user = $users->get($uid);
            if (! $user) {
                continue;
            }
            $rows[] = [
                'user_id' => (int) $uid,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'xp' => $xp,
                'level' => $this->levelForXp($xp),
            ];
        }

        usort($rows, static fn ($a, $b) => $b['xp'] <=> $a['xp']);
        $rows = array_slice($rows, 0, $limit);

        foreach ($rows as $i => &$row) {
            $row['rank'] = $i + 1;
        }
        unset($row);

        return $rows;
    }

    public function rankForUser(int $userId): ?int
    {
        $board = $this->scoreboard(500);
        foreach ($board as $row) {
            if ((int) $row['user_id'] === $userId) {
                return (int) $row['rank'];
            }
        }

        $xp = $this->totalXpForUser($userId);
        if ($xp <= 0) {
            return null;
        }

        return count($board) + 1;
    }

    /**
     * @return Collection<int, Item>
     */
    public function wardrobeForEntity(User $user, Entity $entity): Collection
    {
        return Item::query()
            ->with(['images', 'collectionGroup'])
            ->where('user_id', $user->id)
            ->fitsPersona((int) $entity->id)
            ->get();
    }

    /**
     * Sync auto modules for entity; award completions + achievements.
     *
     * @return array{newly_completed: list<int>, journey: array<string, mixed>}
     */
    public function sync(User $user, Entity $entity): array
    {
        $items = $this->wardrobeForEntity($user, $entity);
        $modules = StyleModule::query()
            ->active()
            ->visibleForGender($entity->gender)
            ->where('completion_mode', StyleModule::MODE_AUTO)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $newly = [];

        foreach ($modules as $module) {
            $existing = StyleModuleCompletion::query()
                ->where('user_id', $user->id)
                ->where('entity_id', $entity->id)
                ->where('style_module_id', $module->id)
                ->exists();
            if ($existing) {
                continue;
            }

            $eval = $this->evaluator->evaluate($items, $module->requirements);
            if (! $eval['met']) {
                continue;
            }

            $this->awardModuleCompletion($user, $entity, $module);
            $newly[] = (int) $module->id;
        }

        $this->evaluateAchievements($user);

        return [
            'newly_completed' => $newly,
            'journey' => $this->buildJourneyPayload($user, $entity),
        ];
    }

    /**
     * Complete a module (manual checklist or re-check auto).
     *
     * @param  list<string>  $checkIds
     * @return array<string, mixed>
     */
    public function complete(User $user, Entity $entity, StyleModule $module, array $checkIds = []): array
    {
        if (! $module->is_active) {
            abort(404, 'Module not found.');
        }

        $gender = $entity->gender ? strtolower(trim((string) $entity->gender)) : null;
        if ($module->gender && $gender && $module->gender !== $gender) {
            abort(403, 'Module not available for this Prim.');
        }

        $existing = StyleModuleCompletion::query()
            ->where('user_id', $user->id)
            ->where('entity_id', $entity->id)
            ->where('style_module_id', $module->id)
            ->first();

        if ($existing) {
            return $this->buildJourneyPayload($user, $entity);
        }

        if ($module->completion_mode === StyleModule::MODE_MANUAL) {
            StyleModuleProgress::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'entity_id' => $entity->id,
                    'style_module_id' => $module->id,
                ],
                ['checklist' => array_values(array_unique(array_map('strval', $checkIds)))],
            );

            $eval = $this->evaluator->evaluateManual($module->requirements, $checkIds);
            if (! $eval['met']) {
                return array_merge($this->buildJourneyPayload($user, $entity), [
                    'module_eval' => $eval,
                ]);
            }
        } else {
            $items = $this->wardrobeForEntity($user, $entity);
            $eval = $this->evaluator->evaluate($items, $module->requirements);
            if (! $eval['met']) {
                return array_merge($this->buildJourneyPayload($user, $entity), [
                    'module_eval' => $eval,
                ]);
            }
        }

        $this->awardModuleCompletion($user, $entity, $module);
        $this->evaluateAchievements($user);

        return $this->buildJourneyPayload($user, $entity);
    }

    private function awardModuleCompletion(User $user, Entity $entity, StyleModule $module): void
    {
        StyleModuleCompletion::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'entity_id' => $entity->id,
                'style_module_id' => $module->id,
            ],
            [
                'completed_at' => now(),
                'xp_awarded' => (int) $module->xp_reward,
            ],
        );

        StyleModuleProgress::query()
            ->where('user_id', $user->id)
            ->where('entity_id', $entity->id)
            ->where('style_module_id', $module->id)
            ->delete();
    }

    public function evaluateAchievements(User $user): void
    {
        $completions = StyleModuleCompletion::query()
            ->where('user_id', $user->id)
            ->get();
        $completedModuleIds = $completions->pluck('style_module_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
        $modulesCompletedCount = count($completedModuleIds);
        $achievements = StyleAchievement::query()->active()->orderBy('sort_order')->orderBy('id')->get();

        foreach ($achievements as $achievement) {
            $already = StyleAchievementUnlock::query()
                ->where('user_id', $user->id)
                ->where('style_achievement_id', $achievement->id)
                ->exists();
            if ($already) {
                continue;
            }

            $xp = $this->totalXpForUser($user->id);
            if (! $this->achievementRuleMet($achievement->rule ?? [], $modulesCompletedCount, $completedModuleIds, $xp)) {
                continue;
            }

            StyleAchievementUnlock::query()->create([
                'user_id' => $user->id,
                'style_achievement_id' => $achievement->id,
                'unlocked_at' => now(),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $rule
     * @param  list<int>  $completedModuleIds
     */
    private function achievementRuleMet(array $rule, int $modulesCompletedCount, array $completedModuleIds, int $xp): bool
    {
        $type = (string) ($rule['type'] ?? '');

        return match ($type) {
            'modules_completed' => $modulesCompletedCount >= (int) ($rule['count'] ?? 1),
            'xp_total' => $xp >= (int) ($rule['min'] ?? 0),
            'module_ids' => $this->hasAllModuleIds($completedModuleIds, $rule['ids'] ?? []),
            default => false,
        };
    }

    /**
     * @param  list<int>  $have
     * @param  mixed  $need
     */
    private function hasAllModuleIds(array $have, mixed $need): bool
    {
        if (! is_array($need) || $need === []) {
            return false;
        }
        $needIds = array_map('intval', $need);
        foreach ($needIds as $id) {
            if (! in_array($id, $have, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function buildJourneyPayload(User $user, Entity $entity): array
    {
        $items = $this->wardrobeForEntity($user, $entity);
        $modules = StyleModule::query()
            ->active()
            ->visibleForGender($entity->gender)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $completions = StyleModuleCompletion::query()
            ->where('user_id', $user->id)
            ->where('entity_id', $entity->id)
            ->get()
            ->keyBy('style_module_id');

        $progressRows = StyleModuleProgress::query()
            ->where('user_id', $user->id)
            ->where('entity_id', $entity->id)
            ->get()
            ->keyBy('style_module_id');

        $modulePayload = [];
        $doneCount = 0;

        foreach ($modules as $module) {
            $completion = $completions->get($module->id);
            $done = (bool) $completion;
            if ($done) {
                $doneCount++;
            }

            $eval = null;
            $checklist = $progressRows->get($module->id)?->checklist ?? [];

            if (! $done) {
                if ($module->completion_mode === StyleModule::MODE_AUTO) {
                    $eval = $this->evaluator->evaluate($items, $module->requirements);
                } else {
                    $eval = $this->evaluator->evaluateManual(
                        $module->requirements,
                        is_array($checklist) ? $checklist : [],
                    );
                }
            }

            $modulePayload[] = [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'sort_order' => $module->sort_order,
                'gender' => $module->gender,
                'xp_reward' => $module->xp_reward,
                'completion_mode' => $module->completion_mode,
                'requirements' => $module->requirements,
                'completed' => $done,
                'completed_at' => $completion?->completed_at?->toIso8601String(),
                'xp_awarded' => $completion?->xp_awarded,
                'checklist' => $checklist,
                'eval' => $eval,
                'status' => $done ? 'done' : (($eval['met'] ?? false) ? 'ready' : 'in_progress'),
            ];
        }

        $xp = $this->totalXpForUser($user->id);
        $achievements = $this->achievementsPayload($user);

        $total = count($modulePayload);

        return [
            'entity_id' => (int) $entity->id,
            'xp' => $xp,
            'level' => $this->levelForXp($xp),
            'xp_per_level' => (int) config('style_journey.xp_per_level', 100),
            'rank' => $this->rankForUser($user->id),
            'progress' => [
                'completed' => $doneCount,
                'total' => $total,
                'percent' => $total > 0 ? (int) round(($doneCount / $total) * 100) : 0,
            ],
            'modules' => $modulePayload,
            'achievements' => $achievements,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function achievementsPayload(User $user): array
    {
        $unlocks = StyleAchievementUnlock::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('style_achievement_id');

        return StyleAchievement::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (StyleAchievement $a) use ($unlocks) {
                $unlock = $unlocks->get($a->id);

                return [
                    'id' => $a->id,
                    'code' => $a->code,
                    'title' => $a->title,
                    'description' => $a->description,
                    'icon' => $a->icon,
                    'rule' => $a->rule,
                    'xp_bonus' => $a->xp_bonus,
                    'unlocked' => (bool) $unlock,
                    'unlocked_at' => $unlock?->unlocked_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }
}
