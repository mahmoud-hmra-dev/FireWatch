<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FireRiskPredictionResource;
use App\Models\FireReport;
use App\Models\FireRiskPrediction;
use App\Models\Region;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function overview()
    {
        $reportStatusCounts = FireReport::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $latestPredictions = FireRiskPrediction::query()
            ->with('region')
            ->latest('created_at')
            ->limit(6)
            ->get();

        return response()->json([
            'regions' => [
                'total' => Region::count(),
                'active' => Region::where('is_active', true)->count(),
            ],
            'fire_reports' => [
                'total' => FireReport::count(),
                'by_status' => $reportStatusCounts,
            ],
            'latest_predictions' => FireRiskPredictionResource::collection($latestPredictions),
        ]);
    }
}
