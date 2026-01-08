<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlertStoreRequest;
use App\Http\Resources\AlertResource;
use App\Models\Alert;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class AlertController extends Controller
{
    public function index()
    {
        $alerts = Alert::with(['user', 'area'])->latest()->get();

        return AlertResource::collection($alerts);
    }

    public function store(AlertStoreRequest $request)
    {
        $data = $request->validated();
        $imagePath = $request->file('image')->store('alerts', 'public');

        $alert = Alert::create([
            'user_id' => $request->user()->id,
            'area_id' => $data['area_id'] ?? null,
            'image_path' => $imagePath,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'description' => $data['description'],
            'source' => 'manual',
        ]);

        $this->notifyAdmins($alert, 'Manual alert submitted by user.');

        return (new AlertResource($alert->load(['user', 'area'])))
            ->response()
            ->setStatusCode(201);
    }

    public function userAlerts(Request $request)
    {
        $alerts = $request->user()->alerts()->with('area')->latest()->get();

        return AlertResource::collection($alerts);
    }

    protected function notifyAdmins(Alert $alert, string $message): void
    {
        $admins = User::where('role', 'admin')->get();

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new AdminAlertNotification($alert, $message));
        }
    }
}
