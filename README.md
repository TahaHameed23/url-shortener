# URLz

## Run locally with Docker

This runs the Worker with Wrangler's local runtime and local D1/KV emulation.
It is for local development, not a production Cloudflare deployment.

1. Copy `.dev.vars.example` to `.dev.vars` and replace the sample
   `AUTH_SECRET` with a random local value.
2. Build the image, apply the local database migrations, and start the API:

```powershell
Copy-Item .dev.vars.example .dev.vars
docker compose build
docker compose run --rm api ./node_modules/.bin/wrangler d1 migrations apply urlz --local --persist-to /data
docker compose up
```

Open `http://localhost:8787`. Wrangler's D1 and KV state is stored in the
`urlz-data` Docker volume and survives container restarts. Apply the migration
command again after adding a migration. Rebuild the image after changing the
application code:

```powershell
docker compose up --build
```

Stop the container with `Ctrl+C`; `docker compose down` stops and removes the
container without deleting the database volume.

Run the complete test suite, or run unit and API integration tests separately:

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

## Chrome extension

The MV3 extension lives in `web/extension` and is built separately from the
website:

```txt
bun run build:extension
```

In Chrome, open `chrome://extensions`, enable **Developer mode**, and select
**Load unpacked** with `web/extension/dist`. Open the extension settings and
optionally change the website only if you use a self-hosted URLZ instance (the
extension defaults to `https://urlz.qzz.io`). Then open the extension on any page,
edit the destination if needed, and choose **Review & create link**. URLZ opens
in a new tab to review and confirm the destination before creation. Sign in
there first if asked.

Deploy the updated URLZ website before using this handoff. Older website builds
do not process extension requests and cannot create the link.

The extension uses `activeTab` rather than broad site access and never stores
account passwords or session tokens. The website URL setting is kept in
extension-local storage.

## CI/CD

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
