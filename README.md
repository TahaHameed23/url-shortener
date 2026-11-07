```txt
npm install
npm run dev
```

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

```txt
bun test
bun run typecheck
bun run test:unit
bun run test:integration
```

```txt
npm run deploy
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

Use a feature branch for each change and open a pull request against `main`.
GitHub Actions runs the type check, tests, and web build, then creates or
updates a Cloudflare Preview for that pull request and smoke-tests its URL.
Merge the pull request to `main` to deploy production; direct pushes to `main`
also deploy after the checks pass.

Add these GitHub Actions repository secrets before enabling deployments:

- `CLOUDFLARE_API_TOKEN`: scoped to Workers Scripts edit and the D1/KV
  resources configured for the Worker.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account containing the Worker.
- `PREVIEW_AUTH_SECRET`: a preview-only value for the Preview deployment.

The production `AUTH_SECRET` should already be configured as a secret on the
Cloudflare Worker. Do not put it in GitHub or in the Wrangler config. PR
Previews are publicly accessible and share the configured preview D1/KV
resources with one another; keep preview data separate from production data.
Forked pull requests still run checks but do not receive a deployment because
GitHub does not expose repository secrets to them.

Protect `main` in GitHub and require the `checks` job before merging so
production changes go through a reviewed pull request.

Apply D1 migrations to the local database used by `wrangler dev`:

```txt
npm run db:migrate:local
```

For the preview or production database, use the explicit target-specific
commands:

```txt
npm run db:migrate:preview
npm run db:migrate:remote
```

Create a new migration with Wrangler, then apply it to each intended
environment:

```txt
bunx wrangler d1 migrations create urlz <migration-name>
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
