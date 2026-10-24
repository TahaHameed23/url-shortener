import { logClientError } from "./error-logging";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    const method = (init.method ?? "GET").toUpperCase();
    const requestPath = new URL(path, window.location.origin).pathname;
    let response: Response;

    try {
        response = await fetch(path, {
            ...init,
            headers,
            credentials: "same-origin",
        });
    } catch (error) {
        logClientError("api.network_failure", {
            method,
            path: requestPath,
            name: error instanceof Error ? error.name : "NetworkError",
        });
        throw new Error("Unable to reach the server. Check your connection and try again.");
    }

    const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
    let payload: (T & { error?: string }) | null = null;

    if (isJson) {
        try {
            payload = (await response.json()) as (T & { error?: string }) | null;
        } catch (error) {
            const requestId = response.headers.get("x-request-id") ?? undefined;
            logClientError("api.invalid_response", {
                method,
                path: requestPath,
                status: response.status,
                requestId,
                name: error instanceof Error ? error.name : "ParseError",
            });
            throw new Error(
                requestId
                    ? `The server returned an invalid response. Reference: ${requestId}`
                    : "The server returned an invalid response.",
            );
        }
    }

    if (!response.ok) {
        const requestId = response.headers.get("x-request-id") ?? undefined;
        logClientError("api.http_failure", {
            level: response.status >= 500 ? "error" : "warn",
            method,
            path: requestPath,
            status: response.status,
            requestId,
        });
        throw new Error(
            payload?.error ??
                (requestId
                    ? `Request failed (${response.status}). Reference: ${requestId}`
                    : `Request failed (${response.status})`),
        );
    }

    if (isJson) {
        return payload as T;
    }
    return (await response.text()) as T;
}

export function shortUrl(link: { slug: string }) {
    return `${window.location.origin}/l/${link.slug}`;
}
