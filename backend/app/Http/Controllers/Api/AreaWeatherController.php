<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AreaWeatherRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\MessageResource;
use App\Models\Alert;
use App\Models\Area;
use App\Models\FirePredictionSetting;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

class AreaWeatherController extends Controller
{
    public function update(AreaWeatherRequest $request, Area $area)
    {
        $data = $request->validated();

        if ($request->boolean('fetch')) {
            $response = Http::get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'current' => 'temperature_2m,relative_humidity_2m,wind_speed_10m',
            ]);

            if (! $response->successful()) {
                return (new MessageResource(['message' => 'Unable to fetch weather data.']))
                    ->response()
                    ->setStatusCode(502);
            }

            $current = $response->json('current');

            if (! is_array($current)) {
                return (new MessageResource(['message' => 'Weather data format invalid.']))
                    ->response()
                    ->setStatusCode(502);
            }

            $area->update([
                'temperature' => $current['temperature_2m'] ?? null,
                'humidity' => $current['relative_humidity_2m'] ?? null,
                'wind_speed' => $current['wind_speed_10m'] ?? null,
            ]);
        } else {
            $area->update([
                'temperature' => $data['temperature'],
                'humidity' => $data['humidity'],
                'wind_speed' => $data['wind_speed'],
            ]);
        }

        $this->maybeTriggerAutoAlert($area);

        return new AreaResource($area);
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
