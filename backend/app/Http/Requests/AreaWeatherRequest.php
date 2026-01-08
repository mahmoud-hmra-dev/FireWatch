<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AreaWeatherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'fetch' => ['sometimes', 'boolean'],
        ];

        if ($this->boolean('fetch')) {
            return array_merge($rules, [
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
            ]);
        }

        return array_merge($rules, [
            'temperature' => ['required', 'numeric'],
            'humidity' => ['required', 'numeric'],
            'wind_speed' => ['required', 'numeric'],
        ]);
    }
}
