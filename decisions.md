# URLz project decisions

## Use cases

- A browser user registers or signs in and receives a session without exposing
  credentials or tokens to client-side JavaScript.
- An authenticated user creates short links and can inspect only links they
  created.
- Anyone can follow a short link through `/l/:slug`; redirects remain public so
  sharing a shortened URL works without authentication.
- A browser session can refresh its short-lived access token without requiring
  the user to sign in again.

## Design decisions

### JWT access tokens

Access tokens are signed HS256 JWTs with a 15-minute lifetime. They contain the
user id, email, issued-at time, expiry, explicit access-token type, `iss`
(`urlz`), and `aud` (`urlz-web`). The server validates the header, signature,
required claims, issuer, audience, and expiry before authorizing a request.

### Rotating refresh tokens

Refresh tokens are high-entropy opaque values, not JWTs. Only their SHA-256
hashes are stored in D1. A refresh token is single-use: refresh rotates it and
revokes the old database record. This supports server-side revocation and
limits the impact of a stolen refresh token.

### HttpOnly cookies

Both tokens are delivered as `HttpOnly`, `SameSite=Lax` cookies. The access
cookie is short-lived and the refresh cookie lasts 30 days. Cookies use
`Secure` in production HTTPS requests. Keeping tokens out of JavaScript
reduces exposure to token theft through client-side script.

### Password transport

The browser submits the password to the same-origin authentication endpoint
over HTTPS. This is the standard password-authentication boundary: TLS
encrypts the request in transit, while the server receives the password only
long enough to verify or hash it. Production authentication requests are
rejected over plain HTTP, and the client shows the same error before
submission. Client-side hashing was intentionally not added because a
client-side hash would become a reusable password-equivalent and would not
provide an additional authentication factor.

### Authentication secret configuration

`AUTH_SECRET` is the only supported secret name for signing and verifying
access tokens. It must be configured as a Cloudflare Worker secret, not as a
public `vars` value. Preview and production should use separate secret values.
Worker Preview deployments do not automatically inherit production secrets;
the preview deployment must receive `AUTH_SECRET` through Wrangler's preview
secret mechanism. The local `deploy:preview` script uploads the ignored
`.dev.vars` file for this purpose.

### Browser-only API boundary

API routes require a same-origin browser signal (`Origin`, or compatible
`Referer` and Fetch Metadata headers). Cross-origin and headerless scripted
requests are rejected before route handling; there is no API-key bypass.
Authentication endpoints are additionally rate-limited per client address in a
15-minute window.

### D1 schema

Links retain an optional `created_by` owner and authenticated link reads
enforce that ownership. Refresh sessions are kept in a separate
`refresh_tokens` table with expiry, revocation, and user indexes. Query
examples for active sessions and revocation live beside the schema in
`migrations/0001_initial_schema.sql`. D1 schema changes are applied with
Wrangler migrations rather than by executing SQL files manually.

### Public redirect

The redirect endpoint is deliberately outside the authenticated API. It
validates the destination before redirecting and increments click counts, so
short links remain useful when shared publicly.
