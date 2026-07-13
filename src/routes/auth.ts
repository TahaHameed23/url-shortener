import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth";
import {
    createAuthToken,
    getUserById,
    loginUser,
    registerUser,
} from "../services/auth.service";

const authRouter = new Hono<{ Bindings: CloudflareBindings }>();

authRouter.post("/auth/register", async (c: any) => {
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
        const token = createAuthToken(user, secret);

        return c.json(
            {
                user,
                tokenType: "Bearer",
                accessToken: token,
            },
            201,
        );
    } catch {
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

        const token = createAuthToken(user, secret);

        return c.json({ user, tokenType: "Bearer", accessToken: token }, 200);
    } catch {
        return c.json({ error: "Failed to login user" }, 500);
    }
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
