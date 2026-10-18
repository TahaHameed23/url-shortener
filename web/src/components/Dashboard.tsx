import React, { useCallback, useMemo, useState } from "react";
import {
    ArrowUpRight,
    BarChart3,
    Check,
    Clipboard,
    Trash2,
    FileSearch,
    Link2,
    Search,
} from "lucide-react";
import { api, shortUrl } from "../lib/urlz";
import { LinkRecord, User } from "../types";

export function Dashboard({
    user,
    links,
    totalLinks,
    loading,
    loadError,
    onAddLink,
    onRemoveLink,
    onInspect,
}: {
    user: User;
    links: LinkRecord[];
    totalLinks: number;
    loading: boolean;
    loadError: string;
    onAddLink: (link: LinkRecord) => void;
    onRemoveLink: (slug: string) => void;
    onInspect: () => void;
}) {
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<LinkRecord | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setResult(null);
        setBusy(true);

        try {
            const link = await api<LinkRecord>("/api/v1/links", {
                method: "POST",
                body: JSON.stringify({ destinationUrl: url }),
            });
            setResult(link);
            onAddLink(link);
            setUrl("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to shorten that URL.");
        } finally {
            setBusy(false);
        }
    };

    const totalClicks = useMemo(
        () => links.reduce((total, link) => total + link.clicks, 0),
        [links],
    );
    const averageClicks = links.length ? Math.round(totalClicks / links.length) : 0;

    return (
        <div className="animate-[fade-in_0.35s_ease_both]">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#1769e0]">Overview</p>
                    <h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">
                        Good morning, {user.name || user.email.split("@")[0]}
                    </h1>
                    <p className="mt-2 max-w-prose text-sm leading-6 text-[#667085]">
                        Create, organize, and monitor every short link from one focused workspace.
                    </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-2.5 font-semibold text-[#344054] transition-[border-color,background,transform] hover:-translate-y-px hover:border-[#b9c2d0] hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2" onClick={onInspect}>
                    <FileSearch size={16} /> Inspect a link
                </button>
            </div>

            <section aria-labelledby="create-link-heading" className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)] sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 id="create-link-heading" className="font-display text-lg font-bold text-[#172033]">Create a short link</h2>
                        <p className="mt-1 text-sm text-[#667085]">Turn a long URL into something clear and shareable.</p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef5ff] text-[#1769e0]" aria-hidden="true">
                        <Link2 size={18} />
                    </span>
                </div>

                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
                    <input
                        className="w-full flex-1 rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none transition-[border-color,box-shadow] focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2"
                        type="url"
                        required
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="Paste your long URL here"
                        aria-label="Long URL to shorten"
                    />
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1769e0] bg-[#1769e0] px-4 py-3 font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-[#0f59c5] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 sm:min-w-[145px]" disabled={busy}>
                        {busy ? "Shortening..." : "Shorten URL"}
                        <ArrowUpRight size={16} />
                    </button>
                </form>

                {error && <p className="mt-3 text-sm text-[#c92a2a]">{error}</p>}
                {result && <ResultBanner link={result} />}
            </section>

            <section aria-labelledby="overview-heading" className="mt-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <h2 id="overview-heading" className="font-display text-lg font-bold text-[#172033]">At a glance</h2>
                        <p className="mt-1 text-sm text-[#667085]">A quick view of your link performance.</p>
                    </div>
                </div>
            <div className="grid gap-4 sm:grid-cols-3">
                <Metric icon={<Link2 size={18} />} label="Total links" value={String(totalLinks)} trend="All time" />
                <Metric icon={<BarChart3 size={18} />} label="Total clicks" value={totalClicks.toLocaleString()} trend="Across your links" />
                <Metric icon={<ArrowUpRight size={18} />} label="Avg. clicks per link" value={averageClicks.toLocaleString()} trend="Based on current links" />
            </div>
            </section>

            <RecentLinks
                links={links}
                loading={loading}
                loadError={loadError}
                onRemove={onRemoveLink}
            />
        </div>
    );
}

