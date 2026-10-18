import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth";
import {
    createTokenPair,
    deleteUserById,
    getUserById,
    loginUser,
    registerUser,
    revokeRefreshToken,
    rotateTokenPair,
} from "../services/auth.service";
import {
    clearAuthCookies,
    createAuthCookies,
    REFRESH_COOKIE_NAME,
    getCookie,
} from "../services/auth-cookie";
import { secureAuthMiddleware } from "../middlewares/secure-auth";

const authRouter = new Hono<{ Bindings: CloudflareBindings }>();

authRouter.use("/auth/register", secureAuthMiddleware);
authRouter.use("/auth/login", secureAuthMiddleware);
authRouter.use("/auth/refresh", secureAuthMiddleware);

authRouter.post("/auth/register", async (c: any) => {
    const db = c.env.DB;
    const secret = c.env.AUTH_SECRET;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    let createdUserId: string | undefined;
    try {
        const body = (await c.req.json()) as {
            email?: unknown;
            password?: unknown;
        };

        if (
            typeof body.email !== "string" ||
            typeof body.password !== "string"
        ) {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        const email = body.email.trim().toLowerCase();

        if (!email || !email.includes("@") || body.password.length < 8) {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        const existingUser = await db
            .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
            .bind(email)
            .first();

        if (existingUser) {
            return c.json({ error: "User already exists" }, 409);
        }

        const { user } = await registerUser(db, email, body.password);
        createdUserId = user.id;
        const tokens = await createTokenPair(db, user, secret);
        for (const cookie of createAuthCookies(c.req.url, tokens.accessToken, tokens.refreshToken)) {
            c.header("Set-Cookie", cookie, { append: true });
        }

        return c.json(
            {
                user,
            },
            201,
        );
    } catch {
        if (createdUserId) {
            await deleteUserById(db, createdUserId);
        }
        return c.json({ error: "Failed to register user" }, 500);
    }
});

authRouter.post("/auth/login", async (c: any) => {
    const db = c.env.DB;
    const secret = c.env.AUTH_SECRET;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    try {
        const body = (await c.req.json()) as {
            email?: unknown;
            password?: unknown;
        };

        if (
            typeof body.email !== "string" ||
            typeof body.password !== "string"
        ) {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        const user = await loginUser(db, body.email, body.password);

        if (!user) {
            return c.json({ error: "Invalid credentials" }, 401);
        }

        const tokens = await createTokenPair(db, user, secret);
        for (const cookie of createAuthCookies(c.req.url, tokens.accessToken, tokens.refreshToken)) {
            c.header("Set-Cookie", cookie, { append: true });
        }

        return c.json({ user }, 200);
    } catch {
        return c.json({ error: "Failed to login user" }, 500);
    }
});

authRouter.post("/auth/logout", async (c: any) => {
    const refreshToken = getCookie(c.req.raw, REFRESH_COOKIE_NAME);
    if (refreshToken && c.env.DB) {
        await revokeRefreshToken(c.env.DB, refreshToken);
    }
    for (const cookie of clearAuthCookies(c.req.url)) {
        c.header("Set-Cookie", cookie, { append: true });
    }
    return c.json({ ok: true }, 200);
});

authRouter.post("/auth/refresh", async (c: any) => {
    const secret = c.env.AUTH_SECRET;
    const db = c.env.DB;
    const refreshToken = getCookie(c.req.raw, REFRESH_COOKIE_NAME);

    if (!secret || !db || !refreshToken) {
        return c.json({ error: "Invalid refresh token" }, 401);
    }

    const tokens = await rotateTokenPair(db, refreshToken, secret);
    if (!tokens) {
        return c.json({ error: "Invalid or expired refresh token" }, 401);
    }

    for (const cookie of createAuthCookies(c.req.url, tokens.accessToken, tokens.refreshToken)) {
        c.header("Set-Cookie", cookie, { append: true });
    }
    return c.json({ ok: true }, 200);
});

authRouter.get("/auth/me", authMiddleware, async (c: any) => {
    const auth = c.get("auth") as
        | { userId?: string; email?: string }
        | undefined;
    const db = c.env.DB;

    if (!auth?.userId || !db) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await getUserById(db, auth.userId);

    if (!user) {
        return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user }, 200);
});

export default authRouter;
