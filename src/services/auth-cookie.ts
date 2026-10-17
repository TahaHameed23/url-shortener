export const ACCESS_COOKIE_NAME = "urlz_access";
export const REFRESH_COOKIE_NAME = "urlz_refresh";
const ACCESS_COOKIE_MAX_AGE = 60 * 15;
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function createCookie(
    requestUrl: string,
    name: string,
    token: string,
    maxAge: number,
): string {
    return `${name}=${encodeURIComponent(token)}; ${cookieAttributes(requestUrl, maxAge)}`;
}

function cookieAttributes(requestUrl: string, maxAge: number): string {
    const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
    return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
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
        ),
        createCookie(
            requestUrl,
            REFRESH_COOKIE_NAME,
            refreshToken,
            REFRESH_COOKIE_MAX_AGE,
        ),
    ];
}

export function clearAuthCookies(requestUrl: string): string[] {
    const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
    return [
        `${ACCESS_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
        `${REFRESH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
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
