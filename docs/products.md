# Products & Variants

> Catalog CRUD, product slugs, images, variants, related products, facets, questions and answers, and display currency/locale options.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge get">GET</span> | `/api/v1/products/` | Get all products with filters | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/` | Create a new product (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}` | Get product by ID | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/{id}` | Update product by ID (Admin only) | Bearer · Admin |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/{id}` | Delete product by ID (Admin only) | Bearer · Admin |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/images` | Get product images | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/{id}/images` | Add a product image (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/questions` | List product questions and answers | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/{id}/questions` | Ask a product question | Bearer |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/related` | Get related products | Public |
| <span class="method-badge get">GET</span> | `/api/v1/products/{id}/variants` | Get product variants | Public |
| <span class="method-badge post">POST</span> | `/api/v1/products/{id}/variants` | Create a product variant (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/products/facets` | Get catalog facets | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/images/{imageId}` | Update a product image (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/images/{imageId}` | Delete a product image (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge get">GET</span> | `/api/v1/products/slug/{slug}` | Get a product by slug | Public |
| <span class="method-badge put">PUT</span> | `/api/v1/products/variants/{variantId}` | Update a product variant (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge delete">DELETE</span> | `/api/v1/products/variants/{variantId}` | Delete a product variant (Admin or owning seller) | Bearer · Admin/Seller |
| <span class="method-badge post">POST</span> | `/api/v1/questions/{id}/answers` | Answer a product question (seller/admin) | Bearer · Admin/Seller |

---

## Endpoint Details

### 1. Get all products with filters

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `search` | query | No | string | max length 200 |
| `category` | query | No | string (uuid) |  |
| `brandId` | query | No | string (uuid) |  |
| `sellerId` | query | No | string (uuid) |  |
| `minPrice` | query | No | number | min 0 |
| `maxPrice` | query | No | number | min 0 |
| `inStock` | query | No | boolean |  |
| `isActive` | query | No | boolean |  |
| `sortBy` | query | No | enum(name, price, createdAt, updatedAt) |  |
| `sortOrder` | query | No | enum(asc, desc) |  |
| `locale` | query | No | string | min length 2, max length 10 |
| `currency` | query | No | string | min length 3, max length 3 |
| `page` | query | No | integer | min 1 |
| `limit` | query | No | integer | min 1, max 100 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/' \
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

### 2. Create a new product (Admin only)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/products/</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | min length 1, max length 255 |
| `slug` | string | No | max length 280 |
| `description` | string | No | max length 5000 |
| `metaTitle` | string | No | max length 200 |
| `metaDescription` | string | No | max length 500 |
| `price` | number | Yes | min 0 |
| `imageUrl` | string (uri) | No | max length 500 |
| `stockQuantity` | integer | Yes | min 0 |
| `weightGrams` | integer | No | min 0 |
| `sku` | string | Yes | min length 1, max length 100 |
| `isActive` | boolean | No |  |
| `categoryId` | string (uuid) | No |  |
| `brandId` | string (uuid) | No |  |
| `sellerId` | string (uuid) | Yes |  |

**Example request body**

```json
{
  "name": "Sample name",
  "slug": "string",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string",
  "price": 9.99,
  "imageUrl": "https://example.com/image.jpg",
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "isActive": true,
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "brandId": "00000000-0000-0000-0000-000000000000",
  "sellerId": "00000000-0000-0000-0000-000000000000"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/products/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "slug": "string",
  "description": "Sample description",
  "metaTitle": "string",
  "metaDescription": "string",
  "price": 9.99,
  "imageUrl": "https://example.com/image.jpg",
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "isActive": true,
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "brandId": "00000000-0000-0000-0000-000000000000",
  "sellerId": "00000000-0000-0000-0000-000000000000"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `400` | Response for status 400 |
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

### 3. Get product by ID

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/{id}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `locale` | query | No | string | min length 2, max length 10 |
| `currency` | query | No | string | min length 3, max length 3 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/{id}' \
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

### 4. Update product by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/products/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | No | min length 1, max length 255 |
| `description` | string | No | max length 5000 |
| `price` | number | No | min 0 |
| `imageUrl` | string (uri) | No | max length 500 |
| `stockQuantity` | integer | No | min 0 |
| `weightGrams` | integer | No | min 0 |
| `sku` | string | No | min length 1, max length 100 |
| `isActive` | boolean | No |  |
| `categoryId` | string (uuid) | No |  |
| `sellerId` | string (uuid) | No |  |

**Example request body**

```json
{
  "name": "Sample name",
  "description": "Sample description",
  "price": 9.99,
  "imageUrl": "https://example.com/image.jpg",
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "isActive": true,
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "sellerId": "00000000-0000-0000-0000-000000000000"
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/products/{id}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Sample name",
  "description": "Sample description",
  "price": 9.99,
  "imageUrl": "https://example.com/image.jpg",
  "stockQuantity": 1,
  "weightGrams": 1,
  "sku": "SKU-001",
  "isActive": true,
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "sellerId": "00000000-0000-0000-0000-000000000000"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
| `400` | Response for status 400 |
| `404` | Response for status 404 |
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

### 5. Delete product by ID (Admin only)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/products/{id}</span>
  <span class="auth-badge">Bearer · Admin</span>
</div>

**Authentication:** Bearer · Admin

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/products/{id}' \
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
  "data": "string"
}
```

---

### 6. Get product images

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/{id}/images</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/{id}/images' \
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

### 7. Add a product image (Admin or owning seller)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/products/{id}/images</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `imageUrl` | string (uri) | Yes | max length 500 |
| `altText` | string | No | max length 255 |
| `displayOrder` | integer | No | min 0 |
| `isPrimary` | boolean | No |  |

**Example request body**

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "altText": "string",
  "displayOrder": 0,
  "isPrimary": true
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/products/{id}/images' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "imageUrl": "https://example.com/image.jpg",
  "altText": "string",
  "displayOrder": 0,
  "isPrimary": true
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

### 8. List product questions and answers

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/{id}/questions</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/{id}/questions' \
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

### 9. Ask a product question

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/products/{id}/questions</span>
  <span class="auth-badge">Bearer</span>
</div>

**Authentication:** Bearer

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `question` | string | Yes | min length 5, max length 2000 |

**Example request body**

```json
{
  "question": "Does this include a warranty?"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/products/{id}/questions' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "question": "Does this include a warranty?"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `404` | Response for status 404 |
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

### 10. Get related products

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/{id}/related</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |
| `limit` | query | No | integer | min 1, max 20 |
| `locale` | query | No | string | min length 2, max length 10 |
| `currency` | query | No | string | min length 3, max length 3 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/{id}/related' \
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

### 11. Get product variants

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/{id}/variants</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/{id}/variants' \
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

### 12. Create a product variant (Admin or owning seller)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/products/{id}/variants</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `sku` | string | Yes | min length 1, max length 100 |
| `name` | string | Yes | min length 1, max length 200 |
| `price` | number | Yes | min 0 |
| `stockQuantity` | integer | Yes | min 0 |
| `imageUrl` | string (uri) | No | max length 500 |
| `isActive` | boolean | No |  |
| `attributes` | array<object> | No |  |

**Example request body**

```json
{
  "sku": "SKU-001",
  "name": "Sample name",
  "price": 9.99,
  "stockQuantity": 1,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true,
  "attributes": [
    {
      "name": "Sample name",
      "value": "string"
    }
  ]
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/products/{id}/variants' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "sku": "SKU-001",
  "name": "Sample name",
  "price": 9.99,
  "stockQuantity": 1,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true,
  "attributes": [
    {
      "name": "Sample name",
      "value": "string"
    }
  ]
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
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

### 13. Get catalog facets

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/facets</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public



**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/facets' \
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

### 14. Update a product image (Admin or owning seller)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/products/images/{imageId}</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `imageId` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `imageUrl` | string (uri) | No | max length 500 |
| `altText` | string | No | max length 255 |
| `displayOrder` | integer | No | min 0 |
| `isPrimary` | boolean | No |  |

**Example request body**

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "altText": "string",
  "displayOrder": 0,
  "isPrimary": true
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/products/images/{imageId}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "imageUrl": "https://example.com/image.jpg",
  "altText": "string",
  "displayOrder": 0,
  "isPrimary": true
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

### 15. Delete a product image (Admin or owning seller)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/products/images/{imageId}</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `imageId` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/products/images/{imageId}' \
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
  "data": "string"
}
```

---

### 16. Get a product by slug

<div class="endpoint-header">
  <span class="method-badge get">GET</span>
  <span class="endpoint-path">/api/v1/products/slug/{slug}</span>
  <span class="auth-badge public">Public</span>
</div>

**Authentication:** Public

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `slug` | path | Yes | string | max length 280 |
| `locale` | query | No | string | min length 2, max length 10 |
| `currency` | query | No | string | min length 3, max length 3 |


**Request**

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/products/slug/{slug}' \
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

### 17. Update a product variant (Admin or owning seller)

<div class="endpoint-header">
  <span class="method-badge put">PUT</span>
  <span class="endpoint-path">/api/v1/products/variants/{variantId}</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `variantId` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `sku` | string | No | min length 1, max length 100 |
| `name` | string | No | min length 1, max length 200 |
| `price` | number | No | min 0 |
| `stockQuantity` | integer | No | min 0 |
| `imageUrl` | string (uri) | No | max length 500 |
| `isActive` | boolean | No |  |
| `attributes` | array<object> | No |  |

**Example request body**

```json
{
  "sku": "SKU-001",
  "name": "Sample name",
  "price": 9.99,
  "stockQuantity": 1,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true,
  "attributes": [
    {
      "name": "Sample name",
      "value": "string"
    }
  ]
}
```

**Request**

```bash
curl -X 'PUT' \
  'http://localhost:3000/api/v1/products/variants/{variantId}' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "sku": "SKU-001",
  "name": "Sample name",
  "price": 9.99,
  "stockQuantity": 1,
  "imageUrl": "https://example.com/image.jpg",
  "isActive": true,
  "attributes": [
    {
      "name": "Sample name",
      "value": "string"
    }
  ]
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
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

### 18. Delete a product variant (Admin or owning seller)

<div class="endpoint-header">
  <span class="method-badge delete">DELETE</span>
  <span class="endpoint-path">/api/v1/products/variants/{variantId}</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `variantId` | path | Yes | string (uuid) |  |


**Request**

```bash
curl -X 'DELETE' \
  'http://localhost:3000/api/v1/products/variants/{variantId}' \
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
  "data": "string"
}
```

---

### 19. Answer a product question (seller/admin)

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/questions/{id}/answers</span>
  <span class="auth-badge">Bearer · Admin/Seller</span>
</div>

**Authentication:** Bearer · Admin/Seller

| Parameter | In | Required | Type | Constraints / Description |
|-----------|----|----------|------|---------------------------|
| `id` | path | Yes | string (uuid) |  |

**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `answer` | string | Yes | min length 1, max length 5000 |

**Example request body**

```json
{
  "answer": "Yes, one year."
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/questions/{id}/answers' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "answer": "Yes, one year."
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `201` | Response for status 201 |
| `403` | Response for status 403 |
| `404` | Response for status 404 |

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
