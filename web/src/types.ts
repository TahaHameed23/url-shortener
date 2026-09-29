export type User = { id: string; email: string };
export type LinkRecord = {
    id: string;
    shortUrl: string;
    longUrl: string;
    createdBy?: string;
};
export type View = "dashboard" | "inspect" | "settings";
export type AuthMode = "login" | "register";
