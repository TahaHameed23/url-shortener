import { createMiddleware } from "hono/factory";
import { verifyAuthToken } from "../services/auth.service";

export const authMiddleware = createMiddleware(async (c, next) => {
    const path = new URL(c.req.url).pathname;

    if (path === "/api/v1/auth/login" || path === "/api/v1/auth/register") {
        await next();
        return;
    }

    const authorization = c.req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return c.json({ error: "Missing bearer token" }, 401);
    }

    const token = authorization.slice("Bearer ".length).trim();
    const secret = c.env.AUTH_SECRET;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    const auth = verifyAuthToken(token, secret);

    if (!auth) {
        return c.json({ error: "Invalid or expired bearer token" }, 401);
    }

    c.set("auth", auth);
    await next();
});
