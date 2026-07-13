export type CachedLinkRecord = {
    id: string;
    shortUrl: string;
    longUrl: string;
    createdBy?: string;
};

const LINK_BY_SLUG_PREFIX = "link:slug:";
const LINK_BY_LONG_URL_PREFIX = "link:long:";
const DEFAULT_CACHE_TTL_SECONDS = 60 * 60;

export function isKvCacheEnabled(value: string | undefined): boolean {
    return value !== "false" && value !== "0";
}

function encodeCacheKey(value: string): string {
    return encodeURIComponent(value);
}

export function slugCacheKey(slug: string): string {
    return `${LINK_BY_SLUG_PREFIX}${slug}`;
}

export function longUrlCacheKey(longUrl: string): string {
    return `${LINK_BY_LONG_URL_PREFIX}${encodeCacheKey(longUrl)}`;
}

export async function getCachedLinkBySlug(
    kv: KVNamespace | undefined,
    slug: string,
): Promise<CachedLinkRecord | null> {
    if (!kv) {
        return null;
    }

    return kv.get<CachedLinkRecord>(slugCacheKey(slug), "json");
}

export async function getCachedLinkByLongUrl(
    kv: KVNamespace | undefined,
    longUrl: string,
): Promise<CachedLinkRecord | null> {
    if (!kv) {
        return null;
    }

    return kv.get<CachedLinkRecord>(longUrlCacheKey(longUrl), "json");
}

export async function setCachedLink(
    kv: KVNamespace | undefined,
    link: CachedLinkRecord,
    ttlSeconds = DEFAULT_CACHE_TTL_SECONDS,
): Promise<void> {
    if (!kv) {
        return;
    }

    const value = JSON.stringify(link);

    await Promise.all([
        kv.put(slugCacheKey(link.shortUrl), value, {
            expirationTtl: ttlSeconds,
        }),
        kv.put(longUrlCacheKey(link.longUrl), value, {
            expirationTtl: ttlSeconds,
        }),
    ]);
}
