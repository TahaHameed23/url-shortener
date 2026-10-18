import { Hono } from "hono";
import authRouter from "./routes/auth";
import linkRouter from "./routes/links";
import publicRouter from "./routes/public";
import { csrfMiddleware } from "./middlewares/csrf";
import { apiAccessMiddleware } from "./middlewares/api-access";
import { authRateLimitMiddleware } from "./middlewares/rate-limit";
const app = new Hono<{ Bindings: CloudflareBindings }>();

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
