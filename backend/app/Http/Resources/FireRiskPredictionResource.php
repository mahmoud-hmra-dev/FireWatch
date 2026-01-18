<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FireRiskPredictionResource extends JsonResource
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
            'risk_score' => $this->risk_score,
            'risk_level' => $this->risk_level,
            'confidence' => $this->confidence,
            'explanation' => $this->explanation,
            'source' => $this->source,
            'created_at' => $this->created_at,
            'region' => new RegionResource($this->whenLoaded('region')),
        ];
    }
}
