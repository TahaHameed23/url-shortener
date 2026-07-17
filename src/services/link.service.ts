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

type LinkContext = {
    db: D1DatabaseLike;
    slug: string;
    link: CachedLinkRecord;
};

function requireDatabase(c: any): D1DatabaseLike | Response {
    const db = c.env.DB as D1DatabaseLike | undefined;

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    return db;
}

async function resolveLinkContext(c: any): Promise<LinkContext | Response> {
    const slug = c.req.param("slug");
    const db = requireDatabase(c);

    if (db instanceof Response) {
        return db;
    }

    const cacheEnabled = isKvCacheEnabled(c.env.KV_CACHE_ENABLED);
    const cachedLink = cacheEnabled
        ? await getCachedLinkBySlug(c.env.KV, slug)
        : null;

    if (cachedLink) {
        return { db, slug, link: cachedLink };
    }

    const storedLink = await getLinkBySlug(db, slug);

    if (!storedLink) {
        return c.json({ error: "Link not found" }, 404);
    }

    if (cacheEnabled) {
        await setCachedLink(c.env.KV, storedLink);
    }

    return { db, slug, link: storedLink };
}

export const createLink = async (c: any) => {
    const body = c.get("body") as { longUrl?: string } | undefined;
    const auth = c.get("auth") as { userId?: string } | undefined;

    if (!body?.longUrl) {
        return c.json({ error: "Missing longUrl" }, 400);
    }

    const db = requireDatabase(c);

    if (db instanceof Response) {
        return db;
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

export const getLink = async (c: any) => {
    try {
        const context = await resolveLinkContext(c);

        if (context instanceof Response) {
            return context;
        }

        return c.json(context.link, 200);
    } catch {
        return c.json({ error: "Failed to fetch link" }, 500);
    }
};

export const redirectLink = async (c: any) => {
    try {
        const context = await resolveLinkContext(c);

        if (context instanceof Response) {
            return context;
        }

        await incrementLinkClicks(context.db, context.slug);
        return c.redirect(context.link.longUrl, 302);
    } catch {
        return c.json({ error: "Failed to fetch link" }, 500);
    }
};
