// routes/links.ts
import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth";
import { createLink, getLink } from "../services/link.service";
import { validateUrl } from "../middlewares/validate";
const linkRouter = new Hono();

linkRouter.use("/links/*", authMiddleware);
linkRouter.use("/links", authMiddleware);

linkRouter.post("/links", validateUrl, createLink);
linkRouter.get("/links/:slug", getLink);
// linkRouter.delete("/links/:slug", deleteLink);
export default linkRouter;
