import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

function sameOrigin(requestUrl: string, value: string): boolean {
    try {
        return new URL(value).origin === new URL(requestUrl).origin;
    } catch {
        return false;
    }
}

export const apiAccessMiddleware = createMiddleware<AppEnv>(async (c, next) => {
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
