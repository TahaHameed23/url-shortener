import { z } from "zod";

export const registerRequestSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().transform((email) => email.toLowerCase()),
    password: z.string().min(8),
});

export const loginRequestSchema = z.object({
    email: z.string().trim().email().transform((email) => email.toLowerCase()),
    password: z.string().min(1),
});

export const authClaimsSchema = z.object({
    typ: z.literal("access"),
    userId: z.string(),
    email: z.string().email(),
    exp: z.number(),
    iat: z.number(),
    iss: z.literal("urlz"),
    aud: z.literal("urlz-web"),
});

export const jwtHeaderSchema = z.object({
    alg: z.literal("HS256"),
    typ: z.literal("JWT"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthClaims = z.infer<typeof authClaimsSchema>;
export type User = {
    id: string;
    name: string;
    email: string;
};
