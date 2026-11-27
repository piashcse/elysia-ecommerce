# Wishlist

> Per-user wishlist with toggle, membership checks, pagination, and counts.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/wishlist/` | Get current user's wishlist | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/wishlist/check/{productId}` | Check whether a product is in the wishlist | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/wishlist/count` | Get total wishlist count | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/wishlist/items` | Add product to wishlist | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/wishlist/items/{id}` | Remove item from wishlist | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/wishlist/toggle` | Toggle a product in the wishlist | Bearer |

---

## Endpoint Details

### 1. Get current user's wishlist

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/wishlist/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/wishlist/' \
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
  "data": [
    {}
  ]
}
```

---

### 2. Check whether a product is in the wishlist

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/wishlist/check/{productId}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `productId` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/wishlist/check/{productId}' \
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
  "data": {}
}
```

---

### 3. Get total wishlist count

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/wishlist/count</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/wishlist/count' \
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
    "count": 1
  }
}
```

---

### 4. Add product to wishlist

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/wishlist/items</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `productId` | string (uuid) | Yes |  |

**Example request body**

```json
{
  "productId": "00000000-0000-0000-0000-000000000000"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/wishlist/items' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "productId": "00000000-0000-0000-0000-000000000000"
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

### 5. Remove item from wishlist

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/wishlist/items/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/wishlist/items/{id}' \
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
  "data": "string"
}
```

---

### 6. Toggle a product in the wishlist

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/wishlist/toggle</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `productId` | string (uuid) | Yes |  |

**Example request body**

```json
{
  "productId": "00000000-0000-0000-0000-000000000000"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/wishlist/toggle' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "productId": "00000000-0000-0000-0000-000000000000"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
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
