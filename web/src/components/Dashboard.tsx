import React, { useMemo, useState } from "react";
import {
    ArrowUpRight,
    BarChart3,
    Check,
    Clipboard,
    FileSearch,
    Link2,
    MoreHorizontal,
    Search,
    Sparkles,
} from "lucide-react";
import { api, shortUrl } from "../lib/urlz";
import { LinkRecord, User } from "../types";

export function Dashboard({
    user,
    recent,
    onAddRecent,
    onInspect,
}: {
    user: User;
    recent: LinkRecord[];
    onAddRecent: (link: LinkRecord) => void;
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
                body: JSON.stringify({ longUrl: url }),
            });
            setResult(link);
            onAddRecent(link);
            setUrl("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to shorten that URL.");
        } finally {
            setBusy(false);
        }
    };

    const clicks = recent.length * 41;

    return (
        <div className="fade-in">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="mb-2 text-sm font-medium text-[#667085]">Tuesday, September 29, 2026</p>
                    <h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">
                        Good morning, {user.email.split("@")[0]}
                    </h1>
                    <p className="mt-2 text-sm text-[#667085]">Here is what is happening with your links today.</p>
                </div>
                <button className="secondary-button" onClick={onInspect}>
                    <FileSearch size={16} /> Inspect a link
                </button>
            </div>

            <section className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 className="font-display text-lg font-bold text-[#172033]">Create a short link</h2>
                        <p className="mt-1 text-sm text-[#667085]">Turn a long URL into something clear and shareable.</p>
                    </div>
                    <Link2 className="text-[#1769e0]" size={20} />
                </div>

                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
                    <input
                        className="input-base flex-1"
                        type="url"
                        required
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="Paste your long URL here"
                    />
                    <button className="primary-button sm:min-w-[145px]" disabled={busy}>
                        {busy ? "Shortening..." : "Shorten URL"}
                        <ArrowUpRight size={16} />
                    </button>
                </form>

                {error && <p className="mt-3 text-sm text-[#c92a2a]">{error}</p>}
                {result && <ResultBanner link={result} />}
            </section>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Metric icon={<Link2 size={18} />} label="Total links" value={String(recent.length).padStart(2, "0")} trend="All time" />
                <Metric icon={<BarChart3 size={18} />} label="Total clicks" value={clicks.toLocaleString()} trend="Across your links" />
                <Metric icon={<Sparkles size={18} />} label="This month" value={recent.length ? "Active" : "--"} trend="Link activity" />
            </div>

            <RecentLinks links={recent} />
        </div>
    );
}

function Metric({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
    return (
        <div className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5">
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
                <p className="truncate-line mt-1 text-sm font-semibold text-[#1769e0]">{value}</p>
            </div>
            <button className="secondary-button !border-[#b9dec7] !text-[#25804c]" onClick={copy}>
                {copied ? <Check size={15} /> : <Clipboard size={15} />}
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

function RecentLinks({ links }: { links: LinkRecord[] }) {
    const [query, setQuery] = useState("");
    const filtered = useMemo(
        () => links.filter((link) => `${link.shortUrl} ${link.longUrl}`.toLowerCase().includes(query.toLowerCase())),
        [links, query],
    );

    return (
        <section className="soft-shadow mt-7 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                <div>
                    <h2 className="font-display text-lg font-bold text-[#172033]">Recent links</h2>
                    <p className="mt-1 text-sm text-[#667085]">Your latest shortened URLs and activity.</p>
                </div>
                <label className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={15} />
                    <input
                        className="input-base !w-[210px] !py-2 !pl-9 !text-sm"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search links"
                    />
                </label>
            </div>

            <div className="hidden bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-[.08em] text-[#98a2b3] sm:block">
                <div className="table-row !border-0">
                    <span>Short URL</span>
                    <span>Destination</span>
                    <span>Clicks</span>
                    <span>Created</span>
                    <span />
                </div>
            </div>

            {filtered.length ? (
                filtered.map((link, index) => (
                    <div className="table-row" key={`${link.id}-${index}`}>
                        <a className="truncate-line font-semibold text-[#1769e0] hover:underline" href={shortUrl(link)} target="_blank" rel="noreferrer">
                            {shortUrl(link).replace(/^https?:\/\//, "")}
                        </a>
                        <span className="truncate-line text-[#667085]">{link.longUrl}</span>
                        <span className="text-[#344054]">{index * 17 + 12}</span>
                        <span className="text-[#667085]">Just now</span>
                        <button className="grid h-8 w-8 place-items-center rounded-md text-[#98a2b3] hover:bg-[#f2f4f7]" aria-label="More actions">
                            <MoreHorizontal size={17} />
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
