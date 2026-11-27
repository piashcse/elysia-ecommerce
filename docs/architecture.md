# Architecture

The application is a modular monolith designed around clear service boundaries.
Controllers only translate HTTP requests and responses; business rules live in
services; Drizzle ORM owns persistence.

## Request lifecycle

```text
Request
  → request ID + security headers + CORS
  → rate limiter
  → auth plugin (JWT or API key, loads the live user)
  → route validation (TypeBox)
  → controller
  → service / database transaction
  → response envelope + sanitization
  → logging / audit middleware
Response
```

Key files:

| File | Responsibility |
|------|----------------|
| `src/server.ts` | App composition, middleware, error handler, OpenAPI |
| `src/core/auth.ts` | JWT/API-key authentication and role macros |
| `src/core/responses.ts` | Success/paginated/error envelopes and sanitization |
| `src/config/database.ts` | PostgreSQL pool and Drizzle client |
| `src/core/base.service.ts` | Shared find/create/update primitives |
| `src/database/schema/` | Drizzle table definitions and indexes |
| `drizzle/` | Tracked SQL migrations and metadata |

## Modules

```text
src/modules/
  auth/          register, login, refresh, 2FA, API keys
  user/          profiles, admin users, GDPR export/delete
  seller/        seller catalog, orders, fulfillment, payouts
  product/       products, images, variants, Q&A
  category/      hierarchy, slugs, trees
  brand/         brand catalog
  cart/          authenticated + guest carts
  wishlist/      saved products
  checkout/      quote calculation
  order/         creation, pricing, events, invoices
  payment/       provider adapter, webhooks, saved methods
  review/        reviews, helpful votes, review images
  coupon/        validations, usage, scopes, stacking
  gift-card/     balances and redemption
  shipping/      methods, eligibility, free-shipping rules
  tax/           regional rates
  returns/       RMA and refunds
  notification/  in-app notifications, email outbox, preferences
  translation/   product/category locales
  currency/      exchange rates and conversion
  search/        synonym management
  media/         local image uploads
  seo/           sitemap
  admin/         reports and audit logs
  system/        metrics
```

Each module follows the same layout:

```text
modules/<domain>/
  controller/    Elysia route definitions
  service/       business logic
  dto/           request/domain types
```

## Data & migrations

- Schema definitions live in `src/database/schema/`.
- Migrations are generated with `bun run db:generate` and applied with
  `bun run db:migrate`.
- The catalog search migration enables the PostgreSQL `pg_trgm` extension and
  creates full-text/trigram GIN indexes.

## Transactions

Checkout, stock changes, coupon usage, gift-card redemption, and payment
records run inside database transactions. Stock updates use conditional
`UPDATE … WHERE stock >= quantity` statements so concurrent checkouts cannot
oversell inventory.

## Background work

- **Email outbox** — transactional emails are persisted first, then delivered
  by `POST /emails/process` or the in-process worker
  (`EMAIL_WORKER_ENABLED=true`). Failed attempts use exponential backoff.
- **Expired orders** — call `POST /orders/release-expired` from your scheduler
  to cancel unpaid orders, restore stock, release coupons, and restore gift-card
  balances.

## External integrations

The codebase ships adapter boundaries rather than hard dependencies:

| Concern | Current implementation |
|---------|------------------------|
| Payments | Simulated provider + signed webhook contract |
| Email | Dev logging + optional `MAIL_WEBHOOK_URL` transport |
| Media | Local `uploads/` directory served by the API |
| Search | PostgreSQL full-text + trigram (no external engine required) |
| Shipping rates | Configured shipping methods and country rules |
