# Authentication & API Keys

> Register, log in, rotate tokens, verify email addresses, reset passwords, configure TOTP two-factor authentication, and manage scoped API keys.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/api-keys/` | List API keys | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/api-keys/` | Create an API key | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/api-keys/{id}` | Revoke an API key | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/disable` | Disable two-factor authentication | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/enable` | Enable two-factor authentication | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/recovery-codes` | Regenerate two-factor recovery codes | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/2fa/setup` | Start two-factor authentication setup | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/forgot-password` | Request a password reset email | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/login` | Login user and get access/refresh tokens | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/logout` | Invalidate all sessions for the current user | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/refresh` | Exchange a refresh token for a new token pair | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/register` | Register a new customer account | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/resend-verification` | Resend the email verification link | Bearer |
| <span class="method-badge post">POST</span> | `/api/v1/auth/reset-password` | Reset a password using a reset token | Public |
| <span class="method-badge post">POST</span> | `/api/v1/auth/verify-email` | Verify an email address | Public |

---

## Endpoint Details

### 1. List API keys

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/api-keys/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/api-keys/' \
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

### 2. Create an API key

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/api-keys/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | min length 1, max length 100 |
| `scopes` | array<string> | No | max items 50 |

**Example request body**

```json
{
  "name": "Sample name",
  "scopes": [
    "string"
  ]
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/api-keys/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "scopes": [
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

### 3. Revoke an API key

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/api-keys/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/api-keys/{id}' \
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

### 4. Disable two-factor authentication

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/2fa/disable</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | Yes | pattern `^[0-9]{6}$` |

**Example request body**

```json
{
  "code": "SAVE10"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/2fa/disable' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `401` | Response for status 401 |

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

### 5. Enable two-factor authentication

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/2fa/enable</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `code` | string | Yes | pattern `^[0-9]{6}$` |

**Example request body**

```json
{
  "code": "SAVE10"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/2fa/enable' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "code": "SAVE10"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `401` | Response for status 401 |

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

### 6. Regenerate two-factor recovery codes

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/2fa/recovery-codes</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|

**Example request body**

```json
{}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/2fa/recovery-codes' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `401` | Response for status 401 |
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

### 7. Start two-factor authentication setup

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/2fa/setup</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/2fa/setup' \
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

### 8. Request a password reset email

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/forgot-password</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | max length 255 |

**Example request body**

```json
{
  "email": "customer@example.com"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/forgot-password' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "customer@example.com"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `422` | Response for status 422 |

**Example success response**

```json
{}
```

---

### 9. Login user and get access/refresh tokens

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/login</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | max length 255 |
| `twoFactorCode` | string | No | min length 6, max length 20 |

**Example request body**

```json
{
  "email": "customer@example.com",
  "twoFactorCode": "string"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "customer@example.com",
  "twoFactorCode": "string"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `401` | Response for status 401 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "user": {},
    "token": "token-value",
    "refreshToken": "string"
  }
}
```

---

### 10. Invalidate all sessions for the current user

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/logout</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/logout' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |

**Example success response**

```json
{}
```

---

### 11. Exchange a refresh token for a new token pair

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/refresh</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | min length 1 |

**Example request body**

```json
{
  "refreshToken": "string"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/refresh' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "refreshToken": "string"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `401` | Response for status 401 |

**Example success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "token": "token-value",
    "refreshToken": "string"
  }
}
```

---

### 12. Register a new customer account

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/register</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | max length 255 |
| `firstName` | string | No | min length 1, max length 100 |
| `lastName` | string | No | min length 1, max length 100 |

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
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/register' \
  -H 'accept: application/json' \
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

### 13. Resend the email verification link

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/resend-verification</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/resend-verification' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `409` | Response for status 409 |

**Example success response**

```json
{}
```

---

### 14. Reset a password using a reset token

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/reset-password</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `token` | string | Yes | min length 1 |

**Example request body**

```json
{
  "token": "token-value"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/reset-password' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "token": "token-value"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `422` | Response for status 422 |

**Example success response**

```json
{}
```

---

### 15. Verify an email address

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/auth/verify-email</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `token` | string | Yes | min length 1 |

**Example request body**

```json
{
  "token": "token-value"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/auth/verify-email' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "token": "token-value"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `422` | Response for status 422 |

**Example success response**

```json
{}
```

---
