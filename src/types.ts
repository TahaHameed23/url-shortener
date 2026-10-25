import type { AuthClaims } from "./schemas/auth";

export type AppEnv = {
    Bindings: CloudflareBindings;
    Variables: {
        auth?: AuthClaims;
        destinationUrl?: string;
    };
};
