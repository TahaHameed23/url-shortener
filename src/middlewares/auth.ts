import { createMiddleware } from "hono/factory";
import { verifyAuthToken } from "../services/auth.service";
import { ACCESS_COOKIE_NAME, getCookie } from "../services/auth-cookie";

export const authMiddleware = createMiddleware(async (c, next) => {
    const path = new URL(c.req.url).pathname;

    if (
        path === "/api/v1/auth/login" ||
        path === "/api/v1/auth/register" ||
        path === "/api/v1/auth/refresh"
    ) {
        await next();
        return;
    }

    const token = getCookie(c.req.raw, ACCESS_COOKIE_NAME);

    if (!token) {
        return c.json({ error: "Missing access token" }, 401);
    }
    const secret = c.env.AUTH_SECRET;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    const auth = verifyAuthToken(token, secret);

    if (!auth) {
        return c.json(
            { error: "Invalid or expired access token" },
            401,
        );
    }

    c.set("auth", auth);
    await next();
});
