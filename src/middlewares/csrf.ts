import { createMiddleware } from "hono/factory";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sameOrigin(requestUrl: string, value: string): boolean {
    try {
        return new URL(value).origin === new URL(requestUrl).origin;
    } catch {
        return false;
    }
}

export const csrfMiddleware = createMiddleware(async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) {
        await next();
        return;
    }

    const origin = c.req.header("origin");
    const referer = c.req.header("referer");
    const requestUrl = c.req.url;

    if (origin && !sameOrigin(requestUrl, origin)) {
        return c.json({ error: "Cross-origin request blocked" }, 403);
    }

    if (!origin && referer && !sameOrigin(requestUrl, referer)) {
        return c.json({ error: "Cross-origin request blocked" }, 403);
    }

    if (!origin && !referer) {
        return c.json({ error: "Missing request origin" }, 403);
    }

    await next();
});
