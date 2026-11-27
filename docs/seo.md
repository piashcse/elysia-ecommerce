# SEO & Sitemap

> XML sitemap generation for search engines, covering active products, categories, and brands.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/sitemap.xml` | SEO sitemap (XML) | Public |

---

## Endpoint Details

### 1. SEO sitemap (XML)

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/sitemap.xml</span>
  <span class="auth-badge public">Public</span>
</div>

Returns an XML sitemap of active products, categories, and brands.

**Authentication:** Public



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/sitemap.xml' \
  -H 'accept: application/json'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | XML sitemap |

---
