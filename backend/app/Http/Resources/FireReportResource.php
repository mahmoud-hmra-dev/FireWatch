<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FireReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'region' => new RegionResource($this->whenLoaded('region')),
        ];
    }
}
