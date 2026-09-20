<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TenantProvisioner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
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
            'fashionStores' => $this->normalizeFashionStores($user->fashion_stores),
            'role' => 'creator',
            'isAdmin' => $user->isAdmin(),
            /** Only this account may claim pre-auth browser localStorage into its workspace. */
            'isLegacyOwner' => $legacyOwnerId !== null && (int) $user->id === (int) $legacyOwnerId,
        ];
    }

    /**
     * @param  mixed  $raw
     * @return list<array{id: string, name: string, brand: ?string, url: string}>
     */
    private function normalizeFashionStores(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $row) {
            if (! is_array($row)) {
                continue;
            }
            $name = trim((string) ($row['name'] ?? ''));
            $url = trim((string) ($row['url'] ?? ''));
            if ($name === '' || $url === '') {
                continue;
            }
            $out[] = [
                'id' => (string) ($row['id'] ?? uniqid('fs_', true)),
                'name' => mb_substr($name, 0, 80),
                'brand' => isset($row['brand']) && trim((string) $row['brand']) !== ''
                    ? mb_substr(trim((string) $row['brand']), 0, 80)
                    : null,
                'url' => mb_substr($url, 0, 2048),
            ];
        }

        return array_slice($out, 0, 30);
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
            'bio' => ['nullable', 'string', 'max:2000'],
            'netSalaryPln' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'fashionStores' => ['sometimes', 'array', 'max:30'],
            'fashionStores.*.id' => ['nullable', 'string', 'max:64'],
            'fashionStores.*.name' => ['required_with:fashionStores', 'string', 'max:80'],
            'fashionStores.*.brand' => ['nullable', 'string', 'max:80'],
            'fashionStores.*.url' => ['required_with:fashionStores', 'url', 'max:2048'],
        ]);

        $user->fill([
            'name' => $data['displayName'],
            'username' => $data['username'],
            'email' => $data['email'],
            'bio' => $data['bio'] ?: null,
            'net_salary_pln' => array_key_exists('netSalaryPln', $data)
                ? ($data['netSalaryPln'] === null ? null : (float) $data['netSalaryPln'])
                : $user->net_salary_pln,
        ]);

        if (array_key_exists('fashionStores', $data)) {
            $user->fashion_stores = $this->normalizeFashionStores($data['fashionStores']);
        }

        $user->save();

        return response()->json([
            'user' => $this->toApi($user->fresh()),
        ]);
    }

    /**
     * POST /api/auth/avatar — multipart photo (preferably pre-cropped square).
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:5120'],
        ]);

        $user = $request->user();
        $previous = $user->avatar;

        $stored = Storage::disk('public')->putFile(
            'avatars/'.date('Y/m'),
            $request->file('photo')
        );

        $user->avatar = Storage::disk('public')->url($stored);
        $user->save();

        $this->deleteOwnedAvatarFile($previous);

        return response()->json([
            'user' => $this->toApi($user->fresh()),
        ]);
    }

    /**
     * DELETE /api/auth/avatar
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        $previous = $user->avatar;
        $user->avatar = null;
        $user->save();

        $this->deleteOwnedAvatarFile($previous);

        return response()->json([
            'user' => $this->toApi($user->fresh()),
        ]);
    }

    private function deleteOwnedAvatarFile(?string $url): void
    {
        if (! $url) {
            return;
        }

        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        if (! is_string($path) || ! str_starts_with($path, '/storage/avatars/')) {
            return;
        }

        $relative = ltrim(substr($path, strlen('/storage/')), '/');
        if ($relative !== '') {
            Storage::disk('public')->delete($relative);
        }
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
