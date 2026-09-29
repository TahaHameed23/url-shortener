import { createMiddleware } from "hono/factory";
import { getSafeExternalUrl } from "../services/safe-url";

export const validateUrl = createMiddleware(async (c, next) => {
    if (c.req.method !== "POST") {
        await next();
        return;
    }

    try {
        const body = await c.req.json<{ longUrl?: unknown }>();

        if (typeof body.longUrl !== "string") {
            return c.json({ error: "Invalid longUrl" }, 400);
        }

        const longUrl = getSafeExternalUrl(body.longUrl);
        if (!longUrl) {
            return c.json(
                { error: "longUrl must be an http or https URL" },
                400,
            );
        }

        c.set("body", { ...body, longUrl });
        await next();
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
});
