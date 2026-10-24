import assert from "node:assert/strict";
import { test } from "node:test";
import {
    ACCESS_COOKIE_NAME,
    clearAuthCookies,
    createAuthCookies,
    REFRESH_COOKIE_NAME,
} from "../src/services/auth-cookie";

test("scopes the refresh cookie to authentication endpoints", () => {
    const cookies = createAuthCookies(
        "https://urlz.example/api/v1/auth/login",
        "access-token",
        "refresh-token",
    );

    assert.match(
        cookies.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE_NAME}=`))!,
        /Path=\/api\/v1\/auth\/;/,
    );
    assert.match(
        cookies.find((cookie) => cookie.startsWith(`${ACCESS_COOKIE_NAME}=`))!,
        /Path=\/;/,
    );
});

test("clears the refresh cookie using its scoped path", () => {
    const cookies = clearAuthCookies("https://urlz.example/api/v1/auth/logout");
    const refreshCookie = cookies.find((cookie) =>
        cookie.startsWith(`${REFRESH_COOKIE_NAME}=`),
    );

    assert.ok(refreshCookie);
    assert.match(refreshCookie, /Path=\/api\/v1\/auth\/;/);
    assert.match(refreshCookie, /Max-Age=0/);
});
