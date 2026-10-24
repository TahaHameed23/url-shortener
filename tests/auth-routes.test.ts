import assert from "node:assert/strict";
import { test } from "node:test";
import app from "../src/index";

function testBindings(insertError?: Error): CloudflareBindings {
    const kv = {
        async get() {
            return null;
        },
        async put() {},
    };
    const db = {
        prepare(query: string) {
            return {
                bind() {
                    return this;
                },
                async first() {
                    return null;
                },
                async all() {
                    return { results: [] };
                },
                async run() {
                    if (query.startsWith("INSERT INTO users") && insertError) {
                        throw insertError;
                    }
                    return { meta: { changes: 1 } };
                },
            };
        },
    };

    return {
        DB: db,
        KV: kv,
        AUTH_SECRET: "test-secret",
    } as unknown as CloudflareBindings;
}

function registerRequest(body: string): Request {
    return new Request("https://urlz.example/api/v1/auth/register", {
        method: "POST",
        headers: {
            origin: "https://urlz.example",
            "content-type": "application/json",
        },
        body,
    });
}

test("returns 400 for malformed registration JSON with a request ID", async () => {
    const response = await app.fetch(
        registerRequest("{invalid"),
        testBindings(),
    );

    assert.equal(response.status, 400);
    assert.ok(response.headers.get("x-request-id"));
    assert.deepEqual(await response.json(), { error: "Invalid JSON body" });
});

test("returns 409 for a concurrent unique email conflict", async () => {
    const response = await app.fetch(
        registerRequest(
            JSON.stringify({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
            }),
        ),
        testBindings(new Error("D1_ERROR: UNIQUE constraint failed: users.email")),
    );

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { error: "User already exists" });
});
