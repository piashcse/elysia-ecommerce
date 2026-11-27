# Payments & Payment Methods

> Payment records, provider processing, refunds, saved tokenized methods, admin queries, and the signed payment webhook.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/payment-methods/` | List saved payment methods | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/payment-methods/` | Save a tokenized payment method | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/payment-methods/{id}` | Delete a saved payment method | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/payments/` | Get payments (Admin: all, Customer: own) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/payments/` | Create initial payment record | Bearer or guest token |
| <span class="method-badge get">GET</span> | `/api/v1/payments/{id}` | Get payment details by ID | Bearer or guest token |
| <span class="method-badge post">POST</span> | `/api/v1/payments/{id}/complete` | Mark an offline payment as completed (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/payments/{id}/refund` | Refund a completed payment (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/payments/process` | Process payment with gateway simulation | Bearer or guest token |
| <span class="method-badge post">POST</span> | `/api/v1/payments/webhook` | Receive a payment provider webhook | Provider signature |

---

## Endpoint Details

### 1. List saved payment methods

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/payment-methods/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/payment-methods/' \
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

### 2. Save a tokenized payment method

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payment-methods/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `provider` | string | Yes | min length 1, max length 50 |
| `token` | string | Yes | min length 1, max length 255 |
| `brand` | string | No | max length 50 |
| `last4` | string | No | pattern `^[0-9]{4}$` |
| `expMonth` | integer | No | min 1, max 12 |
| `expYear` | integer | No | min 2000, max 2100 |
| `isDefault` | boolean | No |  |

**Example request body**

```json
{
  "provider": "string",
  "token": "token-value",
  "brand": "string",
  "last4": "string",
  "expMonth": 1,
  "expYear": 2000,
  "isDefault": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payment-methods/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "provider": "string",
  "token": "token-value",
  "brand": "string",
  "last4": "string",
  "expMonth": 1,
  "expYear": 2000,
  "isDefault": true
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

### 3. Delete a saved payment method

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/payment-methods/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/payment-methods/{id}' \
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

### 4. Get payments (Admin: all, Customer: own)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/payments/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `status` | query | No | enum(pending, completed, failed, refunded) |  |
| `method` | query | No | enum(credit_card, debit_card, paypal, bank_transfer, cash_on_delivery) |  |
| `dateFrom` | query | No | string (date-time) |  |
| `dateTo` | query | No | string (date-time) |  |
| `orderId` | query | No | string (uuid) |  |
| `userId` | query | No | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/payments/' \
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

### 5. Create initial payment record

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payments/</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `orderId` | string (uuid) | Yes |  |
| `method` | enum(credit_card, debit_card, paypal, bank_transfer, cash_on_delivery) | Yes |  |
| `amount` | number | Yes | min 0.01, max 999999.99 |
| `metadata` | object | No |  |
| `guestToken` | string | No | max length 128 |

**Example request body**

```json
{
  "orderId": "00000000-0000-0000-0000-000000000000",
  "method": "credit_card",
  "amount": 9.99,
  "metadata": {},
  "guestToken": "string"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payments/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "orderId": "00000000-0000-0000-0000-000000000000",
  "method": "credit_card",
  "amount": 9.99,
  "metadata": {},
  "guestToken": "string"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `400` | Response for status 400 |
| `403` | Response for status 403 |
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

### 6. Get payment details by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/payments/{id}</span>
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
  'http://localhost:3000/api/v1/payments/{id}' \
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

### 7. Mark an offline payment as completed (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payments/{id}/complete</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payments/{id}/complete' \
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

### 8. Refund a completed payment (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payments/{id}/refund</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `amount` | number | No | min 0.01, max 999999.99 |

**Example request body**

```json
{
  "amount": 9.99
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payments/{id}/refund' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "amount": 9.99
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

### 9. Process payment with gateway simulation

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payments/process</span>
  <span class="auth-badge">Bearer or guest token</span>
</div>

**Authentication:** Bearer or guest token


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `orderId` | string (uuid) | Yes |  |
| `method` | enum(credit_card, debit_card, paypal, bank_transfer, cash_on_delivery) | Yes |  |
| `amount` | number | Yes | min 0.01, max 999999.99 |
| `paymentDetails` | object | Yes |  |
| `paymentMethodId` | string (uuid) | No |  |
| `guestToken` | string | No | max length 128 |

**Example request body**

```json
{
  "orderId": "00000000-0000-0000-0000-000000000000",
  "method": "credit_card",
  "amount": 9.99,
  "paymentDetails": {
    "cardHolderName": "string",
    "paypalEmail": "customer@example.com"
  },
  "paymentMethodId": "00000000-0000-0000-0000-000000000000",
  "guestToken": "string"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payments/process' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "orderId": "00000000-0000-0000-0000-000000000000",
  "method": "credit_card",
  "amount": 9.99,
  "paymentDetails": {
    "cardHolderName": "string",
    "paypalEmail": "customer@example.com"
  },
  "paymentMethodId": "00000000-0000-0000-0000-000000000000",
  "guestToken": "string"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
| `402` | Response for status 402 |
| `403` | Response for status 403 |
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

### 10. Receive a payment provider webhook

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/payments/webhook</span>
  <span class="auth-badge">Provider signature</span>
</div>

**Authentication:** Provider signature


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | Yes | min length 1, max length 100 |
| `type` | string | Yes | min length 1, max length 100 |
| `data` | object | Yes |  |

**Example request body**

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "type": "string",
  "data": {
    "orderId": "00000000-0000-0000-0000-000000000000",
    "paymentId": "00000000-0000-0000-0000-000000000000",
    "transactionId": "00000000-0000-0000-0000-000000000000",
    "amount": 9.99
  }
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/payments/webhook' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "id": "00000000-0000-0000-0000-000000000000",
  "type": "string",
  "data": {
    "orderId": "00000000-0000-0000-0000-000000000000",
    "paymentId": "00000000-0000-0000-0000-000000000000",
    "transactionId": "00000000-0000-0000-0000-000000000000",
    "amount": 9.99
  }
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
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
