export const AUTH_COOKIE_NAME = "urlz_auth";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function cookieAttributes(requestUrl: string): string {
    const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
    return `Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`;
}

export function createAuthCookie(requestUrl: string, token: string): string {
    return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieAttributes(requestUrl)}`;
}

export function clearAuthCookie(requestUrl: string): string {
    return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
        new URL(requestUrl).protocol === "https:" ? "; Secure" : ""
    }`;
}

export function getAuthCookie(request: Request): string | null {
    const cookies = request.headers.get("cookie");

    if (!cookies) {
        return null;
    }

    for (const cookie of cookies.split(";")) {
        const [name, ...valueParts] = cookie.trim().split("=");

        if (name === AUTH_COOKIE_NAME) {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}
