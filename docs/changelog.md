# Changelog

## 1.1.0 — Platform completion

### Checkout & orders
- Variant-level cart/order pricing and stock.
- Guest carts via `X-Session-Id`, guest order tokens, and cart merge on login.
- Checkout quotes, order numbers, payment expiry, and expired-order release.
- Order events/timeline and `Idempotency-Key` order creation.

### Post-purchase
- Regional tax rates and tax snapshots on orders.
- Country-aware shipping methods and free-shipping thresholds.
- Returns/RMA with stock restoration and refunds.
- Printable HTML invoices.

### Payments & messaging
- Provider abstraction with a simulated provider.
- Signed, idempotent payment webhook.
- Saved tokenized payment methods.
- Transactional email outbox/templates and notification preferences.
- Outbox retry/backoff and optional background worker.

### Catalog & discovery
- Brands, category hierarchy/slugs/SEO, product slugs/brands/meta.
- Facets, related products, sitemap, and local media uploads.
- Review images and product Q&A.
- PostgreSQL full-text search with trigram typo tolerance and synonyms.
- Product/category translations with `locale` support.
- Multi-currency rates, catalog display conversion, and order/quote currency snapshots.

### Marketplace & admin
- Coupon product/category scopes, stacking rules, and shipping discounts.
- Gift cards with checkout redemption and cancellation restoration.
- Seller commission rates, payouts, and item-level fulfillment.
- Admin sales/product/category reports.
- Audit logging for mutating requests.

### Security & platform
- TOTP two-factor authentication with single-use recovery codes.
- Hashed API keys with read/write/resource scopes.
- GDPR data export and account anonymization.
- Soft-delete filtering for users.
- Stable `/api/v1` aliases and Prometheus-style metrics.
- Health/readiness endpoint.

## 1.0.0 — Initial release

- JWT authentication with refresh tokens and role-based access.
- Users, sellers, products, categories, carts, wishlists, orders, payments.
- Reviews, coupons, notifications, shipping methods, and addresses.
- Swagger UI, validation, rate limiting, security headers, and structured logging.
