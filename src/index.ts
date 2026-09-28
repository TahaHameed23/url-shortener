import { Hono } from "hono";
import authRouter from "./routes/auth";
import linkRouter from "./routes/links";
import publicRouter from "./routes/public";
import { csrfMiddleware } from "./middlewares/csrf";
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("/api/*", csrfMiddleware);
app.route("/api/v1", authRouter);
app.route("/api/v1", linkRouter);

app.route("/", publicRouter);

app.get("*", (c) => {
    const pathname = new URL(c.req.url).pathname;

    if (pathname.startsWith("/api/")) {
        return c.notFound();
    }

    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
