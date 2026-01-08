<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AlertResource extends JsonResource
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
            'source' => $this->source,
            'description' => $this->description,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'created_at' => $this->created_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'area' => new AreaResource($this->whenLoaded('area')),
        ];
    }
}
