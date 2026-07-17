import type { Context } from "hono";
import type { D1DatabaseLike } from "../d1/db";

type AuthRouteContext = Context<{ Bindings: CloudflareBindings }>;

type RawCredentials = {
    email?: unknown;
    password?: unknown;
};

export type Credentials = {
    email: string;
    password: string;
};

export function requireAuthDependencies(
    c: AuthRouteContext,
): { db: D1DatabaseLike; secret: string } | Response {
    const secret = c.env.AUTH_SECRET;
    const db = c.env.DB as D1DatabaseLike | undefined;

    if (!secret) {
        return c.json({ error: "Auth secret not configured" }, 500);
    }

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    return { db, secret };
}

export async function readCredentials(
    c: AuthRouteContext,
): Promise<Credentials | Response> {
    try {
        const body = (await c.req.json()) as RawCredentials;

        if (typeof body.email !== "string" || typeof body.password !== "string") {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        const email = body.email.trim().toLowerCase();
        const password = body.password;

        if (!email || !password) {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        return { email, password };
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
}

export function isRegistrationInputValid(credentials: Credentials): boolean {
    return credentials.email.includes("@") && credentials.password.length >= 8;
}
