<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StyleAchievement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminStyleAchievementController extends Controller
{
    private function rules(bool $partial = false, ?StyleAchievement $ignore = null): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'code' => [
                $req,
                'string',
                'max:64',
                'alpha_dash',
                Rule::unique('style_achievements', 'code')->ignore($ignore?->id),
            ],
            'title' => "{$req}|string|max:160",
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:64',
            'rule' => "{$req}|array",
            'xp_bonus' => 'nullable|integer|min:0|max:10000',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer|min:0|max:9999',
        ];
    }

    public function index()
    {
        $rows = StyleAchievement::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $data['code'] = strtolower($data['code']);
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;

        $row = StyleAchievement::query()->create($data);

        return response()->json($row, 201);
    }

    public function update(Request $request, StyleAchievement $styleAchievement)
    {
        $data = $request->validate($this->rules(true, $styleAchievement));
        if (isset($data['code'])) {
            $data['code'] = strtolower($data['code']);
        }
        $styleAchievement->fill($data);
        $styleAchievement->save();

        return response()->json($styleAchievement);
    }

    public function destroy(StyleAchievement $styleAchievement)
    {
        $styleAchievement->delete();

        return response()->json(['ok' => true]);
    }
}
