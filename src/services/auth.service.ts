import crypto from "node:crypto";
import type { D1DatabaseLike } from "../d1/db";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
type UserRow = {
    id: string;
    email: string;
    password_hash: string | null;
};

export type AuthClaims = {
    typ: "access";
    userId: string;
    email: string;
    exp: number;
    iat: number;
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
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payloadText = JSON.stringify(payload);
    const encodedPayload = base64UrlEncode(payloadText);
    const signature = crypto
        .createHmac("sha256", secret)
        .update(`${header}.${encodedPayload}`)
        .digest("base64url");

    return `${header}.${encodedPayload}.${signature}`;
}

export function verifyAuthToken(
    token: string,
    secret: string,
): AuthClaims | null {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
        return null;
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();

    const actualSignature = Buffer.from(signature, "base64url");

    if (
        expectedSignature.length !== actualSignature.length ||
        !crypto.timingSafeEqual(expectedSignature, actualSignature)
    ) {
        return null;
    }

    try {
        const header = JSON.parse(base64UrlDecode(encodedHeader)) as {
            alg?: string;
            typ?: string;
        };
        const payload = JSON.parse(
            base64UrlDecode(encodedPayload),
        ) as AuthClaims;

        if (
            header.alg !== "HS256" ||
            header.typ !== "JWT" ||
            payload.typ !== "access" ||
            typeof payload.userId !== "string" ||
            typeof payload.email !== "string" ||
            typeof payload.exp !== "number" ||
            typeof payload.iat !== "number" ||
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
        typ: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
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

export async function deleteUserById(
    db: D1DatabaseLike,
    userId: string,
): Promise<void> {
    await db
        .prepare("DELETE FROM users WHERE id = ?")
        .bind(userId)
        .run();
}

export function createAuthToken(
    user: { id: string; email: string },
    secret: string,
): string {
    return issueToken(user, secret);
}

function hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

async function ensureRefreshTokenSchema(db: D1DatabaseLike): Promise<void> {
    await db
        .prepare(
            `CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at DATETIME NOT NULL,
                revoked_at DATETIME
            )`,
        )
        .run();
    await db
        .prepare(
            "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)",
        )
        .run();
    await db
        .prepare(
            "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens(expires_at)",
        )
        .run();
}

export async function createTokenPair(
    db: D1DatabaseLike,
    user: { id: string; email: string },
    secret: string,
): Promise<{ accessToken: string; refreshToken: string }> {
    await ensureRefreshTokenSchema(db);
    const refreshToken = crypto.randomBytes(32).toString("base64url");
    await db
        .prepare(
            "INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))",
        )
        .bind(hashRefreshToken(refreshToken), user.id)
        .run();

    return {
        accessToken: createAuthToken(user, secret),
        refreshToken,
    };
}

export async function rotateTokenPair(
    db: D1DatabaseLike,
    refreshToken: string,
    secret: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokenHash = hashRefreshToken(refreshToken);
    const row = await db
        .prepare(
            "SELECT user_id FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now') LIMIT 1",
        )
        .bind(tokenHash)
        .first<{ user_id: string }>();

    if (!row) {
        return null;
    }

    const user = await findUserById(db, row.user_id);
    if (!user) {
        return null;
    }

    await db
        .prepare(
            "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token_hash = ?",
        )
        .bind(tokenHash)
        .run();

    return createTokenPair(db, { id: user.id, email: user.email }, secret);
}

export async function revokeRefreshToken(
    db: D1DatabaseLike,
    refreshToken: string,
): Promise<void> {
    await db
        .prepare(
            "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token_hash = ?",
        )
        .bind(hashRefreshToken(refreshToken))
        .run();
}
