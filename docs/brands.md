# Brands

> Brand CRUD with slugs and logos, used for catalog filtering and product attribution.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/brands/` | List brands | Public |
| <span class="method-badge post">POST</span> | `/api/v1/brands/` | Create a brand (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/brands/{id}` | Get a brand by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/brands/{id}` | Update a brand (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/brands/{id}` | Delete a brand (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/brands/slug/{slug}` | Get a brand by slug | Public |

---

## Endpoint Details

### 1. List brands

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/brands/</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `search` | query | No | string | max length 100 |
| `isActive` | query | No | boolean |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/brands/' \
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

### 2. Create a brand (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/brands/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | min length 1, max length 100 |
| `description` | string | No | max length 5000 |
| `logoUrl` | string (uri) | No | max length 500 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "logoUrl": "https://example.com/image.jpg",
  "isActive": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/brands/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "logoUrl": "https://example.com/image.jpg",
  "isActive": true
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

### 3. Get a brand by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/brands/{id}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/brands/{id}' \
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

### 4. Update a brand (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/brands/{id}</span>
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
| `description` | string | No | max length 5000 |
| `logoUrl` | string (uri) | No | max length 500 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "logoUrl": "https://example.com/image.jpg",
  "isActive": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/brands/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "logoUrl": "https://example.com/image.jpg",
  "isActive": true
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

### 5. Delete a brand (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/brands/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/brands/{id}' \
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

### 6. Get a brand by slug

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/brands/slug/{slug}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `slug` | path | Yes | string | max length 120 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/brands/slug/{slug}' \
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
