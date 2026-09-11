<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::with(['items.images', 'items.collectionGroup', 'items.defaultPersona'])
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = preg_replace('/\s+/', '', strtolower(trim($data['name'])));

        if ($name === '') {
            throw ValidationException::withMessages([
                'name' => ['Podaj nazwę kolekcji.'],
            ]);
        }

        if (Category::where('name', $name)->exists()) {
            throw ValidationException::withMessages([
                'name' => ['Kolekcja o tej nazwie już istnieje.'],
            ]);
        }

        $category = Category::create(['name' => $name]);

        return response()->json($category, 201);
    }
}
