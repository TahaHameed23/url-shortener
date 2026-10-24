import { Hono } from "hono";
import authRouter from "./routes/auth";
import linkRouter from "./routes/links";
import publicRouter from "./routes/public";
import { csrfMiddleware } from "./middlewares/csrf";
import { apiAccessMiddleware } from "./middlewares/api-access";
import { authRateLimitMiddleware } from "./middlewares/rate-limit";
import {
    logHttpFailure,
    logServerError,
} from "./services/error-logging";
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", async (c, next) => {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const requestLogContext = {
        requestId,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
    };
    c.header("X-Request-ID", requestId);

    try {
        await next();
    } finally {
        if (c.res.status >= 400) {
            logHttpFailure({
                ...requestLogContext,
                status: c.res.status,
                durationMs: Date.now() - startedAt,
            });
        }
    }
});

app.onError((error, c) => {
    const requestId = c.res.headers.get("X-Request-ID") ?? undefined;
    logServerError("http.unhandled_exception", error, {
        requestId,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
    });
    return c.json(
        { error: "Internal server error", requestId },
        500,
    );
});

app.use("*", async (c, next) => {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "same-origin");
    await next();
});
app.use("/api/*", apiAccessMiddleware);
app.use("/api/*", csrfMiddleware);
app.use("/api/v1/auth/*", authRateLimitMiddleware);
app.route("/api/v1", authRouter);
app.route("/api/v1", linkRouter);

app.route("/", publicRouter);

app.get("*", async (c) => {
    const pathname = new URL(c.req.url).pathname;

    if (pathname.startsWith("/api/")) {
        return c.notFound();
    }

    const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
    if (assetResponse.status !== 404) {
        return assetResponse;
    }

    const indexUrl = new URL("/", c.req.url);
    return c.env.ASSETS.fetch(new Request(indexUrl, c.req.raw));
});

export default app;
