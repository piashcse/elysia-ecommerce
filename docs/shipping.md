# Shipping Methods

> Configurable shipping methods with base/per-kg cost, delivery estimates, country eligibility, and free-shipping thresholds.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/shipping-methods/` | Get all shipping methods | Public |
| <span class="method-badge post">POST</span> | `/api/v1/shipping-methods/` | Create a new shipping method (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/shipping-methods/{id}` | Get shipping method by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/shipping-methods/{id}` | Update shipping method by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/shipping-methods/{id}` | Delete shipping method by ID (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/shipping-methods/quote` | Calculate shipping options for a cart | Bearer |

---

## Endpoint Details

### 1. Get all shipping methods

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/shipping-methods/</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `isActive` | query | No | boolean |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/shipping-methods/' \
  -H 'accept: application/json'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [
      {}
    ],
    "meta": {
      "page": 1,
      "limit": 1,
      "total": 1,
      "totalPages": 1,
      "averageRating": 1
    }
  }
}
```

---

### 2. Create a new shipping method (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/shipping-methods/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | min length 1, max length 100 |
| `description` | string | No | max length 1000 |
| `baseCost` | number | Yes | min 0 |
| `costPerKg` | number | No | min 0 |
| `estimatedDaysMin` | integer | Yes | min 0 |
| `estimatedDaysMax` | integer | Yes | min 0 |
| `countries` | array<string> | No |  |
| `freeShippingThreshold` | number | No | min 0 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "baseCost": 9.99,
  "costPerKg": 9.99,
  "estimatedDaysMin": 1,
  "estimatedDaysMax": 1,
  "countries": [
    "string"
  ],
  "freeShippingThreshold": 0,
  "isActive": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/shipping-methods/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "baseCost": 9.99,
  "costPerKg": 9.99,
  "estimatedDaysMin": 1,
  "estimatedDaysMax": 1,
  "countries": [
    "string"
  ],
  "freeShippingThreshold": 0,
  "isActive": true
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `400` | Response for status 400 |
| `409` | Response for status 409 |
| `422` | Response for status 422 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": {}
}
```

---

### 3. Get shipping method by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/shipping-methods/{id}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/shipping-methods/{id}' \
  -H 'accept: application/json'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `404` | Response for status 404 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

---

### 4. Update shipping method by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/shipping-methods/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | min length 1, max length 100 |
| `description` | string | No | max length 1000 |
| `baseCost` | number | No | min 0 |
| `costPerKg` | number | No | min 0 |
| `estimatedDaysMin` | integer | No | min 0 |
| `estimatedDaysMax` | integer | No | min 0 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "baseCost": 9.99,
  "costPerKg": 9.99,
  "estimatedDaysMin": 1,
  "estimatedDaysMax": 1,
  "isActive": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/shipping-methods/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "baseCost": 9.99,
  "costPerKg": 9.99,
  "estimatedDaysMin": 1,
  "estimatedDaysMax": 1,
  "isActive": true
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
| `404` | Response for status 404 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

---

### 5. Delete shipping method by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/shipping-methods/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/shipping-methods/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `404` | Response for status 404 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": "string"
}
```

---

### 6. Calculate shipping options for a cart

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/shipping-methods/quote</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `items` | array<object> | Yes | min items 1, max items 50 |
| `country` | string | No | max length 100 |

**Example request body**

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "country": "US"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/shipping-methods/quote' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "country": "US"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `409` | Response for status 409 |
| `422` | Response for status 422 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

---
