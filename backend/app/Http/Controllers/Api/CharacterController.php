<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use Illuminate\Http\Request;

class CharacterController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'entity_id' => 'required|exists:entities,id',
            'name' => 'required|string|max:255',
        ]);

        return Character::create($data);
    }

    public function show(Character $character)
    {
        return $character->load('items');
    }

    public function update(Request $request, Character $character)
    {
        $character->update($request->all());
        return $character;
    }

    public function destroy(Character $character)
    {
        $character->delete();
        return response()->json(null, 204);
    }
}