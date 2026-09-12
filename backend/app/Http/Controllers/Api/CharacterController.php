<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\Entity;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CharacterController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'entity_id' => [
                'required',
                Rule::exists('entities', 'id')->where(fn ($q) => $q->where('user_id', auth()->id())),
            ],
            'name' => 'required|string|max:255',
        ]);

        return Character::create($data);
    }

    public function show(Character $character)
    {
        $this->authorizeOwned($character);

        return $character->load('items');
    }

    public function update(Request $request, Character $character)
    {
        $this->authorizeOwned($character);
        $character->update($request->all());

        return $character;
    }

    public function destroy(Character $character)
    {
        $this->authorizeOwned($character);
        $character->delete();

        return response()->json(null, 204);
    }

    private function authorizeOwned(Character $character): void
    {
        $owned = Entity::query()->whereKey($character->entity_id)->exists();
        abort_unless($owned, 404);
    }
}
