<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PredictionToggleRequest;
use App\Http\Resources\PredictionStatusResource;
use App\Models\FirePredictionSetting;

class FirePredictionController extends Controller
{
    public function show()
    {
        return new PredictionStatusResource(FirePredictionSetting::current());
    }

    public function toggle(PredictionToggleRequest $request)
    {
        $setting = FirePredictionSetting::setEnabled($request->validated()['is_enabled']);

        return new PredictionStatusResource($setting);
    }
}
