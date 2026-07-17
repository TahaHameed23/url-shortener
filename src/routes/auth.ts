import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth";
import {
    createAuthToken,
    getUserById,
    isUserEmailTaken,
    loginUser,
    registerUser,
} from "../services/auth.service";
import {
    isRegistrationInputValid,
    readCredentials,
    requireAuthDependencies,
} from "./auth.utils";

const authRouter = new Hono<{ Bindings: CloudflareBindings }>();

authRouter.post("/auth/register", async (c) => {
    const dependencies = requireAuthDependencies(c);

    if (dependencies instanceof Response) {
        return dependencies;
    }

    const credentials = await readCredentials(c);

    if (credentials instanceof Response) {
        return credentials;
    }

    if (!isRegistrationInputValid(credentials)) {
        return c.json({ error: "Invalid email or password" }, 400);
    }

    if (await isUserEmailTaken(dependencies.db, credentials.email)) {
        return c.json({ error: "User already exists" }, 409);
    }

    const { user } = await registerUser(
        dependencies.db,
        credentials.email,
        credentials.password,
    );
    const token = createAuthToken(user, dependencies.secret);

    return c.json(
        {
            user,
            tokenType: "Bearer",
            accessToken: token,
        },
        201,
    );
});

authRouter.post("/auth/login", async (c) => {
    const dependencies = requireAuthDependencies(c);

    if (dependencies instanceof Response) {
        return dependencies;
    }

    const credentials = await readCredentials(c);

    if (credentials instanceof Response) {
        return credentials;
    }

    const user = await loginUser(
        dependencies.db,
        credentials.email,
        credentials.password,
    );

    if (!user) {
        return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = createAuthToken(user, dependencies.secret);

    return c.json({ user, tokenType: "Bearer", accessToken: token }, 200);
});

authRouter.get("/auth/me", authMiddleware, async (c: any) => {
    const auth = c.get("auth") as
        | { userId?: string; email?: string }
        | undefined;
    const db = c.env.DB;

    if (!auth?.userId || !db) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await getUserById(db, auth.userId);

    if (!user) {
        return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user }, 200);
});

export default authRouter;
