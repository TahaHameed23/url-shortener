import { z } from "zod";
import { getSafeExternalUrl } from "../services/safe-url";

export const createLinkRequestSchema = z.object({
    destinationUrl: z
        .string()
        .trim()
        .transform((value) => getSafeExternalUrl(value))
        .refine((value): value is string => value !== null, {
            message: "destinationUrl must be an http or https URL",
        }),
});

export type CreateLinkRequest = z.infer<typeof createLinkRequestSchema>;
