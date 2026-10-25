import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

const WINDOW_SECONDS = 15 * 60;
const AUTH_LIMITS: Record<string, number> = {
    "/api/v1/auth/login": 100,
    "/api/v1/auth/register": 5,
    "/api/v1/auth/refresh": 10,
};

function clientAddress(request: Request): string {
    return (
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown"
    );
}

export const authRateLimitMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    const limit = AUTH_LIMITS[new URL(c.req.url).pathname];

    if (!limit) {
        await next();
        return;
    }

    if (!c.env.KV) {
        return c.json({ error: "Rate limiting unavailable" }, 503);
    }

    const key = `rate-limit:auth:${new URL(c.req.url).pathname}:${clientAddress(c.req.raw)}`;
    const current = Number((await c.env.KV.get(key)) ?? "0");

    if (current >= limit) {
        c.header("Retry-After", String(WINDOW_SECONDS));
        return c.json({ error: "Too many authentication requests" }, 429);
    }

    await c.env.KV.put(key, String(current + 1), {
        expirationTtl: WINDOW_SECONDS,
    });
    await next();
});
