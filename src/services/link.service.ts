import {
    createUniqueLink,
    getLinkBySlug,
    incrementLinkClicks,
    listLinksByUser,
    type D1DatabaseLike,
    type StoredLink,
} from "../d1/db";
import {
    isKvCacheEnabled,
    getCachedLinkBySlug,
    deleteCachedLink,
    setCachedLink,
    type CachedLinkRecord,
} from "../kv/kv";
import { getSafeExternalUrl } from "./safe-url";
import { logServerError } from "./error-logging";

function logLinkFailure(c: any, event: string, error: unknown): void {
    logServerError(event, error, {
        requestId: c.res.headers.get("X-Request-ID") ?? undefined,
        method: c.req.method,
        path: new URL(c.req.url).pathname,
    });
}

function publicLink(
    link: StoredLink | CachedLinkRecord,
): Omit<StoredLink, "createdBy"> {
    const { createdBy: _createdBy, ...result } = link;
    return result;
}

export const createLink = async (c: any) => {
    const body = c.get("body") as { destinationUrl?: string } | undefined;
    const auth = c.get("auth") as { userId?: string } | undefined;

    if (!body?.destinationUrl) {
        return c.json({ error: "Missing destinationUrl" }, 400);
    }

    const db = c.env.DB as D1DatabaseLike | undefined;

    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    try {
        const cacheEnabled = isKvCacheEnabled(c.env.KV_CACHE_ENABLED);

        const link = await createUniqueLink(db, body.destinationUrl, auth?.userId);

        if (cacheEnabled) {
            await setCachedLink(c.env.KV, link);
        }

        return c.json(publicLink(link), 201);
    } catch (error) {
        logLinkFailure(c, "links.create.failed", error);
        return c.json({ error: "Failed to create link" }, 500);
    }
};

export const listLinks = async (c: any) => {
    const auth = c.get("auth") as { userId?: string } | undefined;
    const db = c.env.DB as D1DatabaseLike | undefined;

    if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    if (!db) {
        return c.json({ error: "Database unavailable" }, 500);
    }

    try {
        const links = await listLinksByUser(db, auth.userId);
        return c.json(
            {
                links: links.map(publicLink),
                total: links.length,
                nextCursor: null,
            },
            200,
        );
    } catch (error) {
        logLinkFailure(c, "links.list.failed", error);
        return c.json({ error: "Failed to fetch links" }, 500);
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

        const auth = c.get("auth") as { userId?: string } | undefined;
        if (!auth?.userId || result.link.createdBy !== auth.userId) {
            return c.json({ error: "Link not found" }, 404);
        }

        const cacheEnabled = isKvCacheEnabled(c.env.KV_CACHE_ENABLED);

        const cached = cacheEnabled
            ? await getCachedLinkBySlug(c.env.KV, result.slug)
            : null;

        if (cached) {
            return c.json(publicLink(cached), 200);
        }

        if (cacheEnabled) {
            await setCachedLink(c.env.KV, result.link as CachedLinkRecord);
        }

        return c.json(publicLink(result.link), 200);
    } catch (error) {
        logLinkFailure(c, "links.get.failed", error);
        return c.json({ error: "Failed to fetch link" }, 500);
    }
};

export const deleteLink = async (c: any) => {
    try {
        const result = await loadLink(c);

        if ("error" in result) {
            return result.error;
        }

        const auth = c.get("auth") as { userId?: string } | undefined;
        if (!auth?.userId || result.link.createdBy !== auth.userId) {
            return c.json({ error: "Link not found" }, 404);
        }

        const deleted = await result.db
            .prepare("DELETE FROM links WHERE slug = ? AND created_by = ?")
            .bind(result.slug, auth.userId)
            .run();
        const changes = (deleted as { meta?: { changes?: number } }).meta?.changes;

        if (changes !== undefined && changes !== 1) {
            return c.json({ error: "Link not found" }, 404);
        }

        if (isKvCacheEnabled(c.env.KV_CACHE_ENABLED)) {
            await deleteCachedLink(c.env.KV, result.link as CachedLinkRecord);
        }

        return c.json({ ok: true }, 200);
    } catch (error) {
        logLinkFailure(c, "links.delete.failed", error);
        return c.json({ error: "Failed to delete link" }, 500);
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
        const destination = getSafeExternalUrl(
            cached?.destinationUrl ?? result.link.destinationUrl,
        );

        if (!destination) {
            return c.json({ error: "Link destination is invalid" }, 422);
        }

        if (cached) {
            await incrementLinkClicks(result.db, result.slug);
            await setCachedLink(c.env.KV, {
                ...cached,
                clicks: cached.clicks + 1,
            });
            return c.redirect(destination, 302);
        }

        await incrementLinkClicks(result.db, result.slug);

        if (cacheEnabled) {
            await setCachedLink(c.env.KV, {
                ...result.link,
                clicks: result.link.clicks + 1,
            });
        }

        return c.redirect(destination, 302);
    } catch (error) {
        logLinkFailure(c, "links.redirect.failed", error);
        return c.json({ error: "Failed to fetch link" }, 500);
    }
};
