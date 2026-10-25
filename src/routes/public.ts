import { Hono } from "hono";
import { redirectLink } from "../services/link.service";
import type { AppEnv } from "../types";

const publicRouter = new Hono<AppEnv>();

publicRouter.get("/l/:slug", redirectLink);

export default publicRouter;
