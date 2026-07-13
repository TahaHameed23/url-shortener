import { createMiddleware } from "hono/factory";
export const validateUrl = createMiddleware(async (c, next) => {
    if (c.req.method !== "POST") {
        await next();
        return;
    }

    try {
        const body = await c.req.json<{ longUrl?: unknown }>();

        if (typeof body.longUrl !== "string" || !isValidUrl(body.longUrl)) {
            return c.json({ error: "Invalid longUrl" }, 400);
        }

        c.set("body", body);
        await next();
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
});

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}
