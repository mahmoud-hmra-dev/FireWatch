<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FirePredictionSetting extends Model
{
    protected $fillable = [
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public static function current(): self
    {
        $setting = static::query()->first();

        if (! $setting) {
            $setting = static::query()->create(['is_enabled' => false]);
        }

        return $setting;
    }

    public static function isEnabled(): bool
    {
        return static::current()->is_enabled;
    }

    public static function setEnabled(bool $enabled): self
    {
        $setting = static::current();
        $setting->is_enabled = $enabled;
        $setting->save();

        return $setting;
    }
}
