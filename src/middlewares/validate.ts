import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { z } from "zod";
import { createLinkRequestSchema } from "../schemas/links";
import type { AppEnv } from "../types";

export async function parseJsonBody<TSchema extends z.ZodType>(
    c: Context<AppEnv>,
    schema: TSchema,
): Promise<
    | { success: true; data: z.infer<TSchema> }
    | { success: false; reason: "invalid_json" | "invalid_body" }
> {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return { success: false, reason: "invalid_json" };
    }

    const result = schema.safeParse(body);
    return result.success
        ? { success: true, data: result.data }
        : { success: false, reason: "invalid_body" };
}

export const validateUrl = createMiddleware<AppEnv>(async (c, next) => {
    const parsed = await parseJsonBody(c, createLinkRequestSchema);
    if (!parsed.success) {
        return c.json(
            {
                error:
                    parsed.reason === "invalid_json"
                        ? "Invalid JSON body"
                        : "Invalid destinationUrl",
            },
            400,
        );
    }

    c.set("destinationUrl", parsed.data.destinationUrl);
    await next();
});
