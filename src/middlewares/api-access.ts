import { createMiddleware } from "hono/factory";

function sameOrigin(requestUrl: string, value: string): boolean {
    try {
        return new URL(value).origin === new URL(requestUrl).origin;
    } catch {
        return false;
    }
}

export function isTestRequest(c: any): boolean {
    const configuredKey = c.env.API_TEST_KEY as string | undefined;
    const suppliedKey = c.req.header("x-api-key");

    return Boolean(
        configuredKey && suppliedKey && suppliedKey === configuredKey,
    );
}

export const apiAccessMiddleware = createMiddleware(async (c, next) => {
    if (isTestRequest(c)) {
        await next();
        return;
    }

    const requestUrl = c.req.url;
    const origin = c.req.header("origin");
    const referer = c.req.header("referer");
    const fetchSite = c.req.header("sec-fetch-site");
    const fetchMode = c.req.header("sec-fetch-mode");
    const fetchDest = c.req.header("sec-fetch-dest");

    if (
        (origin && sameOrigin(requestUrl, origin)) ||
        (!origin &&
            referer &&
            sameOrigin(requestUrl, referer) &&
            fetchSite === "same-origin" &&
            (fetchMode === "cors" || fetchMode === "same-origin") &&
            (fetchDest === "empty" || fetchDest === "script"))
    ) {
        await next();
        return;
    }

    return c.text("Unauthorized", 401);
});
