# Addresses

> Saved shipping/billing addresses with default-address selection.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/addresses/` | Get all user addresses | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/addresses/` | Create new address | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/addresses/{id}` | Get address by ID | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/addresses/{id}` | Update address | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/addresses/{id}` | Delete address | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/addresses/{id}/set-default` | Set address as default | Bearer |

---

## Endpoint Details

### 1. Get all user addresses

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/addresses/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `type` | query | No | enum(shipping, billing, both) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/addresses/' \
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

### 2. Create new address

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/addresses/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | enum(shipping, billing, both) | Yes |  |
| `fullName` | string | Yes | min length 1, max length 200 |
| `phoneNumber` | string | Yes | min length 1, max length 20 |
| `addressLine1` | string | Yes | min length 1, max length 255 |
| `addressLine2` | string | No | max length 255 |
| `city` | string | Yes | min length 1, max length 100 |
| `state` | string | Yes | min length 1, max length 100 |
| `postalCode` | string | Yes | min length 1, max length 20 |
| `country` | string | Yes | min length 1, max length 100 |
| `isDefault` | boolean | No |  |

**Example request body**

```json
{
  "type": "shipping",
  "fullName": "string",
  "phoneNumber": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "string",
  "country": "US",
  "isDefault": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/addresses/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "type": "shipping",
  "fullName": "string",
  "phoneNumber": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "string",
  "country": "US",
  "isDefault": true
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `400` | Response for status 400 |
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

### 3. Get address by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/addresses/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/addresses/{id}' \
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

### 4. Update address

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/addresses/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `type` | enum(shipping, billing, both) | No |  |
| `fullName` | string | No | min length 1, max length 200 |
| `phoneNumber` | string | No | min length 1, max length 20 |
| `addressLine1` | string | No | min length 1, max length 255 |
| `addressLine2` | string | No | max length 255 |
| `city` | string | No | min length 1, max length 100 |
| `state` | string | No | min length 1, max length 100 |
| `postalCode` | string | No | min length 1, max length 20 |
| `country` | string | No | min length 1, max length 100 |
| `isDefault` | boolean | No |  |

**Example request body**

```json
{
  "type": "shipping",
  "fullName": "string",
  "phoneNumber": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "string",
  "country": "US",
  "isDefault": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/addresses/{id}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "type": "shipping",
  "fullName": "string",
  "phoneNumber": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "string",
  "country": "US",
  "isDefault": true
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

### 5. Delete address

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/addresses/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/addresses/{id}' \
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

### 6. Set address as default

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/addresses/{id}/set-default</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/addresses/{id}/set-default' \
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
