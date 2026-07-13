import { Hono } from "hono";
import authRouter from "./routes/auth";
import linkRouter from "./routes/links";
import publicRouter from "./routes/public";
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/api/v1", authRouter);
app.route("/api/v1", linkRouter);

app.route("/", publicRouter);

export default app;
