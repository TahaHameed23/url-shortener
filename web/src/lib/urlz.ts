import { LinkRecord } from "../types";

export const STORAGE_KEY = "urlz.recentLinks";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    const response = await fetch(path, {
        ...init,
        headers,
        credentials: "same-origin",
    });
    const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
    const payload = isJson
        ? ((await response.json()) as (T & { error?: string }) | null)
        : null;

    if (!response.ok) {
        throw new Error(
            (payload as { error?: string } | null)?.error ??
                `Request failed (${response.status})`,
        );
    }

    return (payload ?? ((await response.text()) as T)) as T;
}

export function loadRecent(): LinkRecord[] {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY) ?? "[]",
        ) as LinkRecord[];
    } catch {
        return [];
    }
}

export function saveRecent(links: LinkRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, 12)));
}

export function shortUrl(link: LinkRecord) {
    return link.shortUrl.startsWith("http")
        ? link.shortUrl
        : `${window.location.origin}/l/${link.shortUrl}`;
}
