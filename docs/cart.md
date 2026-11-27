# Cart

> Authenticated and guest carts using `X-Session-Id`, variant-aware line items, quantity updates, and guest-cart merging on login.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/cart/` | Get the current user's or guest cart | Guest session or Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/cart/` | Clear entire cart | Guest session or Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/cart/count` | Get the current cart's item count | Guest session or Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/cart/items` | Add item to cart | Guest session or Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/cart/items/{id}` | Update cart item quantity | Guest session or Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/cart/items/{id}` | Remove item from cart | Guest session or Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/cart/merge` | Merge the guest cart into the authenticated user cart | Bearer |

---

## Endpoint Details

### 1. Get the current user's or guest cart

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/cart/</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/cart/' \
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
  "data": "string"
}
```

---

### 2. Clear entire cart

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/cart/</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer



**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/cart/' \
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
  "data": "string"
}
```

---

### 3. Get the current cart's item count

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/cart/count</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/cart/count' \
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

### 4. Add item to cart

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/cart/items</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `productId` | string (uuid) | Yes |  |
| `variantId` | string (uuid) | No |  |
| `quantity` | integer | Yes | min 1, max 100 |

**Example request body**

```json
{
  "productId": "00000000-0000-0000-0000-000000000000",
  "variantId": "00000000-0000-0000-0000-000000000000",
  "quantity": 1
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/cart/items' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "productId": "00000000-0000-0000-0000-000000000000",
  "variantId": "00000000-0000-0000-0000-000000000000",
  "quantity": 1
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
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

### 5. Update cart item quantity

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/cart/items/{id}</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `quantity` | integer | Yes | min 1, max 100 |

**Example request body**

```json
{
  "quantity": 1
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/cart/items/{id}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "quantity": 1
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

### 6. Remove item from cart

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/cart/items/{id}</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/cart/items/{id}' \
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

### 7. Merge the guest cart into the authenticated user cart

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/cart/merge</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/cart/merge' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
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
