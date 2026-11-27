# Elysia E-Commerce API

> A production-oriented e-commerce backend built with **Elysia.js**, **Bun**, **Drizzle ORM**, and **PostgreSQL**.

[![CI](https://github.com/piashcse/elysia-ecommerce/actions/workflows/ci.yml/badge.svg)](https://github.com/piashcse/elysia-ecommerce/actions/workflows/ci.yml)
[![Docs](https://github.com/piashcse/elysia-ecommerce/actions/workflows/docs.yml/badge.svg)](https://piashcse.github.io/elysia-ecommerce/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

## What is included

<div class="grid cards" markdown>

-   :material-cart-outline: **Checkout that handles reality**

    Guest carts, variant-level pricing and stock, checkout quotes, idempotent order creation, payment windows, order timelines, and guest order tokens.

-   :material-earth: **Catalog & discovery**

    Brands, category trees, slugs/SEO metadata, facets, related products, review images, product Q&A, multi-currency display, translations, and full-text search with typo tolerance.

-   :material-truck-fast-outline: **Post-purchase**

    Regional tax rates, country-aware shipping/free-shipping rules, returns/RMA with stock restoration, refunds, and printable invoices.

-   :material-credit-card-outline: **Payments & messaging**

    Provider adapter, signed/idempotent webhooks, saved tokenized methods, notification preferences, and a retried transactional email outbox.

-   :material-storefront-outline: **Marketplace operations**

    Seller fulfillment, commission/payout tracking, coupon scopes and stacking, gift cards, sales reports, and audit logs.

-   :material-shield-lock-outline: **Security & platform**

    TOTP 2FA with recovery codes, scoped API keys, GDPR export/deletion, `/api/v1` aliases, Prometheus metrics, and health checks.

</div>

## Quick start

```bash
git clone https://github.com/piashcse/elysia-ecommerce.git
cd elysia-ecommerce
bun install
cp .env.example .env
# edit .env with your database credentials
bun run db:migrate
bun run dev
```

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/swagger`
- OpenAPI JSON: `http://localhost:3000/swagger/json`

## Base URL & versioning

Every route is available under the stable **`/api/v1`** prefix:

```
http://localhost:3000/api/v1/products/
```

The unversioned equivalents (`/products/`, `/orders/`, …) remain available for
backwards compatibility. New integrations should use `/api/v1`.

## Authentication at a glance

```http
Authorization: Bearer <access-token>
```

or, for machine clients:

```http
X-API-Key: <api-key>
```

API key scopes support `read`, `write`, `*`, or resource scopes such as
`read:products`. Keys without scopes have full access.

## Explore the reference

- [Endpoint index](api-reference/index.md) — all 174 operations grouped by module
- [Authentication & API keys](authentication.md)
- [Orders](orders.md) · [Payments](payments.md) · [Products](products.md)
- [Currencies & FX](currencies.md) · [Translations](translations.md) · [Search](search.md)
- [Configuration](configuration.md) · [Errors](errors.md) · [Changelog](changelog.md)

## Documentation development

```bash
pip install -r requirements-docs.txt
bun run docs:snapshot   # refresh OpenAPI snapshot (server must be running)
bun run docs:generate   # regenerate the Markdown API reference
bun run docs:serve      # http://127.0.0.1:8000
```

Documentation is published automatically to GitHub Pages on every push to
`main` that touches `docs/**`, `mkdocs.yml`, or `requirements-docs.txt`.
