import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Database } from "bun:sqlite";
import { test } from "node:test";
import app from "../src/index";
import { createAuthToken } from "../src/services/auth.service";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../src/services/auth-cookie";

const BASE_URL = "https://urlz.example";
const AUTH_SECRET = "integration-test-secret";

type LinkResponse = {
    id: string;
    slug: string;
    destinationUrl: string;
    clicks: number;
    createdAt: string;
};

class SqliteD1Adapter {
    constructor(private readonly database: Database) {}

    prepare(query: string) {
        let values: unknown[] = [];
        const statement = this.database.query(query);

        return {
            bind(...boundValues: unknown[]) {
                values = boundValues;
                return this;
            },
            async first<T>() {
                return (statement.get(...values) as T | null) ?? null;
            },
            async all<T>() {
                return { results: statement.all(...values) as T[] };
            },
            async run() {
                const result = statement.run(...values);
                return { meta: { changes: result.changes } };
            },
        };
    }
}

function createHarness() {
    const database = new Database(":memory:");
    database.exec("PRAGMA foreign_keys = ON;");
    for (const migration of [
        "0001_initial_schema.sql",
        "0002_add_user_name.sql",
        "0003_unique_user_email.sql",
    ]) {
        database.exec(
            readFileSync(new URL(`../migrations/${migration}`, import.meta.url), "utf8"),
        );
    }

    const values = new Map<string, string>();
    const kv = {
        async get<T>(key: string, type?: string): Promise<T | null> {
            const value = values.get(key);
            if (value === undefined) {
                return null;
            }
            return (type === "json" ? JSON.parse(value) : value) as T;
        },
        async put(key: string, value: string) {
            values.set(key, value);
        },
        async delete(key: string) {
            values.delete(key);
        },
    };
    const bindings = {
        DB: new SqliteD1Adapter(database),
        KV: kv,
        AUTH_SECRET,
        KV_CACHE_ENABLED: "true",
    } as unknown as CloudflareBindings;

    return {
        fetch(request: Request) {
            return app.fetch(request, bindings);
        },
        close() {
            database.close();
        },
    };
}

