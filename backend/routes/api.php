<?php

use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\AreaWeatherController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FirePredictionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [UserController::class, 'profile']);

    Route::post('/alerts', [AlertController::class, 'store']);
    Route::patch('/alerts/{alert}', [AlertController::class, 'update']);
    Route::delete('/alerts/{alert}', [AlertController::class, 'destroy']);
    Route::get('/alerts/user', [AlertController::class, 'userAlerts']);
    Route::get('/areas', [AreaController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/alerts', [AlertController::class, 'index']);

    Route::post('/areas', [AreaController::class, 'store']);
    Route::put('/areas/{area}', [AreaController::class, 'update']);
    Route::patch('/areas/{area}', [AreaController::class, 'update']);
    Route::delete('/areas/{area}', [AreaController::class, 'destroy']);
    Route::patch('/areas/{area}/weather', [AreaWeatherController::class, 'update']);

    Route::get('/prediction', [FirePredictionController::class, 'show']);
    Route::patch('/prediction', [FirePredictionController::class, 'toggle']);
});
