# Errors & Status Codes

All responses use a predictable envelope.

## Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": {}
}
```

Paginated endpoints return pagination metadata inside `data`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

## Error

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Coupon is not applicable to the selected items",
  "error": {
    "code": "COUPON_NOT_APPLICABLE",
    "message": "Coupon is not applicable to the selected items",
    "details": null
  }
}
```

`error.code` is stable and safe to branch on. `message` is human-readable.

## HTTP status codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Malformed request (parse error) |
| `401` | Missing/invalid credentials or invalid session |
| `402` | Payment required / payment failed |
| `403` | Authenticated but not allowed |
| `404` | Resource or route not found |
| `409` | State conflict (stock, duplicate, invalid transition, currency mismatch) |
| `422` | Request validation failed |
| `429` | Rate limit exceeded |
| `500` | Unhandled server error |
| `503` | Health check degraded (database unavailable) |

## Common error codes

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 422 | Request body/query failed validation |
| `UNAUTHORIZED` | 401 | Authentication required or token invalid |
| `FORBIDDEN` | 403 | Role/ownership check failed |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Generic state conflict |
| `PRODUCT_INACTIVE` | 409 | Product is not available for purchase |
| `INSUFFICIENT_STOCK` | 409 | Requested quantity exceeds available stock |
| `INVALID_ORDER_TRANSITION` | 409 | Order status transition is not allowed |
| `INVALID_COUPON` | 422 | Coupon is invalid, inactive, or expired |
| `COUPON_MIN_ORDER` | 422 | Order does not meet the coupon minimum |
| `COUPON_NOT_APPLICABLE` | 422 | Coupon does not match the selected products/categories |
| `COUPON_NOT_STACKABLE` | 422 | A non-stackable coupon was combined with another |
| `COUPON_USER_LIMIT` | 422 | Per-user redemption limit reached |
| `COUPON_USAGE_LIMIT` | 422 | Global redemption limit reached |
| `TOO_MANY_COUPONS` | 422 | More than five coupons were supplied |
| `GIFT_CARD_CURRENCY` | 409 | Gift-card currency does not match the order |
| `GIFT_CARD_BALANCE` | 409 | Gift card has insufficient balance |
| `GIFT_CARD_EXPIRED` | 409 | Gift card has expired |
| `API_KEY_SCOPE_DENIED` | 403 | API key is missing the required scope |
| `TWO_FACTOR_REQUIRED` | 403 | 2FA code is required for login |
| `INVALID_TWO_FACTOR_CODE` | 401 | TOTP or recovery code is invalid/used |
| `UNSUPPORTED_CURRENCY` | 422 | Currency is unknown or inactive |
| `RETURN_NOT_RECEIVED` | 409 | Return must be received before refunding |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification is required |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
