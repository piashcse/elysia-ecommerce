# Seller Portal

> Seller product management, order visibility, item-level fulfillment, payout balances, and storefront statistics.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/payouts/` | List seller payouts (Admin only) | Bearer · Admin/Seller |
| <span class="method-badge post">POST</span> | `/api/v1/payouts/` | Create a seller payout (Admin only) | Bearer · Admin/Seller |
| <span class="method-badge patch">PATCH</span> | `/api/v1/payouts/{id}` | Update payout status (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/seller/orders` | Get orders containing the current seller products | Bearer · Seller |
| <span class="method-badge put">PUT</span> | `/api/v1/seller/orders/{orderId}/items/{itemId}` | Update fulfillment status for a seller order item | Bearer · Seller |
| <span class="method-badge get">GET</span> | `/api/v1/seller/payouts` | Get seller payout balance and history | Bearer · Seller |
| <span class="method-badge get">GET</span> | `/api/v1/seller/products` | Get products for the current seller | Bearer · Seller |
| <span class="method-badge post">POST</span> | `/api/v1/seller/products` | Create a new product by seller | Bearer · Seller |
| <span class="method-badge put">PUT</span> | `/api/v1/seller/products/{id}` | Update product by seller | Bearer · Seller |
| <span class="method-badge delete">DELETE</span> | `/api/v1/seller/products/{id}` | Delete product by seller | Bearer · Seller |
| <span class="method-badge get">GET</span> | `/api/v1/seller/stats` | Get seller product and sales statistics | Bearer · Seller |

---

## Endpoint Details

### 1. List seller payouts (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/payouts/</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/payouts/' \
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
  "data": {}
}
```

---

### 2. Create a seller payout (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payouts/</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `sellerId` | string (uuid) | Yes |  |
| `amount` | number | Yes | min 0.01, max 999999.99 |
| `reference` | string | No | max length 100 |
| `notes` | string | No | max length 1000 |
| `periodStart` | string (date-time) | No |  |
| `periodEnd` | string (date-time) | No |  |

**Example request body**

```json
{
  "sellerId": "00000000-0000-0000-0000-000000000000",
  "amount": 9.99,
  "reference": "PAYOUT-001",
  "notes": "Optional note",
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-01-01T00:00:00.000Z"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payouts/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "sellerId": "00000000-0000-0000-0000-000000000000",
  "amount": 9.99,
  "reference": "PAYOUT-001",
  "notes": "Optional note",
  "periodStart": "2026-01-01T00:00:00.000Z",
  "periodEnd": "2026-01-01T00:00:00.000Z"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
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

### 3. Update payout status (Admin only)

<div class="endpoint-header">
  <span class="method-badge patch">PATCH</span>
  <span class="endpoint-path">/api/v1/payouts/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `status` | enum(pending, paid, cancelled) | Yes |  |

**Example request body**

```json
{
  "status": "pending"
}
```

**Request**

```bash
curl -X 'PATCH' \
  'http://localhost:3000/api/v1/payouts/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "status": "pending"
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

### 4. Get orders containing the current seller products

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/seller/orders</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/seller/orders' \
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

### 5. Update fulfillment status for a seller order item

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/seller/orders/{orderId}/items/{itemId}</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `orderId` | path | Yes | string (uuid) |  |
| `itemId` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `status` | enum(pending, shipped, delivered, cancelled) | Yes |  |

**Example request body**

```json
{
  "status": "pending"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/seller/orders/{orderId}/items/{itemId}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "status": "pending"
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

### 6. Get seller payout balance and history

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/seller/payouts</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/seller/payouts' \
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

### 7. Get products for the current seller

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/seller/products</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/seller/products' \
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

### 8. Create a new product by seller

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/seller/products</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | min length 1, max length 255 |
| `slug` | string | No | max length 280 |
| `description` | string | No | max length 5000 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |
| `price` | number | Yes | min 0 |
| `stockQuantity` | integer | Yes | min 0 |
| `weightGrams` | integer | No | min 0 |
| `sku` | string | Yes | min length 1, max length 100 |
| `imageUrl` | string (uri) | No | max length 500 |
| `categoryId` | string (uuid) | No |  |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "slug": "string",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string",
  "price": 9.99,
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "isActive": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/seller/products' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "slug": "string",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string",
  "price": 9.99,
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": "00000000-0000-0000-0000-000000000000",
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

### 9. Update product by seller

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/seller/products/{id}</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | min length 1, max length 255 |
| `slug` | string | No | max length 280 |
| `description` | string | No | max length 5000 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |
| `price` | number | No | min 0 |
| `stockQuantity` | integer | No | min 0 |
| `weightGrams` | integer | No | min 0 |
| `sku` | string | No | min length 1, max length 100 |
| `imageUrl` | string (uri) | No | max length 500 |
| `categoryId` | string (uuid) | No |  |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "slug": "string",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string",
  "price": 9.99,
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "isActive": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/seller/products/{id}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "slug": "string",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string",
  "price": 9.99,
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": "00000000-0000-0000-0000-000000000000",
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

### 10. Delete product by seller

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/seller/products/{id}</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/seller/products/{id}' \
  -H 'accept: application/json'
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
  "data": "string"
}
```

---

### 11. Get seller product and sales statistics

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/seller/stats</span>
  <span class="auth-badge">Bearer · Seller</span>
</div>

**Authentication:** Bearer · Seller



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/seller/stats' \
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
