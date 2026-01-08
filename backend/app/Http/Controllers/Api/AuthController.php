<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\AuthResource;
use App\Http\Resources\MessageResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'user',
        ]);

        $tokenName = $data['device_name'] ?? 'api-token';
        $token = $user->createToken($tokenName)->plainTextToken;

        return (new AuthResource([
            'token' => $token,
            'user' => $user,
        ]))->response()->setStatusCode(201);
    }

    public function login(LoginRequest $request)
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return (new MessageResource(['message' => 'Invalid credentials.']))
                ->response()
                ->setStatusCode(422);
        }

        $tokenName = $data['device_name'] ?? 'api-token';
        $token = $user->createToken($tokenName)->plainTextToken;

        return new AuthResource([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return new MessageResource(['message' => 'Logged out.']);
    }
}
