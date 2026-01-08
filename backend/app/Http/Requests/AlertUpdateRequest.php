<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AlertUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['nullable', 'image', 'max:5120'],
            'latitude' => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'numeric', 'between:-180,180'],
            'description' => ['sometimes', 'string', 'max:2000'],
            'area_id' => ['nullable', 'exists:areas,id'],
        ];
    }
}
