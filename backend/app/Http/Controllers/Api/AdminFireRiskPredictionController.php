<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FireRiskPredictionResource;
use App\Models\FireRiskPrediction;
use Illuminate\Http\Request;

class AdminFireRiskPredictionController extends Controller
{
    public function history(Request $request)
    {
        $data = $request->validate([
            'region_id' => ['required', 'integer', 'exists:regions,id'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:200'],
        ]);

        $query = FireRiskPrediction::query()
            ->with('region')
            ->where('region_id', $data['region_id'])
            ->latest('created_at');

        if (isset($data['limit'])) {
            $query->limit($data['limit']);
        }

        return FireRiskPredictionResource::collection($query->get());
    }
}
