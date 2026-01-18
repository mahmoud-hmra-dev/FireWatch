<?php

use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminFireReportController;
use App\Http\Controllers\Api\AdminFireRiskPredictionController;
use App\Http\Controllers\Api\AdminRegionController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\AreaWeatherController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FirePredictionController;
use App\Http\Controllers\Api\FireReportController;
use App\Http\Controllers\Api\FireRiskPredictionController;
use App\Http\Controllers\Api\RegionController;
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

    Route::get('/regions', [RegionController::class, 'index']);
    Route::get('/fire-risk/latest', [FireRiskPredictionController::class, 'latest']);
    Route::post('/fire-reports', [FireReportController::class, 'store']);
    Route::get('/my/fire-reports', [FireReportController::class, 'myReports']);
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

    Route::get('/admin/dashboard/overview', [AdminDashboardController::class, 'overview']);
    Route::get('/admin/regions', [AdminRegionController::class, 'index']);
    Route::post('/admin/regions', [AdminRegionController::class, 'store']);
    Route::patch('/admin/regions/{region}', [AdminRegionController::class, 'update']);
    Route::put('/admin/regions/{region}', [AdminRegionController::class, 'update']);
    Route::delete('/admin/regions/{region}', [AdminRegionController::class, 'destroy']);
    Route::get('/admin/fire-risk/history', [AdminFireRiskPredictionController::class, 'history']);
    Route::get('/admin/fire-reports', [AdminFireReportController::class, 'index']);
});
