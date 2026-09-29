const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function getSafeExternalUrl(value: string): string | null {
    try {
        const url = new URL(value.trim());

        if (!ALLOWED_PROTOCOLS.has(url.protocol) || !url.hostname) {
            return null;
        }

        if (url.username || url.password) {
            return null;
        }

        return url.toString();
    } catch {
        return null;
    }
}
