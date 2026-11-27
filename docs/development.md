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

# 4. Build exactly like CI
bun run docs:build
```

Publishing helpers:

| Command | Description |
|---------|-------------|
| `bun run docs:fix-pages` | Point GitHub Pages at `gh-pages` and queue a build |
| `bun run docs:build` | Build with `mkdocs build --strict` |

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
2. Run `bun run docs:fix-pages` (requires `gh auth login`), **or** open
   **Settings → Pages** and set **Source** to **Deploy from a branch →
   `gh-pages` → `/ (root)`**.
3. The docs workflow creates/updates `gh-pages` and queues a Pages build.

!!! warning "If the site shows only the README"
    This means GitHub Pages is still serving the `main` branch root, not the
    built MkDocs site. Run `bun run docs:fix-pages`, or change
    **Settings → Pages → Source** to
    **Deploy from a branch → `gh-pages` → `/ (root)`**.

    `main / (root)` uses Jekyll and renders `README.md`; it does **not** serve
    the MkDocs output. The `docs.yml` workflow deploys the MkDocs site to the
    `gh-pages` branch with `mkdocs gh-deploy`.

Because pushes made with the workflow's `GITHUB_TOKEN` do not trigger a Pages
build, the workflow explicitly requests a build after deploying. It also fails
with the exact `gh api` command if the Pages source is not `gh-pages`.
