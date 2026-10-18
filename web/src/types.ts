export type User = { id: string; name: string; email: string };
export type LinkRecord = {
    id: string;
    slug: string;
    destinationUrl: string;
    clicks: number;
    createdAt: string;
};
export type LinkListResponse = {
    links: LinkRecord[];
    total: number;
    nextCursor: string | null;
};
export type View = "dashboard" | "inspect" | "settings";
export type AuthMode = "login" | "register";
