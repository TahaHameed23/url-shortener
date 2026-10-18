import React, { useState } from "react";
import { Check, ExternalLink, FileSearch, Search } from "lucide-react";
import { api, shortUrl } from "../lib/urlz";
import { LinkRecord } from "../types";
import { Detail, PageHeading } from "./Brand";

export function Inspect() {
    const [slug, setSlug] = useState("");
    const [link, setLink] = useState<LinkRecord | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setLink(null);
        setBusy(true);

        try {
            const result = await api<LinkRecord>(`/api/v1/links/${encodeURIComponent(slug.trim())}`);
            setLink(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Link not found.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="animate-[fade-in_0.35s_ease_both]">
            <PageHeading
                eyebrow="Link intelligence"
                title="Inspect link"
                description="See where a short link points and review its current details."
            />

            <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)] sm:p-6">
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={16} />
                        <input
                            className="w-full rounded-lg border border-[#dfe3ea] bg-white py-3 pl-10 pr-3.5 text-[#1f2937] outline-none transition-[border-color,box-shadow] focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)]"
                            required
                            value={slug}
                            onChange={(event) => setSlug(event.target.value)}
                            placeholder="Enter a short-link slug"
                        />
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1769e0] bg-[#1769e0] px-4 py-3 font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-[#0f59c5] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 sm:min-w-[125px]" disabled={busy}>
                        {busy ? "Inspecting..." : "Inspect"}
                        <FileSearch size={16} />
                    </button>
                </form>

                {error && <p className="mt-4 rounded-md bg-[#fff5f5] px-3 py-2.5 text-sm text-[#c92a2a]">{error}</p>}
            </section>

            {link && (
                <section className="mt-5 rounded-lg border border-[#cde6d7] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)] sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25804c]">
                                <Check size={14} /> Link found
                            </span>
                            <h2 className="mt-3 font-display text-xl font-bold text-[#172033]">{shortUrl(link)}</h2>
                        </div>
                        <a className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-2.5 font-semibold text-[#344054] transition-[border-color,background,transform] hover:-translate-y-px hover:border-[#b9c2d0] hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2" href={shortUrl(link)} target="_blank" rel="noreferrer">
                            <ExternalLink size={15} /> Open link
                        </a>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                        <Detail label="Short URL" value={shortUrl(link)} />
                        <Detail label="Destination" value={link.destinationUrl} />
                        <Detail label="Status" value="Active" />
                    </div>
                </section>
            )}
        </div>
    );
}
