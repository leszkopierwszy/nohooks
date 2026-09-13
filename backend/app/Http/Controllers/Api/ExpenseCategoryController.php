<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        return ExpenseCategory::query()
            ->orderByDesc('is_builtin')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:64',
        ]);

        $name = trim(preg_replace('/\s+/u', ' ', $data['name']) ?? '');
        if ($name === '') {
            throw ValidationException::withMessages([
                'name' => ['Podaj nazwę kategorii.'],
            ]);
        }

        $slug = $this->slugify($name);
        if ($slug === '') {
            throw ValidationException::withMessages([
                'name' => ['Nieprawidłowa nazwa kategorii.'],
            ]);
        }

        $existing = ExpenseCategory::query()
            ->where(function ($q) use ($slug, $name) {
                $q->where('slug', $slug)
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($name)]);
            })
            ->first();

        if ($existing) {
            return response()->json($existing, 200);
        }

        $category = ExpenseCategory::create([
            'slug' => $slug,
            'name' => mb_strtoupper(mb_substr($name, 0, 1)).mb_substr($name, 1),
            'is_builtin' => false,
        ]);

        return response()->json($category, 201);
    }

    private function slugify(string $label): string
    {
        $slug = Str::slug($label, '-');
        if ($slug !== '') {
            return mb_substr($slug, 0, 64);
        }

        // Fallback when Str::slug strips everything (e.g. emoji-only).
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $label) ?: $label;
        $fallback = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $ascii) ?? '');
        $fallback = trim($fallback, '-');

        return mb_substr($fallback, 0, 64);
    }
}
