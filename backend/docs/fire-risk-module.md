# Fire Risk Management Module

## Example API Requests & Responses

### List Regions

**Request**
```bash
curl -X GET "${APP_URL}/api/regions" \
  -H "Authorization: Bearer <token>"
```

**Response**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Northern Range",
      "type": "Forest",
      "latitude": 45.1234567,
      "longitude": -120.1234567,
      "is_active": true,
      "created_at": "2026-01-07T12:00:00.000000Z",
      "updated_at": "2026-01-07T12:00:00.000000Z"
    }
  ]
}
```

### Latest Fire Risk (Generate on Demand)

**Request**
```bash
curl -X GET "${APP_URL}/api/fire-risk/latest?region_id=1&generate=true&temperature=34&humidity=18&wind_speed=18" \
  -H "Authorization: Bearer <token>"
```

**Response**
```json
{
  "data": {
    "id": 99,
    "risk_score": 82.4,
    "risk_level": "extreme",
    "confidence": 0.78,
    "explanation": "Hot, dry, and windy conditions drive extreme risk.",
    "source": "openai",
    "created_at": "2026-01-07T12:05:00.000000Z",
    "region": {
      "id": 1,
      "name": "Northern Range",
      "type": "Forest",
      "latitude": 45.1234567,
      "longitude": -120.1234567,
      "is_active": true,
      "created_at": "2026-01-07T12:00:00.000000Z",
      "updated_at": "2026-01-07T12:00:00.000000Z"
    }
  }
}
```

### Submit Fire Report

**Request**
```bash
curl -X POST "${APP_URL}/api/fire-reports" \
  -H "Authorization: Bearer <token>" \
  -F "region_id=1" \
  -F "lat=45.1234" \
  -F "lng=-120.4567" \
  -F "image=@/path/to/report.jpg"
```

**Response**
```json
{
  "data": {
    "id": 55,
    "image_url": "${APP_URL}/storage/fire-reports/report.jpg",
    "lat": 45.1234,
    "lng": -120.4567,
    "status": "submitted",
    "created_at": "2026-01-07T12:10:00.000000Z",
    "region": {
      "id": 1,
      "name": "Northern Range",
      "type": "Forest",
      "latitude": 45.1234567,
      "longitude": -120.1234567,
      "is_active": true,
      "created_at": "2026-01-07T12:00:00.000000Z",
      "updated_at": "2026-01-07T12:00:00.000000Z"
    }
  }
}
```

## Example OpenAI Prompt

```
You are a fire risk analyst. Respond ONLY with valid JSON.
Analyze fire risk for the following region and environmental data.
Return ONLY JSON with keys: risk_score (0-100), risk_level (Low|Medium|High|Extreme), confidence (0-1), explanation.
Region: Northern Range (Forest) at 45.1234567, -120.1234567.
Environmental data:
{
  "temperature": 34,
  "humidity": 18,
  "wind_speed": 18,
  "rainfall": 0,
  "vegetation_index": 0.72
}
```
