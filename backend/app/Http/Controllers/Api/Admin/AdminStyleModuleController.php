<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StyleModule;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminStyleModuleController extends Controller
{
    private function rules(bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'title' => "{$req}|string|max:160",
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'sometimes|boolean',
            'gender' => ['nullable', 'string', Rule::in(StyleModule::GENDERS)],
            'xp_reward' => 'nullable|integer|min:0|max:10000',
            'completion_mode' => ['nullable', 'string', Rule::in(['auto', 'manual'])],
            'requirements' => 'nullable|array',
        ];
    }

    public function index()
    {
        $modules = StyleModule::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $modules]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $data['sort_order'] = $data['sort_order'] ?? 0;
        $data['xp_reward'] = $data['xp_reward'] ?? 25;
        $data['completion_mode'] = $data['completion_mode'] ?? StyleModule::MODE_AUTO;
        $data['is_active'] = $data['is_active'] ?? true;

        $module = StyleModule::query()->create($data);

        return response()->json($module, 201);
    }

    public function update(Request $request, StyleModule $styleModule)
    {
        $data = $request->validate($this->rules(true));
        $styleModule->fill($data);
        $styleModule->save();

        return response()->json($styleModule);
    }

    public function destroy(StyleModule $styleModule)
    {
        $styleModule->delete();

        return response()->json(['ok' => true]);
    }
}
