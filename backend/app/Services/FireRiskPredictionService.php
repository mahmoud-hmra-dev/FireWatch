<?php

namespace App\Services;

use App\Models\FireRiskPrediction;
use App\Models\Region;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FireRiskPredictionService
{
    /**
     * Generate and persist a prediction for a region using environmental data.
     *
     * @param  array<string, mixed>  $environmentalData
     */
    public function generatePrediction(Region $region, array $environmentalData): FireRiskPrediction
    {
        $payload = $this->buildPredictionPayload($region, $environmentalData);

        return $region->fireRiskPredictions()->create($payload);
    }

    /**
     * Build the prediction payload using OpenAI with a fallback to local rules.
     *
     * @param  array<string, mixed>  $environmentalData
     * @return array<string, mixed>
     */
    protected function buildPredictionPayload(Region $region, array $environmentalData): array
    {
        try {
            $openAiPayload = $this->requestOpenAiPrediction($region, $environmentalData);
            if ($openAiPayload !== null) {
                return $openAiPayload;
            }
        } catch (\Throwable $exception) {
            Log::warning('OpenAI fire risk prediction failed.', [
                'region_id' => $region->id,
                'error' => $exception->getMessage(),
            ]);
        }

        return $this->fallbackPrediction($region, $environmentalData);
    }

    /**
     * Call OpenAI and normalize the response.
     *
     * @param  array<string, mixed>  $environmentalData
     * @return array<string, mixed>|null
     */
    protected function requestOpenAiPrediction(Region $region, array $environmentalData): ?array
    {
        $apiKey = config('services.openai.key');
        if (! $apiKey) {
            return null;
        }

        $model = config('services.openai.model', 'gpt-4o-mini');
        $baseUrl = rtrim(config('services.openai.base_url', 'https://api.openai.com/v1'), '/');

        $prompt = $this->buildPrompt($region, $environmentalData);

        $response = Http::withToken($apiKey)
            ->timeout(15)
            ->post("{$baseUrl}/chat/completions", [
                'model' => $model,
                'temperature' => 0.2,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a fire risk analyst. Respond ONLY with valid JSON.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

        if (! $response->successful()) {
            Log::warning('OpenAI response failed.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return null;
        }

        $content = data_get($response->json(), 'choices.0.message.content');
        if (! is_string($content)) {
            return null;
        }

        $decoded = json_decode($content, true);
        if (! is_array($decoded)) {
            return null;
        }

        return $this->normalizePredictionPayload($decoded);
    }

    /**
     * Normalize OpenAI payload into a persisted structure.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function normalizePredictionPayload(array $payload): array
    {
        $score = (float) Arr::get($payload, 'risk_score', 0);
        $confidence = (float) Arr::get($payload, 'confidence', 0);
        $level = $this->normalizeRiskLevel((string) Arr::get($payload, 'risk_level', 'low'));

        return [
            'risk_score' => $this->clamp($score, 0, 100),
            'risk_level' => $level,
            'confidence' => $this->clamp($confidence, 0, 1),
            'explanation' => (string) Arr::get($payload, 'explanation', 'OpenAI assessment completed.'),
            'source' => 'openai',
            'created_at' => now(),
        ];
    }

    /**
     * Fallback prediction if OpenAI fails.
     *
     * @param  array<string, mixed>  $environmentalData
     * @return array<string, mixed>
     */
    protected function fallbackPrediction(Region $region, array $environmentalData): array
    {
        $temperature = (float) ($environmentalData['temperature'] ?? 0);
        $humidity = (float) ($environmentalData['humidity'] ?? 50);
        $windSpeed = (float) ($environmentalData['wind_speed'] ?? 5);
        $rainfall = (float) ($environmentalData['rainfall'] ?? 0);
        $vegetation = (float) ($environmentalData['vegetation_index'] ?? 0.5);

        $score = 0;
        $score += max(0, ($temperature - 20) * 1.5);
        $score += max(0, (30 - $humidity) * 1.4);
        $score += max(0, ($windSpeed - 5) * 2);
        $score += max(0, (10 - $rainfall) * 1.1);
        $score += max(0, ($vegetation - 0.4) * 25);

        $score = $this->clamp($score, 0, 100);
        $level = $this->riskLevelFromScore($score);

        return [
            'risk_score' => $score,
            'risk_level' => $level,
            'confidence' => 0.45,
            'explanation' => sprintf(
                'Fallback model used for %s. Temperature %.1f°C, humidity %.0f%%, wind %.1f km/h, rainfall %.1f mm.',
                $region->name,
                $temperature,
                $humidity,
                $windSpeed,
                $rainfall
            ),
            'source' => 'fallback',
            'created_at' => now(),
        ];
    }

    /**
     * Build the OpenAI prompt with environmental input.
     *
     * @param  array<string, mixed>  $environmentalData
     */
    protected function buildPrompt(Region $region, array $environmentalData): string
    {
        $environmentJson = json_encode($environmentalData, JSON_PRETTY_PRINT);

        return <<<PROMPT
Analyze fire risk for the following region and environmental data.
Return ONLY JSON with keys: risk_score (0-100), risk_level (Low|Medium|High|Extreme), confidence (0-1), explanation.
Region: {$region->name} ({$region->type}) at {$region->latitude}, {$region->longitude}.
Environmental data:
{$environmentJson}
PROMPT;
    }

    protected function riskLevelFromScore(float $score): string
    {
        if ($score >= 80) {
            return 'extreme';
        }
        if ($score >= 60) {
            return 'high';
        }
        if ($score >= 35) {
            return 'medium';
        }
        return 'low';
    }

    protected function normalizeRiskLevel(string $level): string
    {
        $normalized = strtolower(trim($level));
        $allowed = ['low', 'medium', 'high', 'extreme'];
        if (! in_array($normalized, $allowed, true)) {
            return 'low';
        }

        return $normalized;
    }

    protected function clamp(float $value, float $min, float $max): float
    {
        return max($min, min($max, $value));
    }
}
