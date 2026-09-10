<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteProfileRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\RequestLoginCodeRequest;
use App\Http\Requests\Auth\VerifyLoginCodeRequest;
use App\Http\Resources\UserResource;
use App\Mail\LoginCodeMail;
use App\Models\LoginCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function requestCode(RequestLoginCodeRequest $request): JsonResponse
    {
        $email = Str::lower($request->validated('email'));

        LoginCode::query()
            ->where('email', $email)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $loginCode = LoginCode::query()->create([
            'email' => $email,
            'code' => (string) random_int(100000, 999999),
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($email)->send(new LoginCodeMail($loginCode));

        $payload = [
            'message' => 'Code gesendet.',
            'expires_in' => 600,
        ];

        if (config('app.debug')) {
            $payload['debug_code'] = $loginCode->code;
        }

        return response()->json($payload);
    }

    public function verifyCode(VerifyLoginCodeRequest $request): JsonResponse
    {
        $email = Str::lower($request->validated('email'));
        $loginCode = $this->usableCode($email, $request->validated('code'));

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'needs_registration' => true,
            ]);
        }

        $loginCode->markUsed();

        return response()->json([
            'needs_registration' => false,
            'token' => $user->createToken('api')->plainTextToken,
            'user' => UserResource::make($user)->resolve(),
        ]);
    }

    public function completeProfile(CompleteProfileRequest $request): JsonResponse
    {
        $email = Str::lower($request->validated('email'));
        $loginCode = $this->usableCode($email, $request->validated('code'));

        if (User::query()->where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['Dieses Konto existiert bereits.'],
            ]);
        }

        $loginCode->markUsed();

        $user = User::query()->create([
            'first_name' => $request->validated('first_name'),
            'last_name' => $request->validated('last_name'),
            'email' => $email,
            'password' => Str::password(16),
            'address' => $request->validated('address'),
            'phone' => $request->validated('phone'),
            'role' => Role::Bewohner,
        ]);

        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'user' => UserResource::make($user)->resolve(),
        ], 201);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create($request->validated());

        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'user' => UserResource::make($user)->resolve(),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'user' => UserResource::make($user)->resolve(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }

    private function usableCode(string $email, string $code): LoginCode
    {
        $loginCode = LoginCode::query()
            ->valid()
            ->where('email', $email)
            ->where('code', $code)
            ->latest()
            ->first();

        if (! $loginCode) {
            throw ValidationException::withMessages([
                'code' => ['Code ist ungültig oder abgelaufen.'],
            ]);
        }

        return $loginCode;
    }
}
