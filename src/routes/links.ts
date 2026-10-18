// routes/links.ts
import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth";
import { createLink, deleteLink, getLink, listLinks } from "../services/link.service";
import { validateUrl } from "../middlewares/validate";
const linkRouter = new Hono();

linkRouter.use("*", authMiddleware);

linkRouter.post("/links", validateUrl, createLink);
linkRouter.get("/links", listLinks);
linkRouter.get("/links/:slug", getLink);
linkRouter.delete("/links/:slug", deleteLink);
export default linkRouter;
