import { Hono } from "hono";
import type { Context } from "hono";
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
import { logServerError } from "../services/error-logging";
import { loginRequestSchema, registerRequestSchema } from "../schemas/auth";
import { parseJsonBody } from "../middlewares/validate";
import type { AppEnv } from "../types";

const authRouter = new Hono<AppEnv>();

function isDuplicateEmailError(error: unknown): boolean {
    return (
        error instanceof Error &&
        /UNIQUE constraint failed:\s*users\.email/i.test(error.message)
    );
}

function logAuthFailure(
    c: Context<AppEnv>,
    event: string,
    error: unknown,
): void {
    logServerError(event, error, {
        requestId: c.res.headers.get("X-Request-ID") ?? undefined,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
    });
}

authRouter.use("/auth/register", secureAuthMiddleware);
authRouter.use("/auth/login", secureAuthMiddleware);
authRouter.use("/auth/refresh", secureAuthMiddleware);
authRouter.use("/auth/logout", secureAuthMiddleware);

authRouter.post("/auth/register", async (c) => {
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
        const parsed = await parseJsonBody(c, registerRequestSchema);
        if (!parsed.success) {
            return c.json(
                {
                    error:
                        parsed.reason === "invalid_json"
                            ? "Invalid JSON body"
                            : "Invalid email or password",
                },
                400,
            );
        }
        const { name, email, password } = parsed.data;

        const { user } = await registerUser(db, name, email, password);
        createdUserId = user.id;
        const tokens = await createTokenPair(db, user, secret);
        for (const cookie of createAuthCookies(
            c.req.url,
            tokens.accessToken,
            tokens.refreshToken,
        )) {
            c.header("Set-Cookie", cookie, { append: true });
        }

        return c.json(
            {
                user,
            },
            201,
        );
    } catch (error) {
        if (isDuplicateEmailError(error)) {
            return c.json({ error: "User already exists" }, 409);
        }

        if (createdUserId) {
            try {
                await deleteUserById(db, createdUserId);
            } catch (cleanupError) {
                logAuthFailure(c, "auth.register.rollback_failed", cleanupError);
            }
        }
        logAuthFailure(c, "auth.register.failed", error);
        return c.json({ error: "Failed to register user" }, 500);
    }
});

authRouter.post("/auth/login", async (c) => {
    const db = c.env.DB;
    const secret = c.env.AUTH_SECRET;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    try {
        const parsed = await parseJsonBody(c, loginRequestSchema);
        if (!parsed.success) {
            return c.json(
                {
                    error:
                        parsed.reason === "invalid_json"
                            ? "Invalid JSON body"
                            : "Invalid email or password",
                },
                400,
            );
        }

        const user = await loginUser(db, parsed.data.email, parsed.data.password);

        if (!user) {
            return c.json({ error: "Invalid credentials" }, 401);
        }

        const tokens = await createTokenPair(db, user, secret);
        for (const cookie of createAuthCookies(
            c.req.url,
            tokens.accessToken,
            tokens.refreshToken,
        )) {
            c.header("Set-Cookie", cookie, { append: true });
        }

        return c.json({ user }, 200);
    } catch (error) {
        logAuthFailure(c, "auth.login.failed", error);
        return c.json({ error: "Failed to login user" }, 500);
    }
});

authRouter.post("/auth/logout", async (c) => {
    const refreshToken = getCookie(c.req.raw, REFRESH_COOKIE_NAME);
    if (refreshToken && c.env.DB) {
        await revokeRefreshToken(c.env.DB, refreshToken);
    }
    for (const cookie of clearAuthCookies(c.req.url)) {
        c.header("Set-Cookie", cookie, { append: true });
    }
    return c.json({ ok: true }, 200);
});

authRouter.post("/auth/refresh", async (c) => {
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

    for (const cookie of createAuthCookies(
        c.req.url,
        tokens.accessToken,
        tokens.refreshToken,
    )) {
        c.header("Set-Cookie", cookie, { append: true });
    }
    return c.json({ ok: true }, 200);
});

authRouter.get("/auth/me", authMiddleware, async (c) => {
    const auth = c.get("auth");
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
