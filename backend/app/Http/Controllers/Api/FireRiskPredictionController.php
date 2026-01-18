<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FireRiskPredictionResource;
use App\Http\Resources\MessageResource;
use App\Models\Region;
use App\Services\FireRiskPredictionService;
use Illuminate\Http\Request;

class FireRiskPredictionController extends Controller
{
    public function latest(Request $request, FireRiskPredictionService $service)
    {
        $data = $request->validate([
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'generate' => ['sometimes', 'boolean'],
            'temperature' => ['sometimes', 'numeric'],
            'humidity' => ['sometimes', 'numeric'],
            'wind_speed' => ['sometimes', 'numeric'],
            'rainfall' => ['sometimes', 'numeric'],
            'vegetation_index' => ['sometimes', 'numeric'],
        ]);

        $region = Region::findOrFail($data['region_id']);
        $shouldGenerate = $request->boolean('generate');

        $environmentalData = collect($data)
            ->except(['region_id', 'generate'])
            ->toArray();

        if ($shouldGenerate) {
            $prediction = $service->generatePrediction($region, $environmentalData);

            return new FireRiskPredictionResource($prediction->load('region'));
        }

        $prediction = $region->fireRiskPredictions()
            ->latest('created_at')
            ->first();

        if (! $prediction) {
            return (new MessageResource(['message' => 'No prediction available for this region.']))
                ->response()
                ->setStatusCode(404);
        }

        return new FireRiskPredictionResource($prediction->load('region'));
    }
}
