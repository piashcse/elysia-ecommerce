# Gift Cards

> Issue, list, deactivate, and check gift cards. Balances are redeemed at checkout and restored when an order is cancelled.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/gift-cards/` | List gift cards (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/gift-cards/` | Create a gift card (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/gift-cards/{code}` | Check a gift card balance | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/gift-cards/{id}` | Deactivate a gift card (Admin only) | Bearer · Admin |

---

## Endpoint Details

### 1. List gift cards (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/gift-cards/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/gift-cards/' \
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

### 2. Create a gift card (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/gift-cards/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | No | min length 4, max length 50 |
| `balance` | number | Yes | min 0.01, max 100000 |
| `currency` | string | No | min length 3, max length 3 |
| `expiresAt` | string (date-time) | No |  |

**Example request body**

```json
{
  "code": "SAVE10",
  "balance": 9.99,
  "currency": "USD",
  "expiresAt": "2026-01-01T00:00:00.000Z"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/gift-cards/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10",
  "balance": 9.99,
  "currency": "USD",
  "expiresAt": "2026-01-01T00:00:00.000Z"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
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

### 3. Check a gift card balance

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/gift-cards/{code}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `code` | path | Yes | string | min length 4, max length 50 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/gift-cards/{code}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
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

### 4. Deactivate a gift card (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/gift-cards/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/gift-cards/{id}' \
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
