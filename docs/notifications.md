# Notifications & Email

> In-app notifications, notification preferences, and the transactional email outbox with retry/backoff processing.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/emails/` | List the email outbox (Admin only) | Bearer · Admin |
| <span class="method-badge post">POST</span> | `/api/v1/emails/process` | Process pending emails (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/notifications/` | Get all notifications for the authenticated user | Bearer |
| <span class="method-badge delete">DELETE</span> | `/api/v1/notifications/{id}` | Delete a notification | Bearer |
| <span class="method-badge patch">PATCH</span> | `/api/v1/notifications/{id}/read` | Mark a notification as read | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/notifications/preferences` | Get notification preferences | Bearer |
| <span class="method-badge put">PUT</span> | `/api/v1/notifications/preferences` | Update notification preferences | Bearer |
| <span class="method-badge patch">PATCH</span> | `/api/v1/notifications/read/all` | Mark all notifications as read | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/notifications/unread-count` | Get unread notification count | Bearer |

---

## Endpoint Details

### 1. List the email outbox (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/emails/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/emails/' \
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

### 2. Process pending emails (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/emails/process</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `limit` | integer | No | min 1, max 100 |

**Example request body**

```json
{
  "limit": 1
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/emails/process' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "limit": 1
}'
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

### 3. Get all notifications for the authenticated user

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/notifications/</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/notifications/' \
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

### 4. Delete a notification

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/notifications/{id}</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/notifications/{id}' \
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

### 5. Mark a notification as read

<div class="endpoint-header">
  <span class="method-badge patch">PATCH</span>
  <span class="endpoint-path">/api/v1/notifications/{id}/read</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'PATCH' \
  'http://localhost:3000/api/v1/notifications/{id}/read' \
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

### 6. Get notification preferences

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/notifications/preferences</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/notifications/preferences' \
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

### 7. Update notification preferences

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/notifications/preferences</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `preferences` | array<object> | Yes | min items 1, max items 50 |

**Example request body**

```json
{
  "preferences": [
    {
      "type": "string",
      "inAppEnabled": true,
      "emailEnabled": true
    }
  ]
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/notifications/preferences' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "preferences": [
    {
      "type": "string",
      "inAppEnabled": true,
      "emailEnabled": true
    }
  ]
}'
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

### 8. Mark all notifications as read

<div class="endpoint-header">
  <span class="method-badge patch">PATCH</span>
  <span class="endpoint-path">/api/v1/notifications/read/all</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'PATCH' \
  'http://localhost:3000/api/v1/notifications/read/all' \
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
  "data": "string"
}
```

---

### 9. Get unread notification count

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/notifications/unread-count</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/notifications/unread-count' \
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
    "count": 1
  }
}
```

---
