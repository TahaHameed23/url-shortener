import crypto from "node:crypto";
import type { D1DatabaseLike } from "../d1/db";

const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type UserRow = {
    id: string;
    email: string;
    password_hash: string | null;
};

export type AuthClaims = {
    userId: string;
    email: string;
    exp: number;
};

function base64UrlEncode(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
    return Buffer.from(value, "base64url").toString("utf8");
}

function hashPassword(
    password: string,
    salt = crypto.randomBytes(16).toString("hex"),
): string {
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");

    if (!salt || !hash) {
        return false;
    }

    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    const expected = Buffer.from(hash, "hex");
    const actual = Buffer.from(derivedKey, "hex");

    return (
        expected.length === actual.length &&
        crypto.timingSafeEqual(expected, actual)
    );
}

function signToken(payload: AuthClaims, secret: string): string {
    const payloadText = JSON.stringify(payload);
    const encodedPayload = base64UrlEncode(payloadText);
    const signature = crypto
        .createHmac("sha256", secret)
        .update(encodedPayload)
        .digest("base64url");

    return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(
    token: string,
    secret: string,
): AuthClaims | null {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
        return null;
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(encodedPayload)
        .digest();

    const actualSignature = Buffer.from(signature, "base64url");

    if (
        expectedSignature.length !== actualSignature.length ||
        !crypto.timingSafeEqual(expectedSignature, actualSignature)
    ) {
        return null;
    }

    try {
        const payload = JSON.parse(
            base64UrlDecode(encodedPayload),
        ) as AuthClaims;

        if (
            typeof payload.userId !== "string" ||
            typeof payload.email !== "string" ||
            typeof payload.exp !== "number" ||
            payload.exp <= Math.floor(Date.now() / 1000)
        ) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

function issueToken(
    user: { id: string; email: string },
    secret: string,
): string {
    const payload: AuthClaims = {
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + AUTH_TOKEN_TTL_SECONDS,
    };

    return signToken(payload, secret);
}

async function findUserByEmail(
    db: D1DatabaseLike,
    email: string,
): Promise<UserRow | null> {
    return db
        .prepare(
            "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
        )
        .bind(email)
        .first<UserRow>();
}

export async function isUserEmailTaken(
    db: D1DatabaseLike,
    email: string,
): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(db, normalizedEmail);
    return user !== null;
}

async function findUserById(
    db: D1DatabaseLike,
    userId: string,
): Promise<UserRow | null> {
    return db
        .prepare(
            "SELECT id, email, password_hash FROM users WHERE id = ? LIMIT 1",
        )
        .bind(userId)
        .first<UserRow>();
}

export async function registerUser(
    db: D1DatabaseLike,
    email: string,
    password: string,
): Promise<{ user: { id: string; email: string }; passwordHash: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);
    const userId = crypto.randomUUID();

    await db
        .prepare(
            "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
        )
        .bind(userId, normalizedEmail, passwordHash)
        .run();

    return {
        user: { id: userId, email: normalizedEmail },
        passwordHash,
    };
}

export async function loginUser(
    db: D1DatabaseLike,
    email: string,
    password: string,
): Promise<{ id: string; email: string } | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(db, normalizedEmail);

    if (!user?.password_hash || !verifyPassword(password, user.password_hash)) {
        return null;
    }

    return { id: user.id, email: user.email };
}

export async function getUserById(
    db: D1DatabaseLike,
    userId: string,
): Promise<{ id: string; email: string } | null> {
    const user = await findUserById(db, userId);

    if (!user) {
        return null;
    }

    return { id: user.id, email: user.email };
}

export function createAuthToken(
    user: { id: string; email: string },
    secret: string,
): string {
    return issueToken(user, secret);
}
