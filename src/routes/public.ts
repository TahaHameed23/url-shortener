import { Hono } from "hono";
import { redirectLink } from "../services/link.service";

const publicRouter = new Hono<{ Bindings: CloudflareBindings }>();

publicRouter.get("/l/:slug", redirectLink);

export default publicRouter;
