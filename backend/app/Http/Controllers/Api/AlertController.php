<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlertStoreRequest;
use App\Http\Requests\AlertUpdateRequest;
use App\Http\Resources\AlertResource;
use App\Models\Alert;
use App\Models\Area;
use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

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
        $area = $this->resolveArea(
            $data['area_id'] ?? null,
            (float) $data['latitude'],
            (float) $data['longitude']
        );

        $alert = Alert::create([
            'user_id' => $request->user()->id,
            'area_id' => $area?->id,
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

    public function update(AlertUpdateRequest $request, Alert $alert)
    {
        $this->ensureOwner($request, $alert);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($alert->image_path) {
                Storage::disk('public')->delete($alert->image_path);
            }
            $alert->image_path = $request->file('image')->store('alerts', 'public');
        }

        if (array_key_exists('latitude', $data)) {
            $alert->latitude = $data['latitude'];
        }

        if (array_key_exists('longitude', $data)) {
            $alert->longitude = $data['longitude'];
        }

        if (array_key_exists('description', $data)) {
            $alert->description = $data['description'];
        }

        if (array_key_exists('area_id', $data)) {
            $alert->area_id = $data['area_id'];
        } else {
            $lat = array_key_exists('latitude', $data) ? $data['latitude'] : $alert->latitude;
            $lng = array_key_exists('longitude', $data) ? $data['longitude'] : $alert->longitude;
            $shouldResolve = $alert->area_id === null
                || array_key_exists('latitude', $data)
                || array_key_exists('longitude', $data);

            if ($shouldResolve && $lat !== null && $lng !== null) {
                $area = $this->resolveArea(null, (float) $lat, (float) $lng);
                $alert->area_id = $area?->id;
            }
        }

        $alert->save();

        return new AlertResource($alert->load(['user', 'area']));
    }

    public function destroy(Request $request, Alert $alert)
    {
        $this->ensureOwner($request, $alert);

        if ($alert->image_path) {
            Storage::disk('public')->delete($alert->image_path);
        }

        $alert->delete();

        return response()->json(['message' => 'Alert deleted.']);
    }

    protected function notifyAdmins(Alert $alert, string $message): void
    {
        $admins = User::where('role', 'admin')->get();

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new AdminAlertNotification($alert, $message));
        }
    }

    protected function ensureOwner(Request $request, Alert $alert): void
    {
        if ($alert->user_id !== $request->user()->id || $alert->source !== 'manual') {
            abort(403, 'Not allowed.');
        }
    }

    protected function resolveArea(?int $areaId, float $lat, float $lng): ?Area
    {
        if ($areaId) {
            $existing = Area::find($areaId);
            if ($existing) {
                return $existing;
            }
        }

        $area = $this->findAreaContainingPoint($lat, $lng);
        if ($area) {
            return $area;
        }

        $geo = $this->reverseGeocode($lat, $lng);
        if ($geo) {
            $existing = Area::whereRaw('LOWER(name) = ?', [strtolower($geo['name'])])->first();
            if ($existing) {
                return $existing;
            }

            return Area::create([
                'name' => $geo['name'],
                'coordinates' => $geo['coordinates'],
                'risk_level' => 'low',
                'temperature' => null,
                'humidity' => null,
                'wind_speed' => null,
            ]);
        }

        return $this->findNearestArea($lat, $lng);
    }

    protected function findAreaContainingPoint(float $lat, float $lng): ?Area
    {
        $areas = Area::all();
        foreach ($areas as $area) {
            if (!is_array($area->coordinates)) {
                continue;
            }
            if ($this->isPointInPolygon($lat, $lng, $area->coordinates)) {
                return $area;
            }
        }

        return null;
    }

    protected function isPointInPolygon(float $lat, float $lng, array $polygon): bool
    {
        $count = count($polygon);
        if ($count < 3) {
            return false;
        }

        $inside = false;
        $j = $count - 1;

        for ($i = 0; $i < $count; $i++) {
            $xi = (float) ($polygon[$i]['lng'] ?? 0);
            $yi = (float) ($polygon[$i]['lat'] ?? 0);
            $xj = (float) ($polygon[$j]['lng'] ?? 0);
            $yj = (float) ($polygon[$j]['lat'] ?? 0);

            $intersect = (($yi > $lat) !== ($yj > $lat))
                && ($lng < ($xj - $xi) * ($lat - $yi) / (($yj - $yi) ?: 1e-12) + $xi);

            if ($intersect) {
                $inside = ! $inside;
            }

            $j = $i;
        }

        return $inside;
    }

    protected function reverseGeocode(float $lat, float $lng): ?array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'FireWatch/1.0',
                'Accept-Language' => 'en',
            ])->get('https://nominatim.openstreetmap.org/reverse', [
                'format' => 'jsonv2',
                'lat' => $lat,
                'lon' => $lng,
                'zoom' => 12,
                'addressdetails' => 1,
            ]);

            if (! $response->ok()) {
                return null;
            }

            $payload = $response->json();
            $address = $payload['address'] ?? [];
            $primary = $address['city']
                ?? $address['town']
                ?? $address['village']
                ?? $address['municipality']
                ?? $address['county']
                ?? $address['state']
                ?? null;

            $country = $address['country'] ?? null;
            $name = $primary && $country ? "{$primary}, {$country}" : ($primary ?? ($payload['display_name'] ?? null));

            if (! $name) {
                return null;
            }
            $name = trim($name);
            if (strlen($name) > 255) {
                $name = substr($name, 0, 255);
            }

            $coordinates = $this->boundingBoxToPolygon($payload['boundingbox'] ?? null, $lat, $lng);

            return [
                'name' => $name,
                'coordinates' => $coordinates,
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function boundingBoxToPolygon($boundingBox, float $lat, float $lng): array
    {
        if (is_array($boundingBox) && count($boundingBox) === 4) {
            $south = (float) $boundingBox[0];
            $north = (float) $boundingBox[1];
            $west = (float) $boundingBox[2];
            $east = (float) $boundingBox[3];
        } else {
            $delta = 0.02;
            $south = $lat - $delta;
            $north = $lat + $delta;
            $west = $lng - $delta;
            $east = $lng + $delta;
        }

        return [
            ['lat' => $south, 'lng' => $west],
            ['lat' => $south, 'lng' => $east],
            ['lat' => $north, 'lng' => $east],
            ['lat' => $north, 'lng' => $west],
        ];
    }

    protected function findNearestArea(float $lat, float $lng): ?Area
    {
        $areas = Area::all();
        $nearest = null;
        $shortest = PHP_FLOAT_MAX;

        foreach ($areas as $area) {
            if (!is_array($area->coordinates)) {
                continue;
            }
            $center = $this->getAreaCenter($area->coordinates);
            if (! $center) {
                continue;
            }

            $distance = $this->haversineDistance($lat, $lng, $center['lat'], $center['lng']);
            if ($distance < $shortest) {
                $shortest = $distance;
                $nearest = $area;
            }
        }

        return $nearest;
    }

    protected function getAreaCenter(array $coordinates): ?array
    {
        if (count($coordinates) === 0) {
            return null;
        }

        $lat = 0.0;
        $lng = 0.0;
        $count = 0;

        foreach ($coordinates as $point) {
            if (!isset($point['lat'], $point['lng'])) {
                continue;
            }
            $lat += (float) $point['lat'];
            $lng += (float) $point['lng'];
            $count++;
        }

        if ($count === 0) {
            return null;
        }

        return [
            'lat' => $lat / $count,
            'lng' => $lng / $count,
        ];
    }

    protected function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371;
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $r * $c;
    }
}
