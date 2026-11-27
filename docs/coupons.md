# Coupons & Discounts

> Percentage/fixed coupons with schedules, usage limits, product/category scopes, stacking rules, and optional shipping discounts.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/coupons/` | Get all coupons (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/coupons/` | Create a new coupon (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/coupons/{id}` | Get coupon by ID (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/coupons/{id}` | Update coupon by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/coupons/{id}` | Delete coupon by ID (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/coupons/{id}/scopes` | Set coupon product/category restrictions (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/coupons/code/{code}` | Get coupon by code | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/coupons/validate` | Validate a coupon against an order amount | Bearer |

---

## Endpoint Details

### 1. Get all coupons (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/coupons/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `code` | query | No | string | max length 50 |
| `isActive` | query | No | boolean |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/coupons/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
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

### 2. Create a new coupon (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/coupons/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | Yes | min length 1, max length 50 |
| `description` | string | No | max length 1000 |
| `discountType` | enum(percentage, fixed) | Yes |  |
| `discountValue` | number | Yes | min 0.01 |
| `minOrderAmount` | number | No | min 0 |
| `maxDiscountAmount` | number | No | min 0 |
| `startDate` | string (date-time) | Yes |  |
| `endDate` | string (date-time) | Yes |  |
| `usageLimit` | integer | No | min 1 |
| `perUserLimit` | integer | No | min 1 |
| `stackable` | boolean | No |  |
| `appliesToShipping` | boolean | No |  |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "code": "SAVE10",
  "description": "Sample description",
  "discountType": "percentage",
  "discountValue": 9.99,
  "minOrderAmount": 9.99,
  "maxDiscountAmount": 9.99,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "usageLimit": 1,
  "perUserLimit": 1,
  "stackable": true,
  "appliesToShipping": true,
  "isActive": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/coupons/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10",
  "description": "Sample description",
  "discountType": "percentage",
  "discountValue": 9.99,
  "minOrderAmount": 9.99,
  "maxDiscountAmount": 9.99,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "usageLimit": 1,
  "perUserLimit": 1,
  "stackable": true,
  "appliesToShipping": true,
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

### 3. Get coupon by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/coupons/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/coupons/{id}' \
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
  "data": {}
}
```

---

### 4. Update coupon by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/coupons/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | No | min length 1, max length 50 |
| `description` | string | No | max length 1000 |
| `discountType` | enum(percentage, fixed) | No |  |
| `discountValue` | number | No | min 0.01 |
| `minOrderAmount` | number | No | min 0 |
| `maxDiscountAmount` | number | No | min 0 |
| `startDate` | string (date-time) | No |  |
| `endDate` | string (date-time) | No |  |
| `usageLimit` | integer | No | min 1 |
| `perUserLimit` | integer | No | min 1 |
| `stackable` | boolean | No |  |
| `appliesToShipping` | boolean | No |  |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "code": "SAVE10",
  "description": "Sample description",
  "discountType": "percentage",
  "discountValue": 9.99,
  "minOrderAmount": 9.99,
  "maxDiscountAmount": 9.99,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "usageLimit": 1,
  "perUserLimit": 1,
  "stackable": true,
  "appliesToShipping": true,
  "isActive": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/coupons/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10",
  "description": "Sample description",
  "discountType": "percentage",
  "discountValue": 9.99,
  "minOrderAmount": 9.99,
  "maxDiscountAmount": 9.99,
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-01T00:00:00.000Z",
  "usageLimit": 1,
  "perUserLimit": 1,
  "stackable": true,
  "appliesToShipping": true,
  "isActive": true
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
| `404` | Response for status 404 |
| `409` | Response for status 409 |

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

### 5. Delete coupon by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/coupons/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/coupons/{id}' \
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

### 6. Set coupon product/category restrictions (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/coupons/{id}/scopes</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `productIds` | array<string (uuid)> | No | max items 200 |
| `categoryIds` | array<string (uuid)> | No | max items 200 |

**Example request body**

```json
{
  "productIds": [
    "00000000-0000-0000-0000-000000000000"
  ],
  "categoryIds": [
    "00000000-0000-0000-0000-000000000000"
  ]
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/coupons/{id}/scopes' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "productIds": [
    "00000000-0000-0000-0000-000000000000"
  ],
  "categoryIds": [
    "00000000-0000-0000-0000-000000000000"
  ]
}'
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

### 7. Get coupon by code

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/coupons/code/{code}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `code` | path | Yes | string | max length 50 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/coupons/code/{code}' \
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
  "data": {}
}
```

---

### 8. Validate a coupon against an order amount

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/coupons/validate</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | Yes | min length 1, max length 50 |
| `orderAmount` | number | Yes | min 0.01 |

**Example request body**

```json
{
  "code": "SAVE10",
  "orderAmount": 9.99
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/coupons/validate' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10",
  "orderAmount": 9.99
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
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
