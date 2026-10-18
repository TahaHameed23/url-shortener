import assert from "node:assert/strict";
import { describe, test } from "node:test";
import crypto from "node:crypto";
import app from "../src/index";
import {
    createAuthToken,
    rotateTokenPair,
    verifyAuthToken,
} from "../src/services/auth.service";

const SECRET = "test-secret";

function encode(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function tokenWithClaims(claims: Record<string, unknown>, secret = SECRET): string {
    const header = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode(claims);
    const signature = crypto
        .createHmac("sha256", secret)
        .update(`${header}.${payload}`)
        .digest("base64url");
    return `${header}.${payload}.${signature}`;
}

function validClaims(overrides: Record<string, unknown> = {}) {
    const now = Math.floor(Date.now() / 1000);
    return {
        typ: "access",
        userId: "user-1",
        email: "user@example.com",
        iat: now,
        exp: now + 900,
        iss: "urlz",
        aud: "urlz-web",
        ...overrides,
    };
}

describe("access token validation", () => {
    test("rejects an expired access token", () => {
        assert.equal(
            verifyAuthToken(tokenWithClaims(validClaims({ exp: 1 })), SECRET),
            null,
        );
    });

    test("rejects an invalid signature", () => {
        assert.equal(
            verifyAuthToken(tokenWithClaims(validClaims(), "different-secret"), SECRET),
            null,
        );
    });

    test("rejects the wrong issuer", () => {
        assert.equal(
            verifyAuthToken(tokenWithClaims(validClaims({ iss: "other-service" })), SECRET),
            null,
        );
    });

    test("rejects the wrong audience", () => {
        assert.equal(
            verifyAuthToken(tokenWithClaims(validClaims({ aud: "other-client" })), SECRET),
            null,
        );
    });

    test("includes the configured issuer and audience", () => {
        const token = createAuthToken(
            { id: "user-1", email: "user@example.com" },
            SECRET,
        );
        assert.deepEqual(verifyAuthToken(token, SECRET), {
            typ: "access",
            userId: "user-1",
            email: "user@example.com",
            iat: (verifyAuthToken(token, SECRET) as { iat: number }).iat,
            exp: (verifyAuthToken(token, SECRET) as { exp: number }).exp,
            iss: "urlz",
            aud: "urlz-web",
        });
    });
});

test("concurrent refresh requests can rotate a token only once", async () => {
    let revoked = false;
    const db = {
        prepare(query: string) {
            return {
                bind() {
                    return this;
                },
                async first<T>() {
                    if (query.includes("SELECT user_id")) {
                        return revoked ? null : ({ user_id: "user-1" } as T);
                    }
                    if (query.includes("SELECT id, email")) {
                        return { id: "user-1", email: "user@example.com" } as T;
                    }
                    return null;
                },
                async run() {
                    if (query.startsWith("UPDATE refresh_tokens SET revoked_at")) {
                        if (revoked) {
                            return { meta: { changes: 0 } };
                        }
                        revoked = true;
                        return { meta: { changes: 1 } };
                    }
                    return { meta: { changes: 1 } };
                },
            };
        },
    };

    const results = await Promise.all([
        rotateTokenPair(db, "refresh-token", SECRET),
        rotateTokenPair(db, "refresh-token", SECRET),
    ]);

    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(results.filter((result) => result === null).length, 1);
});

test("rejects a cross-origin API request", async () => {
    const response = await app.fetch(
        new Request("https://urlz.example/api/v1/auth/login", {
            method: "POST",
            headers: {
                origin: "https://attacker.example",
                "content-type": "application/json",
            },
            body: JSON.stringify({ email: "user@example.com", password: "password" }),
        }),
        {} as CloudflareBindings,
    );

    assert.equal(response.status, 401);
});
