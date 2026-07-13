import crypto from "node:crypto";
import { encode } from "base62";

const MAX_RANDOM_ID = 281474976710655;

export interface D1PreparedStatementLike {
    bind(...values: unknown[]): D1PreparedStatementLike;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    run(): Promise<unknown>;
}

export interface D1DatabaseLike {
    prepare(query: string): D1PreparedStatementLike;
}

export interface StoredLink {
    id: string;
    shortUrl: string;
    longUrl: string;
    createdBy?: string;
}

interface LinkRow {
    id: string;
    slug: string;
    original_url: string;
}

async function shortUrlExists(
    db: D1DatabaseLike,
    shortUrl: string,
): Promise<boolean> {
    const row = await db
        .prepare("SELECT 1 FROM links WHERE slug = ? LIMIT 1")
        .bind(shortUrl)
        .first();
    return row !== null;
}

export async function getLinkBySlug(
    db: D1DatabaseLike,
    slug: string,
): Promise<StoredLink | null> {
    const row = await db
        .prepare(
            "SELECT id, slug, original_url FROM links WHERE slug = ? LIMIT 1",
        )
        .bind(slug)
        .first<LinkRow>();

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        shortUrl: row.slug,
        longUrl: row.original_url,
    };
}

export async function incrementLinkClicks(
    db: D1DatabaseLike,
    slug: string,
): Promise<void> {
    await db
        .prepare("UPDATE links SET clicks = clicks + 1 WHERE slug = ?")
        .bind(slug)
        .run();
}

async function insertLink(db: D1DatabaseLike, link: StoredLink): Promise<void> {
    await db
        .prepare(
            "INSERT INTO links (id, slug, original_url, created_by) VALUES (?, ?, ?, ?)",
        )
        .bind(link.id, link.shortUrl, link.longUrl, link.createdBy ?? null)
        .run();
}

export async function createUniqueLink(
    db: D1DatabaseLike,
    longUrl: string,
    createdBy?: string,
    maxAttempts = 5,
): Promise<StoredLink> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const id = crypto.randomInt(0, MAX_RANDOM_ID);
        const shortUrl = encode(id);

        if (await shortUrlExists(db, shortUrl)) {
            continue;
        }

        const link = {
            id: id.toString(),
            shortUrl,
            longUrl,
            createdBy,
        };

        await insertLink(db, link);
        return link;
    }

    throw new Error("Unable to generate a unique shortUrl");
}
