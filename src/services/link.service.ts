import {
    createUniqueLink,
    getLinkBySlug,
    incrementLinkClicks,
    type D1DatabaseLike,
} from "../d1/db";
import {
    isKvCacheEnabled,
    getCachedLinkByLongUrl,
    getCachedLinkBySlug,
    setCachedLink,
    type CachedLinkRecord,
} from "../kv/kv";
export const createLink = async (c: any) => {
    const body = c.get("body") as { longUrl?: string } | undefined;
    const auth = c.get("auth") as { userId?: string } | undefined;

    if (!body?.longUrl) {
        return c.json({ error: "Missing longUrl" }, 400);
    }

    const db = c.env.DB as D1DatabaseLike | undefined;

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    try {
        const cacheEnabled = isKvCacheEnabled(c.env.KV_CACHE_ENABLED);

        const cachedByLongUrl = cacheEnabled
            ? await getCachedLinkByLongUrl(c.env.KV, body.longUrl)
            : null;

        if (cachedByLongUrl) {
            return c.json(cachedByLongUrl, 200);
        }

        const link = await createUniqueLink(db, body.longUrl, auth?.userId);

        if (cacheEnabled) {
            await setCachedLink(c.env.KV, link);
        }

        return c.json(link, 201);
    } catch {
        return c.json({ error: "Failed to create link" }, 500);
    }
};

const loadLink = async (c: any) => {
    const slug = c.req.param("slug");
    const db = c.env.DB as D1DatabaseLike | undefined;

    if (!db) {
        return { error: c.json({ error: "Database unavailable" }, 500) };
    }

    const link = await getLinkBySlug(db, slug);

    if (!link) {
        return { error: c.json({ error: "Link not found" }, 404) };
    }

    return { db, link, slug };
};

export const getLink = async (c: any) => {
    try {
        const result = await loadLink(c);

        if ("error" in result) {
            return result.error;
        }

        const cacheEnabled = isKvCacheEnabled(c.env.KV_CACHE_ENABLED);

        const cached = cacheEnabled
            ? await getCachedLinkBySlug(c.env.KV, result.slug)
            : null;

        if (cached) {
            return c.json(cached, 200);
        }

        if (cacheEnabled) {
            await setCachedLink(c.env.KV, result.link as CachedLinkRecord);
        }

        return c.json(result.link, 200);
    } catch {
        return c.json({ error: "Failed to fetch link" }, 500);
    }
};

export const redirectLink = async (c: any) => {
    try {
        const result = await loadLink(c);

        if ("error" in result) {
            return result.error;
        }

        const cacheEnabled = isKvCacheEnabled(c.env.KV_CACHE_ENABLED);

        const cached = cacheEnabled
            ? await getCachedLinkBySlug(c.env.KV, result.slug)
            : null;

        if (cached) {
            await incrementLinkClicks(result.db, result.slug);
            return c.redirect(cached.longUrl, 302);
        }

        await incrementLinkClicks(result.db, result.slug);

        if (cacheEnabled) {
            await setCachedLink(c.env.KV, result.link as CachedLinkRecord);
        }

        return c.redirect(result.link.longUrl, 302);
    } catch {
        return c.json({ error: "Failed to fetch link" }, 500);
    }
};
