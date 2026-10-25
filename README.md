```txt
npm install
npm run dev
```

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
