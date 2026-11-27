# Categories

> Hierarchical categories with slugs, SEO metadata, recursive trees, category product listings, and locale-aware responses.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/categories/` | Get all categories with pagination | Public |
| <span class="method-badge post">POST</span> | `/api/v1/categories/` | Create a new category (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/categories/{id}` | Get category by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/categories/{id}` | Update category by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/categories/{id}` | Delete category by ID (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/categories/{id}/products` | Get products in a specific category | Public |
| <span class="method-badge get">GET</span> | `/api/v1/categories/slug/{slug}` | Get a category by slug | Public |
| <span class="method-badge get">GET</span> | `/api/v1/categories/tree` | Get the category tree | Public |

---

## Endpoint Details

### 1. Get all categories with pagination

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/categories/</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `search` | query | No | string | max length 100 |
| `isActive` | query | No | boolean |  |
| `locale` | query | No | string | min length 2, max length 10 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/categories/' \
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

### 2. Create a new category (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/categories/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | min length 1, max length 100 |
| `description` | string | No | max length 5000 |
| `imageUrl` | string (uri) | No | max length 500 |
| `parentId` | string (uuid) | No |  |
| `slug` | string | No | max length 120 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "imageUrl": "https://example.com/image.jpg",
  "parentId": "00000000-0000-0000-0000-000000000000",
  "slug": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "isActive": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/categories/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "imageUrl": "https://example.com/image.jpg",
  "parentId": "00000000-0000-0000-0000-000000000000",
  "slug": "string",
  "metaTitle": "string",
  "metaDescription": "string",
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

### 3. Get category by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/categories/{id}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `locale` | query | No | string | min length 2, max length 10 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/categories/{id}' \
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

### 4. Update category by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/categories/{id}</span>
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
| `imageUrl` | string (uri) | No | max length 500 |
| `parentId` | string (uuid) | No |  |
| `slug` | string | No | max length 120 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "imageUrl": "https://example.com/image.jpg",
  "parentId": "00000000-0000-0000-0000-000000000000",
  "slug": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "isActive": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/categories/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "imageUrl": "https://example.com/image.jpg",
  "parentId": "00000000-0000-0000-0000-000000000000",
  "slug": "string",
  "metaTitle": "string",
  "metaDescription": "string",
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

### 5. Delete category by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/categories/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/categories/{id}' \
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
  "data": "string"
}
```

---

### 6. Get products in a specific category

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/categories/{id}/products</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `isActive` | query | No | boolean |  |
| `locale` | query | No | string | min length 2, max length 10 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/categories/{id}/products' \
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

### 7. Get a category by slug

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/categories/slug/{slug}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `slug` | path | Yes | string | max length 120 |
| `locale` | query | No | string | min length 2, max length 10 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/categories/slug/{slug}' \
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

### 8. Get the category tree

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/categories/tree</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `locale` | query | No | string | min length 2, max length 10 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/categories/tree' \
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
