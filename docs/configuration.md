# Configuration

Configuration is validated at startup with Zod. Invalid configuration stops the
process with a descriptive error instead of failing later at runtime.

## Application

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `3000` | HTTP port |
| `APP_URL` | `http://localhost:3000` | Public application URL used in emails and sitemaps |
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3005` | Comma-separated CORS origins |
| `TRUST_PROXY` | `false` | Trust `X-Forwarded-*` headers behind a proxy |

## Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `ecommerce_db` | Database name |
| `DB_SSL` | `false` | Enable SSL (`true`/`false`) |
| `TEST_DB_NAME` | `elysia_ecom_test` | Database used by `bun run test` |

## Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | — (required) | JWT signing secret, minimum 16 characters (32 in production) |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Block login until the email address is verified |

## Commerce

| Variable | Default | Description |
|----------|---------|-------------|
| `TAX_RATE` | `0` | Fallback tax rate when no regional rate matches |
| `PAYMENT_SIMULATE_FAILURE_RATE` | `0` | Simulated provider failure probability (`0`–`1`) |
| `PAYMENT_WEBHOOK_SECRET` | `dev-webhook-secret` | HMAC secret for provider webhooks |
| `REVIEW_AUTO_APPROVE` | `true` | Publish reviews without moderation |

## Email

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_FROM` | `no-reply@elysia-ecom.local` | Sender address |
| `MAIL_WEBHOOK_URL` | unset | Optional HTTP transport receiving `{ from, to, subject, text, html }` |
| `EMAIL_WORKER_ENABLED` | `false` | Process the outbox in-process |
| `EMAIL_WORKER_INTERVAL_MS` | `60000` | Worker interval in milliseconds |
| `EMAIL_MAX_ATTEMPTS` | `5` | Maximum delivery attempts before a message is marked failed |

Without `MAIL_WEBHOOK_URL`, development logs messages and tests skip delivery.
Production requires a configured transport.

## Currencies

Exchange rates are stored in the `currencies` table as **1 USD = rate units** of
the target currency. USD is seeded by the migration with a rate of `1`.

- `GET /api/v1/currencies` lists active currencies.
- `GET /api/v1/currencies/convert?amount=10&from=USD&to=EUR` converts an amount.
- Admin routes create/update/deactivate currencies.
- Orders and quotes accept a `currency` field and persist the applied rate.
- Catalog endpoints accept `?currency=EUR` for display conversion.

## Search

The catalog search migration requires the `pg_trgm` extension. The migration
runs `CREATE EXTENSION IF NOT EXISTS pg_trgm`. If your database user cannot
create extensions, enable it once as a superuser:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## Security notes

- Use a random `JWT_SECRET` of at least 32 characters in production.
- Set `PAYMENT_WEBHOOK_SECRET` to a provider-issued secret and rotate it.
- Restrict `ALLOWED_ORIGINS` to trusted frontends.
- API keys are stored as SHA-256 hashes; the plaintext key is returned only once.
- 2FA recovery codes are single-use and stored as hashes.
