<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FireReport extends Model
{
    /** @use HasFactory<\Database\Factories\FireReportFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'region_id',
        'image_path',
        'lat',
        'lng',
        'status',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function region()
    {
        return $this->belongsTo(Region::class);
    }
}
