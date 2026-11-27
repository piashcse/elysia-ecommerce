# Admin Reports & Audit

> Sales/product/category reporting and a searchable audit trail of mutating requests.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/admin/audit-logs/` | List audit logs (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/admin/reports/sales` | Sales and product reports (Admin only) | Bearer · Admin |

---

## Endpoint Details

### 1. List audit logs (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/admin/audit-logs/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |
| `userId` | query | No | string (uuid) |  |
| `path` | query | No | string | max length 200 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/admin/audit-logs/' \
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

### 2. Sales and product reports (Admin only)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/admin/reports/sales</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `from` | query | No | string (date-time) |  |
| `to` | query | No | string (date-time) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/admin/reports/sales' \
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
