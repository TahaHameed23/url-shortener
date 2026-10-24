export const ACCESS_COOKIE_NAME = "urlz_access";
export const REFRESH_COOKIE_NAME = "urlz_refresh";
const ACCESS_COOKIE_MAX_AGE = 60 * 15;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const ACCESS_COOKIE_PATH = "/";
const REFRESH_COOKIE_PATH = "/api/v1/auth/";

function createCookie(
    requestUrl: string,
    name: string,
    token: string,
    maxAge: number,
    path: string,
): string {
    return `${name}=${encodeURIComponent(token)}; ${cookieAttributes(requestUrl, maxAge, path)}`;
}

function cookieAttributes(requestUrl: string, maxAge: number, path: string): string {
    const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
    return `Path=${path}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export function createAuthCookies(
    requestUrl: string,
    accessToken: string,
    refreshToken: string,
): string[] {
    return [
        createCookie(
            requestUrl,
            ACCESS_COOKIE_NAME,
            accessToken,
            ACCESS_COOKIE_MAX_AGE,
            ACCESS_COOKIE_PATH,
        ),
        createCookie(
            requestUrl,
            REFRESH_COOKIE_NAME,
            refreshToken,
            REFRESH_COOKIE_MAX_AGE,
            REFRESH_COOKIE_PATH,
        ),
    ];
}

export function clearAuthCookies(requestUrl: string): string[] {
    const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
    return [
        `${ACCESS_COOKIE_NAME}=; Path=${ACCESS_COOKIE_PATH}; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
        `${REFRESH_COOKIE_NAME}=; Path=${REFRESH_COOKIE_PATH}; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
    ];
}

export function getCookie(request: Request, cookieName: string): string | null {
    const cookies = request.headers.get("cookie");

    if (!cookies) {
        return null;
    }

    for (const cookie of cookies.split(";")) {
        const [name, ...valueParts] = cookie.trim().split("=");

        if (name === cookieName) {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}
