# Checkout

> Calculate a complete checkout quote (variants, coupons, gift cards, tax, shipping, and currency) without creating an order.

## Authentication

Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.

All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| <span class="method-badge post">POST</span> | `/api/v1/checkout/quote` | Calculate order totals without creating an order | Guest session or Bearer |

---

## Endpoint Details

### 1. Calculate order totals without creating an order

<div class="endpoint-header">
  <span class="method-badge post">POST</span>
  <span class="endpoint-path">/api/v1/checkout/quote</span>
  <span class="auth-badge">Guest session or Bearer</span>
</div>

**Authentication:** Guest session or Bearer


**Content type:** `application/json`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `items` | array<object> | Yes | min items 1, max items 50 |
| `couponCode` | string | No | max length 50 |
| `couponCodes` | array<string> | No | max items 5 |
| `currency` | string | No | min length 3, max length 3 |
| `giftCardCode` | string | No | max length 50 |
| `shippingMethodId` | string (uuid) | No |  |
| `email` | string (email) | No | max length 255 |
| `country` | string | No | max length 100 |

**Example request body**

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "variantId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "couponCode": "string",
  "couponCodes": [
    "SAVE10"
  ],
  "currency": "USD",
  "giftCardCode": "string",
  "shippingMethodId": "00000000-0000-0000-0000-000000000000",
  "email": "customer@example.com",
  "country": "US"
}
```

**Request**

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/checkout/quote' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "variantId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1
    }
  ],
  "couponCode": "string",
  "couponCodes": [
    "SAVE10"
  ],
  "currency": "USD",
  "giftCardCode": "string",
  "shippingMethodId": "00000000-0000-0000-0000-000000000000",
  "email": "customer@example.com",
  "country": "US"
}'
```

**Responses**

| Status | Description |
|--------|-------------|
| `200` | Response for status 200 |
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
