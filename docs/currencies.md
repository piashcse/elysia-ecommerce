# Currencies & FX

> Exchange rates relative to USD, public conversion, admin currency management, and currency snapshots on orders and quotes.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/currencies/` | List active currencies | Public |
| <span class="method-badge post">POST</span> | `/api/v1/currencies/` | Create or replace a currency (Admin only) | Bearer · Admin |
| <span class="method-badge patch">PATCH</span> | `/api/v1/currencies/{code}` | Update a currency (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/currencies/{code}` | Deactivate a currency (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/currencies/convert` | Convert an amount between currencies | Public |

---

## Endpoint Details

### 1. List active currencies

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/currencies/</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/currencies/' \
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

### 2. Create or replace a currency (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/currencies/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | Yes | min length 3, max length 3 |
| `name` | string | Yes | min length 1, max length 100 |
| `symbol` | string | Yes | min length 1, max length 10 |
| `rate` | number | Yes | min 0.000001, max 100000 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "code": "SAVE10",
  "name": "Sample name",
  "symbol": "$",
  "rate": 9.99,
  "isActive": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/currencies/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10",
  "name": "Sample name",
  "symbol": "$",
  "rate": 9.99,
  "isActive": true
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

### 3. Update a currency (Admin only)

<div class="endpoint-header">
  <span class="method-badge patch">PATCH</span>
  <span class="endpoint-path">/api/v1/currencies/{code}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `code` | path | Yes | string | min length 3, max length 3 |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | min length 1, max length 100 |
| `symbol` | string | No | min length 1, max length 10 |
| `rate` | number | No | min 0.000001, max 100000 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "symbol": "$",
  "rate": 9.99,
  "isActive": true
}
```

**Request**

```bash
curl -X 'PATCH' \
  'http://localhost:3000/api/v1/currencies/{code}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "symbol": "$",
  "rate": 9.99,
  "isActive": true
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `404` | Response for status 404 |
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

### 4. Deactivate a currency (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/currencies/{code}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `code` | path | Yes | string | min length 3, max length 3 |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/currencies/{code}' \
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

### 5. Convert an amount between currencies

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/currencies/convert</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `amount` | query | Yes | number | min 0 |
| `from` | query | No | string | min length 3, max length 3 |
| `to` | query | No | string | min length 3, max length 3 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/currencies/convert' \
  -H 'accept: application/json'
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
