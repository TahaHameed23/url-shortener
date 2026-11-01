# URLz

URLz is a self-hosted URL shortener built with React, Hono, and Cloudflare
Workers. Users can register, create and manage short links, and share public
redirect URLs.

## Local setup

### Prerequisites

- [Bun](https://bun.sh/) 1.2.21 or newer
- A Cloudflare account is only needed for remote resources and deployment

### Run the app locally

1. Install dependencies:

   ```sh
   bun install --frozen-lockfile
   ```

2. Create a `.dev.vars` file in the project root with a local-only signing
   secret:

   ```dotenv
   AUTH_SECRET=replace-with-a-long-random-local-secret
   ```

   `.dev.vars` is ignored by Git. Do not use a production secret here.

3. Apply the database migrations to the local D1 database:

   ```sh
   bun run db:migrate:local
   ```

4. Build the web app and start the Worker:

   ```sh
   bun run build:web
   bun run dev
   ```

   Open `http://localhost:8787`.

The Worker serves the built app from `public/`. Use `bun run dev` to run the
complete app locally; `bun run dev:web` starts Vite by itself and does not
provide the Worker API.

## Architecture

- **Web app:** `web/` contains the React UI. Vite builds it into `public/`,
  which Wrangler serves as Worker assets.
- **Worker and API:** `src/index.ts` is the Hono entry point. It applies
  request logging, security headers, API access checks, CSRF checks, and
  authentication rate limits before routing requests.
- **Routes:** `/api/v1/auth/*` handles registration, login, refresh, logout,
  and the current-user endpoint. Authenticated link management is under
  `/api/v1/links`. Public short URLs use `/l/:slug`.
- **Persistence:** D1 stores users, links, and refresh-token records. Schema
  changes live in `migrations/` and are applied with Wrangler. KV holds
  expiring link-cache entries; D1 remains the source of truth.
- **Authentication:** Access and refresh tokens are delivered in HttpOnly
  cookies. Access tokens are short-lived; refresh tokens are rotated and
  stored in D1 as hashes. Link-management routes enforce link ownership, while
  redirects remain public.

See [decisions.md](decisions.md) for additional authentication and security
design decisions.

## Development and tests

```sh
bun run typecheck
bun test
bun run build:web
```

`bun run test:unit` and `bun run test:integration` run the test groups
separately. Integration tests use an in-memory SQLite database and apply the
project migrations; they do not require Cloudflare credentials.

## Database migrations

Apply migrations to local D1 during setup, or target a remote environment
explicitly:

```sh
bun run db:migrate:local
bun run db:migrate:preview
bun run db:migrate:remote
```

Create a migration with Wrangler, then apply it to each environment that needs
the schema change:

```sh
bunx wrangler d1 migrations create urlz <migration-name>
```

## Deployment

The GitHub Actions workflow runs type checks, tests, and the web build on
pushes and pull requests targeting `main`. Merging to `main` triggers a
production deployment. Same-repository pull requests also receive a Cloudflare
Preview; fork pull requests run checks without a Preview deployment.

Configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions
secrets. Configure `AUTH_SECRET` as a Cloudflare Worker secret for production.
Preview deployments also require the `PREVIEW_AUTH_SECRET` GitHub Actions
secret. Keep preview resources and secrets separate from production.

Deploy manually with:

```sh
bun run build:web
bun run deploy
```
