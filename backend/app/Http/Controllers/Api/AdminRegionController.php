<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegionStoreRequest;
use App\Http\Requests\RegionUpdateRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\RegionResource;
use App\Models\Region;

class AdminRegionController extends Controller
{
    public function index()
    {
        return RegionResource::collection(Region::query()->latest()->get());
    }

    public function store(RegionStoreRequest $request)
    {
        $region = Region::create($request->validated());

        return (new RegionResource($region))
            ->response()
            ->setStatusCode(201);
    }

    public function update(RegionUpdateRequest $request, Region $region)
    {
        $region->update($request->validated());

        return new RegionResource($region);
    }

    public function destroy(Region $region)
    {
        $region->delete();

        return new MessageResource(['message' => 'Region deleted.']);
    }
}