function apiRequest(
    path: string,
    options: {
        method?: string;
        body?: string;
        cookie?: string;
        origin?: string;
        redirect?: RequestRedirect;
    } = {},
): Request {
    const headers = new Headers();
    if (options.origin !== undefined) {
        headers.set("origin", options.origin);
    } else {
        headers.set("origin", BASE_URL);
    }
    if (options.body !== undefined) {
        headers.set("content-type", "application/json");
    }
    if (options.cookie) {
        headers.set("cookie", options.cookie);
    }

    return new Request(`${BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body,
        redirect: options.redirect,
    });
}

function cookieValue(response: Response, name: string): string {
    const setCookie = response.headers.get("set-cookie") ?? "";
    const value = setCookie.match(new RegExp(`(?:^|[, ])${name}=([^;,]+)`))?.[1];
    assert.ok(value, `${name} cookie should be set`);
    return decodeURIComponent(value);
}

async function register(harness: ReturnType<typeof createHarness>) {
    const response = await harness.fetch(
        apiRequest("/api/v1/auth/register", {
            method: "POST",
            body: JSON.stringify({
                name: "  Test User ",
                email: " TEST@EXAMPLE.COM ",
                password: "password123",
            }),
        }),
    );

    assert.equal(response.status, 201);
    const { user } = (await response.json()) as {
        user: { id: string; name: string; email: string };
    };
    return {
        response,
        user,
        accessToken: cookieValue(response, ACCESS_COOKIE_NAME),
        refreshToken: cookieValue(response, REFRESH_COOKIE_NAME),
    };
}

test("auth API supports registration, authenticated identity, login, refresh, and logout", async () => {
    const harness = createHarness();
    try {
        const registered = await register(harness);
        assert.ok(registered.user.id);
        assert.deepEqual(registered.user, {
            id: registered.user.id,
            name: "Test User",
            email: "test@example.com",
        });
        assert.ok(registered.response.headers.get("x-request-id"));
        assert.match(
            registered.response.headers.get("set-cookie") ?? "",
            /HttpOnly/,
        );

        const missingAuth = await harness.fetch(apiRequest("/api/v1/auth/me"));
        assert.equal(missingAuth.status, 401);

        const me = await harness.fetch(
            apiRequest("/api/v1/auth/me", {
                cookie: `${ACCESS_COOKIE_NAME}=${registered.accessToken}`,
            }),
        );
        assert.equal(me.status, 200);
        assert.deepEqual(
            ((await me.json()) as { user: typeof registered.user }).user,
            registered.user,
        );

        const invalidLogin = await harness.fetch(
            apiRequest("/api/v1/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "wrong-password",
                }),
            }),
        );
        assert.equal(invalidLogin.status, 401);

        const login = await harness.fetch(
            apiRequest("/api/v1/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: "TEST@example.com",
                    password: "password123",
                }),
            }),
        );
        assert.equal(login.status, 200);
        const loginRefreshToken = cookieValue(login, REFRESH_COOKIE_NAME);

        const refreshed = await harness.fetch(
            apiRequest("/api/v1/auth/refresh", {
                method: "POST",
                cookie: `${REFRESH_COOKIE_NAME}=${loginRefreshToken}`,
            }),
        );
        assert.equal(refreshed.status, 200);
        const rotatedRefreshToken = cookieValue(refreshed, REFRESH_COOKIE_NAME);
        assert.notEqual(rotatedRefreshToken, loginRefreshToken);

        const reusedRefreshToken = await harness.fetch(
            apiRequest("/api/v1/auth/refresh", {
                method: "POST",
                cookie: `${REFRESH_COOKIE_NAME}=${loginRefreshToken}`,
            }),
        );
        assert.equal(reusedRefreshToken.status, 401);

        const logout = await harness.fetch(
            apiRequest("/api/v1/auth/logout", {
                method: "POST",
                cookie: `${REFRESH_COOKIE_NAME}=${rotatedRefreshToken}`,
            }),
        );
        assert.equal(logout.status, 200);
        assert.deepEqual(await logout.json(), { ok: true });
        assert.match(
            logout.headers.get("set-cookie") ?? "",
            new RegExp(`${REFRESH_COOKIE_NAME}=;[^,]*Max-Age=0`),
        );

        const loggedOutRefresh = await harness.fetch(
            apiRequest("/api/v1/auth/refresh", {
                method: "POST",
                cookie: `${REFRESH_COOKIE_NAME}=${rotatedRefreshToken}`,
            }),
        );
        assert.equal(loggedOutRefresh.status, 401);
    } finally {
        harness.close();
    }
});

test("link API validates, creates, lists, isolates, redirects, and deletes links", async () => {
    const harness = createHarness();
    try {
        const { accessToken } = await register(harness);
        const ownerCookie = `${ACCESS_COOKIE_NAME}=${accessToken}`;

        const invalidUrl = await harness.fetch(
            apiRequest("/api/v1/links", {
                method: "POST",
                cookie: ownerCookie,
                body: JSON.stringify({ destinationUrl: "javascript:alert(1)" }),
            }),
        );
        assert.equal(invalidUrl.status, 400);

        const unauthenticatedList = await harness.fetch(
            apiRequest("/api/v1/links"),
        );
        assert.equal(unauthenticatedList.status, 401);

        const created = await harness.fetch(
            apiRequest("/api/v1/links", {
                method: "POST",
                cookie: ownerCookie,
                body: JSON.stringify({
                    destinationUrl: "https://example.org/articles/1",
                }),
            }),
        );
        assert.equal(created.status, 201);
        const link = (await created.json()) as LinkResponse;
        assert.equal(link.destinationUrl, "https://example.org/articles/1");
        assert.equal(link.clicks, 0);
        assert.equal("createdBy" in link, false);
        assert.ok(link.slug);

        const list = await harness.fetch(
            apiRequest("/api/v1/links", { cookie: ownerCookie }),
        );
        assert.equal(list.status, 200);
        const listed = (await list.json()) as {
            links: LinkResponse[];
            total: number;
            nextCursor: string | null;
        };
        assert.equal(listed.total, 1);
        assert.equal(listed.links.length, 1);
        assert.equal(listed.links[0].slug, link.slug);
        assert.equal(listed.nextCursor, null);

        const otherUserToken = createAuthToken(
            { id: "another-user", email: "another@example.com" },
            AUTH_SECRET,
        );
        const otherUserCookie = `${ACCESS_COOKIE_NAME}=${otherUserToken}`;
        const hiddenLink = await harness.fetch(
            apiRequest(`/api/v1/links/${link.slug}`, {
                cookie: otherUserCookie,
            }),
        );
        assert.equal(hiddenLink.status, 404);

        const redirect = await harness.fetch(
            apiRequest(`/l/${link.slug}`, { redirect: "manual" }),
        );
        assert.equal(redirect.status, 302);
        assert.equal(redirect.headers.get("location"), "https://example.org/articles/1");

        const ownedLink = await harness.fetch(
            apiRequest(`/api/v1/links/${link.slug}`, {
                cookie: ownerCookie,
            }),
        );
        assert.equal(ownedLink.status, 200);
        assert.equal(
            ((await ownedLink.json()) as LinkResponse).clicks,
            1,
        );

        const forbiddenDelete = await harness.fetch(
            apiRequest(`/api/v1/links/${link.slug}`, {
                method: "DELETE",
                cookie: otherUserCookie,
            }),
        );
        assert.equal(forbiddenDelete.status, 404);

        const deleted = await harness.fetch(
            apiRequest(`/api/v1/links/${link.slug}`, {
                method: "DELETE",
                cookie: ownerCookie,
            }),
        );
        assert.equal(deleted.status, 200);
        assert.deepEqual(await deleted.json(), { ok: true });

        const missingLink = await harness.fetch(
            apiRequest(`/l/${link.slug}`),
        );
        assert.equal(missingLink.status, 404);
    } finally {
        harness.close();
    }
});

test("API enforces origin and HTTPS policies and returns request/security headers", async () => {
    const harness = createHarness();
    try {
        const crossOrigin = await harness.fetch(
            apiRequest("/api/v1/auth/login", {
                method: "POST",
                origin: "https://attacker.example",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "password123",
                }),
            }),
        );
        assert.equal(crossOrigin.status, 401);

        const missingOrigin = await harness.fetch(
            apiRequest("/api/v1/auth/login", {
                method: "POST",
                origin: "",
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "password123",
                }),
            }),
        );
        assert.equal(missingOrigin.status, 401);

        const insecureAuth = await harness.fetch(
            new Request("http://urlz.example/api/v1/auth/register", {
                method: "POST",
                headers: {
                    origin: "http://urlz.example",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    name: "Test User",
                    email: "test@example.com",
                    password: "password123",
                }),
            }),
        );
        assert.equal(insecureAuth.status, 426);
        assert.ok(insecureAuth.headers.get("x-request-id"));
        assert.equal(
            insecureAuth.headers.get("x-content-type-options"),
            "nosniff",
        );
        assert.equal(
            insecureAuth.headers.get("referrer-policy"),
            "same-origin",
        );

        for (let requestNumber = 0; requestNumber < 4; requestNumber += 1) {
            const malformedRegistration = await harness.fetch(
                apiRequest("/api/v1/auth/register", {
                    method: "POST",
                    body: "{invalid",
                }),
            );
            assert.equal(malformedRegistration.status, 400);
        }

        const rateLimited = await harness.fetch(
            apiRequest("/api/v1/auth/register", {
                method: "POST",
                body: "{invalid",
            }),
        );
        assert.equal(rateLimited.status, 429);
        assert.equal(rateLimited.headers.get("retry-after"), "900");
    } finally {
        harness.close();
    }
});
