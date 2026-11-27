# System & Monitoring

> Health/readiness checks and Prometheus-style runtime metrics.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/metrics` |  | Public |
| <span class="method-badge get">GET</span> | `/health` | Health check and database readiness | Public |

---

## Endpoint Details

### 1. GET /api/v1/metrics

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/metrics</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/metrics' \
  -H 'accept: application/json'
```


---

### 2. Health check and database readiness

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/health</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/health' \
  -H 'accept: application/json'
```


---
