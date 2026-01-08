<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\Area;
use App\Models\FirePredictionSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@firewatch.test'],
            [
                'name' => 'FireWatch Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        $user = User::updateOrCreate(
            ['email' => 'user@firewatch.test'],
            [
                'name' => 'Field Reporter',
                'password' => Hash::make('password'),
                'role' => 'user',
            ]
        );

        $areas = [
            [
                'name' => 'Tartus Coast',
                'coordinates' => [
                    ['lat' => 34.9105, 'lng' => 35.8856],
                    ['lat' => 34.9398, 'lng' => 35.9442],
                    ['lat' => 34.8957, 'lng' => 36.0021],
                    ['lat' => 34.8652, 'lng' => 35.9424],
                ],
                'risk_level' => 'medium',
                'temperature' => 29.8,
                'humidity' => 61.4,
                'wind_speed' => 18.1,
            ],
            [
                'name' => 'Latakia Highlands',
                'coordinates' => [
                    ['lat' => 35.6052, 'lng' => 36.0159],
                    ['lat' => 35.6337, 'lng' => 36.0742],
                    ['lat' => 35.5891, 'lng' => 36.1268],
                    ['lat' => 35.5612, 'lng' => 36.0643],
                ],
                'risk_level' => 'high',
                'temperature' => 34.6,
                'humidity' => 28.9,
                'wind_speed' => 27.4,
            ],
            [
                'name' => 'Aleppo Outskirts',
                'coordinates' => [
                    ['lat' => 36.2491, 'lng' => 37.0403],
                    ['lat' => 36.2734, 'lng' => 37.1019],
                    ['lat' => 36.2218, 'lng' => 37.1452],
                    ['lat' => 36.1997, 'lng' => 37.0771],
                ],
                'risk_level' => 'medium',
                'temperature' => 33.1,
                'humidity' => 31.8,
                'wind_speed' => 16.5,
            ],
            [
                'name' => 'Homs Plains',
                'coordinates' => [
                    ['lat' => 34.7014, 'lng' => 36.6472],
                    ['lat' => 34.7318, 'lng' => 36.7056],
                    ['lat' => 34.6762, 'lng' => 36.7541],
                    ['lat' => 34.6475, 'lng' => 36.6904],
                ],
                'risk_level' => 'low',
                'temperature' => 28.4,
                'humidity' => 49.6,
                'wind_speed' => 12.3,
            ],
            [
                'name' => 'Damascus Valley',
                'coordinates' => [
                    ['lat' => 33.5312, 'lng' => 36.2224],
                    ['lat' => 33.5599, 'lng' => 36.2817],
                    ['lat' => 33.5038, 'lng' => 36.3199],
                    ['lat' => 33.4772, 'lng' => 36.2561],
                ],
                'risk_level' => 'high',
                'temperature' => 36.2,
                'humidity' => 24.5,
                'wind_speed' => 22.7,
            ],
        ];

        foreach ($areas as $areaData) {
            Area::updateOrCreate(['name' => $areaData['name']], $areaData);
        }

        FirePredictionSetting::setEnabled(true);

        if (Alert::count() === 0) {
            $highRiskArea = Area::where('name', 'Latakia Highlands')->first();
            $mediumRiskArea = Area::where('name', 'Tartus Coast')->first();

            if ($highRiskArea) {
                Alert::create([
                    'user_id' => $user->id,
                    'area_id' => $highRiskArea->id,
                    'latitude' => 35.6079,
                    'longitude' => 36.0784,
                    'description' => 'Smoke spotted along the forest ridge near the hillside trail.',
                    'source' => 'manual',
                ]);

                Alert::create([
                    'area_id' => $highRiskArea->id,
                    'description' => 'Auto alert: High risk detected in Latakia Highlands.',
                    'source' => 'auto',
                ]);
            }

            if ($mediumRiskArea) {
                Alert::create([
                    'user_id' => $user->id,
                    'area_id' => $mediumRiskArea->id,
                    'latitude' => 34.8921,
                    'longitude' => 35.9714,
                    'description' => 'Small brush fire reported near the coastal road.',
                    'source' => 'manual',
                ]);
            }
        }
    }
}
