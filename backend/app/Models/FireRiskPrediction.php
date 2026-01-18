<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FireRiskPrediction extends Model
{
    /** @use HasFactory<\Database\Factories\FireRiskPredictionFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'region_id',
        'risk_score',
        'risk_level',
        'confidence',
        'explanation',
        'source',
        'created_at',
    ];

    protected $casts = [
        'risk_score' => 'float',
        'confidence' => 'float',
        'created_at' => 'datetime',
    ];

    public function region()
    {
        return $this->belongsTo(Region::class);
    }
}
