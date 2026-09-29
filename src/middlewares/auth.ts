import { createMiddleware } from "hono/factory";
import { verifyAuthToken } from "../services/auth.service";
import { getAuthCookie } from "../services/auth-cookie";

export const authMiddleware = createMiddleware(async (c, next) => {
    const path = new URL(c.req.url).pathname;

    if (path === "/api/v1/auth/login" || path === "/api/v1/auth/register") {
        await next();
        return;
    }

    const token = getAuthCookie(c.req.raw);

    if (!token) {
        return c.json({ error: "Missing authentication cookie" }, 401);
    }
    const secret = c.env.AUTH_SECRET;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    const auth = verifyAuthToken(token, secret);

    if (!auth) {
        return c.json(
            { error: "Invalid or expired authentication cookie" },
            401,
        );
    }

    c.set("auth", auth);
    await next();
});
