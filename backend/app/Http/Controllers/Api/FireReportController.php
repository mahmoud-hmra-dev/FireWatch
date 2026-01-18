<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FireReportStoreRequest;
use App\Http\Resources\FireReportResource;
use App\Models\FireReport;
use Illuminate\Http\Request;

class FireReportController extends Controller
{
    public function store(FireReportStoreRequest $request)
    {
        $data = $request->validated();
        $path = $request->file('image')->storePublicly('fire-reports', 'public');

        $report = FireReport::create([
            'user_id' => $request->user()->id,
            'region_id' => $data['region_id'],
            'image_path' => $path,
            'lat' => $data['lat'],
            'lng' => $data['lng'],
            'status' => 'submitted',
        ]);

        return (new FireReportResource($report->load('region')))
            ->response()
            ->setStatusCode(201);
    }

    public function myReports(Request $request)
    {
        $reports = FireReport::query()
            ->with('region')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return FireReportResource::collection($reports);
    }
}