function Metric({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
    return (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)]">
            <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[#eef5ff] text-[#1769e0]">{icon}</span>
                <span className="text-[11px] font-medium text-[#98a2b3]">{trend}</span>
            </div>
            <p className="mt-5 text-sm text-[#667085]">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-[#172033]">{value}</p>
        </div>
    );
}

function ResultBanner({ link }: { link: LinkRecord }) {
    const [copied, setCopied] = useState(false);
    const value = shortUrl(link);

    const copy = async () => {
        try {
            await navigator.clipboard?.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#cde6d7] bg-[#f2fbf5] px-4 py-3">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-[#25804c]">Your short link is ready</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#1769e0]">{value}</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#b9dec7] bg-white px-3.5 py-2.5 font-semibold text-[#25804c] transition-[border-color,background,transform] hover:-translate-y-px hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2" onClick={copy}>
                {copied ? <Check size={15} /> : <Clipboard size={15} />}
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

function RecentLinks({
    links,
    loading,
    loadError,
    onRemove,
}: {
    links: LinkRecord[];
    loading: boolean;
    loadError: string;
    onRemove: (slug: string) => void;
}) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(
        () => links.filter((link) => `${link.slug} ${link.destinationUrl}`.toLowerCase().includes(query.toLowerCase())),
        [links, query],
    );

    const handleDelete = useCallback(async (link: LinkRecord) => {
        if (!window.confirm("Delete this short link?")) {
            return;
        }

        try {
            await api(`/api/v1/links/${encodeURIComponent(link.slug)}`, {
                method: "DELETE",
            });
            onRemove(link.slug);
        } catch {
            window.alert("Unable to delete this link.");
        }
    }, [onRemove]);

    return (
        <section className="mt-7 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_14px_36px_rgba(31,41,55,0.055)]">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                <div>
                    <h2 className="font-display text-lg font-bold text-[#172033]">Recent links</h2>
                    <p className="mt-1 text-sm text-[#667085]">Your latest shortened URLs and activity.</p>
                </div>
                <label className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={15} />
                    <input
                        className="w-[210px] rounded-lg border border-[#dfe3ea] bg-white py-2 pl-9 pr-3.5 text-sm text-[#1f2937] outline-none transition-[border-color,box-shadow] focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search links"
                        aria-label="Search your links"
                    />
                </label>
            </div>

            <div className="hidden bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-[.08em] text-[#98a2b3] sm:block">
                <div className="grid grid-cols-[minmax(190px,1fr)_minmax(230px,1.7fr)_90px_115px_72px] items-center gap-4 px-5 py-[15px]">
                    <span>Short URL</span>
                    <span>Destination</span>
                    <span>Clicks</span>
                    <span>Created</span>
                    <span />
                </div>
            </div>

            {loading ? (
                <div className="px-6 py-12 text-center text-sm text-[#98a2b3]">Loading links...</div>
            ) : loadError ? (
                <div className="px-6 py-12 text-center text-sm text-[#c92a2a]">{loadError}</div>
            ) : filtered.length ? (
                filtered.map((link, index) => (
                    <div className="grid grid-cols-[minmax(190px,1fr)_minmax(230px,1.7fr)_90px_115px_72px] items-center gap-4 border-t border-[#edf0f4] px-5 py-[15px] text-[13px] transition-colors hover:bg-[#fafbfc] max-[900px]:grid-cols-[minmax(150px,1fr)_minmax(180px,1.4fr)_70px_90px] max-[900px]:[&>:last-child]:hidden max-[380px]:grid-cols-[minmax(145px,1fr)_70px_70px] max-[380px]:gap-2 max-[380px]:px-3.5 max-[380px]:[&>:nth-child(2)]:hidden max-[380px]:[&>:nth-child(4)]:hidden" key={`${link.id}-${index}`}>
                        <a className="truncate font-semibold text-[#1769e0] hover:underline" href={shortUrl(link)} target="_blank" rel="noreferrer">
                            {shortUrl(link).replace(/^https?:\/\//, "")}
                        </a>
                        <span className="truncate text-[#667085]">{link.destinationUrl}</span>
                        <span className="text-[#344054]">{link.clicks}</span>
                        <span className="text-[#667085]">{formatDate(link.createdAt)}</span>
                        <button
                            className="grid h-8 w-8 place-items-center rounded-md text-[#98a2b3] transition-colors hover:bg-[#fff1f1] hover:text-[#c92a2a] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2"
                            aria-label={`Delete ${link.slug}`}
                            onClick={() => handleDelete(link)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))
            ) : (
                <div className="px-6 py-12 text-center text-sm text-[#98a2b3]">No links yet. Create your first short link above.</div>
            )}

            <div className="border-t border-[#edf0f4] px-5 py-3 text-xs text-[#98a2b3]">
                Showing {filtered.length} of {links.length} links
            </div>
        </section>
    );
}

function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Unknown"
        : new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
          }).format(date);
}
