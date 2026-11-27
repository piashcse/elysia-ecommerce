# Media Uploads

> Local image uploads for admins and sellers, served from `/uploads/:filename`.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge post">POST</span> | `/api/v1/uploads/` | Upload an image (Admin or Seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/uploads/{filename}` | Serve an uploaded file | Public |

---

## Endpoint Details

### 1. Upload an image (Admin or Seller)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/uploads/</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller


**Content type:** `multipart/form-data`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `file` | file | Yes |  |

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/uploads/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@image.png'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `403` | Response for status 403 |
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

### 2. Serve an uploaded file

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/uploads/{filename}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `filename` | path | Yes | string | pattern `^[a-zA-Z0-9._-]+$` |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/uploads/{filename}' \
  -H 'accept: application/json'
```


---
