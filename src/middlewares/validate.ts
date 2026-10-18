import { createMiddleware } from "hono/factory";
import { getSafeExternalUrl } from "../services/safe-url";

export const validateUrl = createMiddleware(async (c, next) => {
    if (c.req.method !== "POST") {
        await next();
        return;
    }

    try {
        const body = await c.req.json<{ destinationUrl?: unknown }>();

        if (typeof body.destinationUrl !== "string") {
            return c.json({ error: "Invalid destinationUrl" }, 400);
        }

        const destinationUrl = getSafeExternalUrl(body.destinationUrl);

        if (!destinationUrl) {
            return c.json(
                { error: "destinationUrl must be an http or https URL" },
                400,
            );
        }

        c.set("body", { ...body, destinationUrl });
        await next();
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
});
