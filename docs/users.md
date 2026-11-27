# Users & Profiles

> Profile management, password changes, admin user administration, GDPR data export, and account deletion/anonymization.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/users/` | Get all users (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/users/` | Create a user (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/users/{id}` | Get user by ID | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/users/{id}` | Update user by ID (Admin or Self) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/users/{id}` | Delete user by ID (Admin or Self) | Bearer · Admin |
| <span class="method-badge put">PUT</span> | `/api/v1/users/change-password` | Change user password | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/users/me` | Delete the current account and anonymize personal data | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/users/me/export` | Export the current user data | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/users/profile` | Get current user profile | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/users/profile` | Update current user profile | Bearer |

---

## Endpoint Details

### 1. Get all users (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/users/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `role` | query | No | enum(admin, seller, customer) |  |
| `search` | query | No | string | max length 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/users/' \
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

### 2. Create a user (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/users/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | max length 255 |
| `firstName` | string | No | max length 100 |
| `lastName` | string | No | max length 100 |
| `role` | enum(admin, seller, customer) | No |  |

**Example request body**

```json
{
  "email": "customer@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "admin"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/users/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "customer@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "admin"
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

### 3. Get user by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/users/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/users/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
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

### 4. Update user by ID (Admin or Self)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/users/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string (email) | No | max length 255 |
| `firstName` | string | No | max length 100 |
| `lastName` | string | No | max length 100 |
| `role` | enum(admin, seller, customer) | No |  |
| `isActive` | boolean | No |  |

**Example request body**

```json
{
  "email": "customer@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "admin",
  "isActive": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/users/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "customer@example.com",
  "firstName": "string",
  "lastName": "string",
  "role": "admin",
  "isActive": true
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
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

### 5. Delete user by ID (Admin or Self)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/users/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/users/{id}' \
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

### 6. Change user password

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/users/change-password</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `currentPassword` | string | Yes | min length 1, max length 128 |
| `newPassword` | string | Yes | min length 8, max length 128 |

**Example request body**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/users/change-password' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "currentPassword": "string",
  "newPassword": "string"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
| `403` | Response for status 403 |
| `422` | Response for status 422 |

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

### 7. Delete the current account and anonymize personal data

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/users/me</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/users/me' \
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

### 8. Export the current user data

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/users/me/export</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/users/me/export' \
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

### 9. Get current user profile

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/users/profile</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/users/profile' \
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

### 10. Update current user profile

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/users/profile</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string (email) | No | max length 255 |
| `firstName` | string | No | max length 100 |
| `lastName` | string | No | max length 100 |

**Example request body**

```json
{
  "email": "customer@example.com",
  "firstName": "string",
  "lastName": "string"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/users/profile' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "customer@example.com",
  "firstName": "string",
  "lastName": "string"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
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
