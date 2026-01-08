<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AreaStoreRequest;
use App\Http\Requests\AreaUpdateRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\MessageResource;
use App\Models\Alert;
use App\Models\Area;
use App\Models\FirePredictionSetting;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Support\Facades\Notification;

class AreaController extends Controller
{
    public function index()
    {
        return AreaResource::collection(Area::query()->latest()->get());
    }

    public function store(AreaStoreRequest $request)
    {
        $area = Area::create($request->validated());

        $this->maybeTriggerAutoAlert($area);

        return (new AreaResource($area))
            ->response()
            ->setStatusCode(201);
    }

    public function update(AreaUpdateRequest $request, Area $area)
    {
        $area->update($request->validated());

        $this->maybeTriggerAutoAlert($area);

        return new AreaResource($area);
    }

    public function destroy(Area $area)
    {
        $area->delete();

        return new MessageResource(['message' => 'Area deleted.']);
    }

    protected function maybeTriggerAutoAlert(Area $area): void
    {
        if ($area->risk_level !== 'high' || ! FirePredictionSetting::isEnabled()) {
            return;
        }

        $alert = Alert::create([
            'area_id' => $area->id,
            'description' => "Auto alert: High risk detected in {$area->name}.",
            'source' => 'auto',
        ]);

        $admins = User::where('role', 'admin')->get();

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new AdminAlertNotification($alert, 'High risk detected by prediction system.'));
        }
    }
}
