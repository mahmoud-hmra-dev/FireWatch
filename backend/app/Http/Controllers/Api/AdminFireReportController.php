<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FireReportResource;
use App\Models\FireReport;

class AdminFireReportController extends Controller
{
    public function index()
    {
        $reports = FireReport::query()
            ->with(['user', 'region'])
            ->latest()
            ->get();

        return FireReportResource::collection($reports);
    }
}
