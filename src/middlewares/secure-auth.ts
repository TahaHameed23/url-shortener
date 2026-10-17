import { createMiddleware } from "hono/factory";

function isLocalDevelopment(hostname: string): boolean {
    return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]"
    );
}

export const secureAuthMiddleware = createMiddleware(async (c, next) => {
    const requestUrl = new URL(c.req.url);

    if (requestUrl.protocol !== "https:" && !isLocalDevelopment(requestUrl.hostname)) {
        return c.json(
            { error: "Secure HTTPS connection required for authentication" },
            426,
        );
    }

    await next();
});
