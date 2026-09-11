<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingsTarget;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SavingsTargetController extends Controller
{
    private const M2M_ID = '__m2m__';

    private const TYPES = ['m2m', 'fixed'];

    private const COLORS = ['indigo', 'green', 'purple', 'blue', 'yellow', 'pink', 'red', 'gray'];

    private function toApi(SavingsTarget $target): array
    {
        return [
            'id' => $target->id,
            'name' => $target->name,
            'type' => $target->type,
            'amount' => $target->amount,
            'color' => $target->color,
            'is_primary' => (bool) $target->is_primary,
            'included_asset_ids' => $target->included_asset_ids,
            'progress_snapshots' => $target->progress_snapshots ?? [],
            'sort_order' => (int) $target->sort_order,
        ];
    }

    private function normalizeProgressSnapshots(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $out = [];
        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }
            $date = isset($row['date']) ? trim((string) $row['date']) : '';
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                continue;
            }
            $value = max(0, (float) ($row['value'] ?? 0));
            $out[$date] = ['date' => $date, 'value' => $value];
        }

        ksort($out);

        return array_values($out);
    }

    private function appendProgressSnapshot(SavingsTarget $target, string $date, float $value): void
    {
        $snapshots = $this->normalizeProgressSnapshots($target->progress_snapshots);
        $filtered = array_values(array_filter($snapshots, fn ($s) => $s['date'] !== $date));
        $filtered[] = ['date' => $date, 'value' => $value];
        usort($filtered, fn ($a, $b) => strcmp($a['date'], $b['date']));
        if (count($filtered) > 120) {
            $filtered = array_slice($filtered, -120);
        }
        $target->progress_snapshots = $filtered;
    }

    private function ensureM2mExists(): void
    {
        if (SavingsTarget::query()->whereKey(self::M2M_ID)->exists()) {
            return;
        }

        $hasPrimary = SavingsTarget::query()->where('is_primary', true)->exists();

        SavingsTarget::query()->create([
            'id' => self::M2M_ID,
            'name' => 'M2M Expected Savings',
            'type' => 'm2m',
            'amount' => null,
            'color' => 'indigo',
            'is_primary' => ! $hasPrimary,
            'included_asset_ids' => null,
            'sort_order' => 0,
        ]);
    }

    private function normalizeIncludedAssetIds(mixed $raw): ?array
    {
        if ($raw === null) {
            return null;
        }

        if (! is_array($raw)) {
            return [];
        }

        $ids = array_values(array_unique(array_filter(array_map(
            fn ($id) => is_string($id) || is_numeric($id) ? trim((string) $id) : '',
            $raw
        ))));

        return $ids;
    }

    public function index()
    {
        $this->ensureM2mExists();

        $targets = SavingsTarget::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $primary = $targets->firstWhere('is_primary', true);

        return response()->json([
            'targets' => $targets->map(fn (SavingsTarget $t) => $this->toApi($t))->values(),
            'primary_target_id' => $primary?->id ?? self::M2M_ID,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'type' => ['required', 'string', Rule::in(self::TYPES)],
            'amount' => 'nullable|numeric|min:0',
            'color' => ['nullable', 'string', Rule::in(self::COLORS)],
            'included_asset_ids' => 'nullable|array',
            'included_asset_ids.*' => 'string|max:64',
        ]);

        if ($data['type'] === 'm2m') {
            return response()->json(['message' => 'Target M2M jest już zdefiniowany w systemie.'], 422);
        }

        $maxOrder = (int) SavingsTarget::query()->max('sort_order');

        $target = SavingsTarget::query()->create([
            'id' => (string) Str::uuid(),
            'name' => trim($data['name']),
            'type' => 'fixed',
            'amount' => $data['amount'] ?? 0,
            'color' => $data['color'] ?? 'green',
            'is_primary' => false,
            'included_asset_ids' => $this->normalizeIncludedAssetIds($data['included_asset_ids'] ?? null),
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json($this->toApi($target), 201);
    }

    public function update(Request $request, string $savingsTarget)
    {
        $target = SavingsTarget::query()->findOrFail($savingsTarget);

        $data = $request->validate([
            'name' => 'sometimes|string|max:80',
            'amount' => 'nullable|numeric|min:0',
            'color' => ['sometimes', 'string', Rule::in(self::COLORS)],
            'included_asset_ids' => 'nullable|array',
            'included_asset_ids.*' => 'string|max:64',
        ]);

        if (array_key_exists('name', $data)) {
            $target->name = trim($data['name']) ?: $target->name;
        }

        if (array_key_exists('color', $data)) {
            $target->color = $data['color'];
        }

        if ($target->type === 'fixed' && array_key_exists('amount', $data)) {
            $target->amount = $data['amount'] ?? 0;
        }

        if (array_key_exists('included_asset_ids', $data)) {
            $target->included_asset_ids = $this->normalizeIncludedAssetIds($data['included_asset_ids']);
        }

        $target->save();

        return response()->json($this->toApi($target->fresh()));
    }

    public function updateIncludedAssets(Request $request, string $savingsTarget)
    {
        $target = SavingsTarget::query()->findOrFail($savingsTarget);

        $data = $request->validate([
            'included_asset_ids' => 'present|nullable|array',
            'included_asset_ids.*' => 'string|max:64',
        ]);

        $target->included_asset_ids = $this->normalizeIncludedAssetIds($data['included_asset_ids']);
        $target->save();

        return response()->json($this->toApi($target->fresh()));
    }

    public function recordProgress(Request $request, string $savingsTarget)
    {
        $target = SavingsTarget::query()->findOrFail($savingsTarget);

        $data = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'value' => 'required|numeric|min:0',
        ]);

        $date = $data['date'] ?? now()->format('Y-m-d');
        $this->appendProgressSnapshot($target, $date, (float) $data['value']);
        $target->save();

        return response()->json($this->toApi($target->fresh()));
    }

    public function updateProgressSnapshots(Request $request, string $savingsTarget)
    {
        $target = SavingsTarget::query()->findOrFail($savingsTarget);

        $data = $request->validate([
            'snapshots' => 'required|array',
            'snapshots.*.date' => 'required|date_format:Y-m-d',
            'snapshots.*.value' => 'required|numeric|min:0',
        ]);

        $snapshots = $this->normalizeProgressSnapshots($data['snapshots']);
        if (count($snapshots) > 120) {
            $snapshots = array_slice($snapshots, -120);
        }
        $target->progress_snapshots = $snapshots;
        $target->save();

        return response()->json($this->toApi($target->fresh()));
    }

    public function setPrimary(string $savingsTarget)
    {
        $target = SavingsTarget::query()->findOrFail($savingsTarget);

        SavingsTarget::query()->update(['is_primary' => false]);
        $target->is_primary = true;
        $target->save();

        return response()->json($this->toApi($target->fresh()));
    }

    public function destroy(string $savingsTarget)
    {
        $target = SavingsTarget::query()->findOrFail($savingsTarget);

        if ($target->id === self::M2M_ID) {
            return response()->json(['message' => 'Nie można usunąć targetu M2M.'], 422);
        }

        $wasPrimary = $target->is_primary;
        $target->delete();

        if ($wasPrimary) {
            $fallback = SavingsTarget::query()->orderBy('sort_order')->first();
            if ($fallback) {
                $fallback->is_primary = true;
                $fallback->save();
            }
        }

        return response()->noContent();
    }
}
