# Search & Synonyms

> PostgreSQL full-text search with trigram typo tolerance. Admins can maintain synonym mappings used to expand catalog queries.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/admin/search/synonyms` | List search synonyms (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/admin/search/synonyms` | Create or replace a search synonym mapping (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/admin/search/synonyms/{id}` | Delete a search synonym mapping (Admin only) | Bearer · Admin |

---

## Endpoint Details

### 1. List search synonyms (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/admin/search/synonyms</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/admin/search/synonyms' \
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

### 2. Create or replace a search synonym mapping (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/admin/search/synonyms</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `term` | string | Yes | min length 1, max length 100 |
| `synonyms` | array<string> | Yes | min items 1, max items 50 |

**Example request body**

```json
{
  "term": "laptop",
  "synonyms": [
    "string"
  ]
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/admin/search/synonyms' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "term": "laptop",
  "synonyms": [
    "string"
  ]
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

### 3. Delete a search synonym mapping (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/admin/search/synonyms/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/admin/search/synonyms/{id}' \
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
  "data": {}
}
```

---
