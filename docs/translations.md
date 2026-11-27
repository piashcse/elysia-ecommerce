# Translations & Localization

> Product and category translations keyed by BCP-47 locale. Catalog endpoints accept a `locale` query parameter to return localized content.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/categories/{id}/translations` | List category translations | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/categories/{id}/translations/{locale}` | Create or update a category translation (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/categories/{id}/translations/{locale}` | Delete a category translation (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/translations` | List product translations | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/{id}/translations/{locale}` | Create or update a product translation | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/{id}/translations/{locale}` | Delete a product translation | Bearer |

---

## Endpoint Details

### 1. List category translations

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/categories/{id}/translations</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/categories/{id}/translations' \
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

### 2. Create or update a category translation (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/categories/{id}/translations/{locale}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `locale` | path | Yes | string | min length 2, max length 10, pattern `^[a-zA-Z]{2}(-[a-zA-Z]{2})?$` |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | min length 1, max length 255 |
| `description` | string | No | max length 5000 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/categories/{id}/translations/{locale}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string"
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

### 3. Delete a category translation (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/categories/{id}/translations/{locale}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `locale` | path | Yes | string | min length 2, max length 10, pattern `^[a-zA-Z]{2}(-[a-zA-Z]{2})?$` |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/categories/{id}/translations/{locale}' \
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

### 4. List product translations

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/{id}/translations</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/{id}/translations' \
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

### 5. Create or update a product translation

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/products/{id}/translations/{locale}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `locale` | path | Yes | string | min length 2, max length 10, pattern `^[a-zA-Z]{2}(-[a-zA-Z]{2})?$` |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | min length 1, max length 255 |
| `description` | string | No | max length 5000 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/products/{id}/translations/{locale}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string"
}'
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

### 6. Delete a product translation

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/products/{id}/translations/{locale}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `locale` | path | Yes | string | min length 2, max length 10, pattern `^[a-zA-Z]{2}(-[a-zA-Z]{2})?$` |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/products/{id}/translations/{locale}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `403` | Response for status 403 |

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
