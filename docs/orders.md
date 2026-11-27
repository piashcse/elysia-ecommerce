# Orders

> Order creation with idempotency keys, guest tokens, order events/timeline, cancellation, expired-payment release, invoices, and statistics.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/orders/` | Get orders (Admin: all, Customer: own) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/orders/` | Place a new order | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/orders/{id}` | Get order details by ID | Bearer or guest token |
| <span class="method-badge put">PUT</span> | `/api/v1/orders/{id}` | Update order status (Admin only) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/orders/{id}/cancel` | Cancel order | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/orders/{id}/events` | Get the order timeline | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/orders/{id}/invoice` | Download an order invoice (HTML) | Bearer or guest token |
| <span class="method-badge post">POST</span> | `/api/v1/orders/release-expired` | Release expired pending orders (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/orders/stats` | Get order statistics (Admin only) | Bearer · Admin |

---

## Endpoint Details

### 1. Get orders (Admin: all, Customer: own)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/orders/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `status` | query | No | enum(pending, processing, shipped, delivered, cancelled, refunded) |  |
| `dateFrom` | query | No | string (date-time) |  |
| `dateTo` | query | No | string (date-time) |  |
| `userId` | query | No | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/orders/' \
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

### 2. Place a new order

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/orders/</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `items` | array<object> | Yes | min items 1, max items 50 |
| `shippingAddress` | object | No |  |
| `shippingAddressId` | string (uuid) | No |  |
| `billingAddress` | object | No |  |
| `billingAddressId` | string (uuid) | No |  |
| `notes` | string | No | max length 1000 |
| `couponCode` | string | No | max length 50 |
| `couponCodes` | array<string> | No | max items 5 |
| `currency` | string | No | min length 3, max length 3 |
| `giftCardCode` | string | No | max length 50 |
| `shippingMethodId` | string (uuid) | No |  |
| `email` | string (email) | No | max length 255 |

**Example request body**

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "variantId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "string",
    "lastName": "string",
    "address": "1 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "string",
    "country": "US",
    "phone": "+14155550123"
  },
  "shippingAddressId": "00000000-0000-0000-0000-000000000000",
  "billingAddress": {
    "firstName": "string",
    "lastName": "string",
    "address": "1 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "string",
    "country": "US",
    "phone": "+14155550123"
  },
  "billingAddressId": "00000000-0000-0000-0000-000000000000",
  "notes": "Optional note",
  "couponCode": "string",
  "couponCodes": [
    "SAVE10"
  ],
  "currency": "USD",
  "giftCardCode": "string",
  "shippingMethodId": "00000000-0000-0000-0000-000000000000",
  "email": "customer@example.com"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/orders/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "variantId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "firstName": "string",
    "lastName": "string",
    "address": "1 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "string",
    "country": "US",
    "phone": "+14155550123"
  },
  "shippingAddressId": "00000000-0000-0000-0000-000000000000",
  "billingAddress": {
    "firstName": "string",
    "lastName": "string",
    "address": "1 Market Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "string",
    "country": "US",
    "phone": "+14155550123"
  },
  "billingAddressId": "00000000-0000-0000-0000-000000000000",
  "notes": "Optional note",
  "couponCode": "string",
  "couponCodes": [
    "SAVE10"
  ],
  "currency": "USD",
  "giftCardCode": "string",
  "shippingMethodId": "00000000-0000-0000-0000-000000000000",
  "email": "customer@example.com"
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

### 3. Get order details by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/orders/{id}</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `guestToken` | query | No | string | max length 128 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/orders/{id}' \
  -H 'accept: application/json'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `403` | Response for status 403 |
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

### 4. Update order status (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/orders/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `status` | enum(pending, processing, shipped, delivered, cancelled, refunded) | No |  |
| `notes` | string | No | max length 1000 |
| `trackingNumber` | string | No | max length 100 |

**Example request body**

```json
{
  "status": "pending",
  "notes": "Optional note",
  "trackingNumber": "string"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/orders/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "status": "pending",
  "notes": "Optional note",
  "trackingNumber": "string"
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

### 5. Cancel order

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/orders/{id}/cancel</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `guestToken` | query | No | string | max length 128 |


**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/orders/{id}/cancel' \
  -H 'accept: application/json'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `403` | Response for status 403 |
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

### 6. Get the order timeline

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/orders/{id}/events</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `guestToken` | query | No | string | max length 128 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/orders/{id}/events' \
  -H 'accept: application/json'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `403` | Response for status 403 |
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

### 7. Download an order invoice (HTML)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/orders/{id}/invoice</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `guestToken` | query | No | string | max length 128 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/orders/{id}/invoice' \
  -H 'accept: application/json'
```


---

### 8. Release expired pending orders (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/orders/release-expired</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin



**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/orders/release-expired' \
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

### 9. Get order statistics (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/orders/stats</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/orders/stats' \
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
