<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function toApi(User $user): array
    {
        static $legacyOwnerId = null;
        $legacyOwnerId ??= User::query()->orderBy('id')->value('id');

        return [
            'id' => $user->id,
            'username' => $user->username,
            'displayName' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'bio' => $user->bio,
            'netSalaryPln' => $user->net_salary_pln !== null ? (float) $user->net_salary_pln : 0.0,
            'role' => 'creator',
            /** Only this account may claim pre-auth browser localStorage into its workspace. */
            'isLegacyOwner' => $legacyOwnerId !== null && (int) $user->id === (int) $legacyOwnerId,
        ];
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'displayName' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'max:60', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::query()->create([
            'name' => $data['displayName'],
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        app(TenantProvisioner::class)->provision($user);

        $token = $user->createToken('panel')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->toApi($user),
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        $token = $user->createToken('panel')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->toApi($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $this->toApi($request->user()),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'displayName' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'max:60', 'alpha_dash', 'unique:users,username,'.$user->id],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'avatar' => ['nullable', 'string', 'max:2048'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'netSalaryPln' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
        ]);

        $user->fill([
            'name' => $data['displayName'],
            'username' => $data['username'],
            'email' => $data['email'],
            'avatar' => $data['avatar'] ?: null,
            'bio' => $data['bio'] ?: null,
            'net_salary_pln' => array_key_exists('netSalaryPln', $data)
                ? ($data['netSalaryPln'] === null ? null : (float) $data['netSalaryPln'])
                : $user->net_salary_pln,
        ])->save();

        return response()->json([
            'user' => $this->toApi($user->fresh()),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($data['currentPassword'], $user->password)) {
            throw ValidationException::withMessages([
                'currentPassword' => ['Current password is incorrect.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        return response()->json(['ok' => true]);
    }
}
