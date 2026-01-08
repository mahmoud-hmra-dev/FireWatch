<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $fillable = [
        'name',
        'coordinates',
        'risk_level',
        'temperature',
        'humidity',
        'wind_speed',
    ];

    protected $casts = [
        'coordinates' => 'array',
        'temperature' => 'decimal:2',
        'humidity' => 'decimal:2',
        'wind_speed' => 'decimal:2',
    ];

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }
}
