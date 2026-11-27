# Development

## Prerequisites

- [Bun](https://bun.sh/) 1.4+
- PostgreSQL 16+
- Python 3.12+ (documentation only)

## Setup

```bash
git clone https://github.com/piashcse/elysia-ecommerce.git
cd elysia-ecommerce
bun install
cp .env.example .env
```

Set at minimum:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=elysia_ecom
JWT_SECRET=replace-with-a-long-random-secret
```

Create the database, then apply migrations:

```bash
bun run db:migrate
bun run dev
```

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/swagger`
- OpenAPI JSON: `http://localhost:3000/swagger/json`

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start with hot reload |
| `bun run start` | Start the server |
| `bun run build` | Bundle to `dist/app.js` |
| `bun run typecheck` | TypeScript check |
| `bun run test` | Migrate/truncate the test DB and run tests |
| `bun run check` | Typecheck + tests |
| `bun run db:generate` | Generate a migration from schema changes |
| `bun run db:migrate` | Apply tracked migrations |
| `bun run db:push` | Push schema directly (development only) |
| `bun run db:studio` | Open Drizzle Studio |

## Testing

Tests run against `TEST_DB_NAME` (default `elysia_ecom_test`). The test helper
creates the database, applies migrations, and truncates tables between runs.

```bash
bun run test
# or
bun run check
```

Test files live in `src/tests/` and exercise the HTTP API through
`app.handle()`, so they cover routing, validation, auth, and persistence.

## Documentation

The docs site uses [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

```bash
pip install -r requirements-docs.txt

# 1. Refresh the OpenAPI snapshot (server must be running)
bun run docs:snapshot

# 2. Regenerate the Markdown API reference
bun run docs:generate

# 3. Preview
bun run docs:serve
```

`docs/openapi.json` is committed so the GitHub Pages workflow can build the
site without a database or running server. Regenerate the snapshot whenever a
route or request/response schema changes.

Generated files:

- `docs/<module>.md` — one page per OpenAPI tag
- `docs/api-reference/index.md` — endpoint index grouped by module

Overview and guide pages (`index.md`, `architecture.md`, `configuration.md`,
`errors.md`, `development.md`, `changelog.md`) are maintained by hand.

## Publishing

`.github/workflows/docs.yml` builds the site with `mkdocs build --strict` and
deploys it to the `gh-pages` branch using `mkdocs gh-deploy`. The workflow runs
on pushes to `main` that touch docs-related files, and can be triggered manually.

One-time repository setup:

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select the `gh-pages` branch and `/ (root)`.
5. Save. The first workflow run creates/updates the branch.

!!! warning "If the site shows only the README"
    This means GitHub Pages is still serving the `main` branch root, not the
    built MkDocs site. Change **Settings → Pages → Source** to
    **Deploy from a branch → `gh-pages` → `/ (root)`**.

    `main / (root)` uses Jekyll and renders `README.md`; it does **not** serve
    the MkDocs output. The `docs.yml` workflow deploys the MkDocs site to the
    `gh-pages` branch with `mkdocs gh-deploy`.

The workflow also prints a warning annotation if the repository's Pages source
is not `gh-pages`.
