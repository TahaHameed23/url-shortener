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

export function shortUrl(link: { slug: string }) {
    return `${window.location.origin}/l/${link.slug}`;
}
