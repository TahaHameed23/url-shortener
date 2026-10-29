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
    LogOut,
} from "lucide-react";
import { api, shortUrl } from "../lib/urlz";
import type { LinkRecord, User } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import type { ToastNoticeData } from "./FeedbackToast";

export function Dashboard({
    user,
    links,
    totalLinks,
    loading,
    loadError,
    onAddLink,
    onRemoveLink,
    onInspect,
    onNotify,
}: {
    user: User;
    links: LinkRecord[];
    totalLinks: number;
    loading: boolean;
    loadError: string;
    onAddLink: (link: LinkRecord) => void;
    onRemoveLink: (slug: string) => void;
    onInspect: () => void;
    onNotify: (notice: ToastNoticeData) => void;
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
            onNotify({ message: "Your short link was created.", type: "success" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to shorten that URL.");
            onNotify({ message: err instanceof Error ? err.message : "Unable to create the short link.", type: "error" });
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
                    <h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033] dark:text-[#f1f5fb]">
                        Hey there, {user.name || user.email.split("@")[0]}
                    </h1>
                    <p className="mt-2 max-w-prose text-sm leading-6 text-[#667085] dark:text-[#a3afc2]">
                        Create, organize, and monitor every short link from one focused workspace.
                    </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-2.5 font-semibold text-[#344054] transition-[color,background-color,border-color,transform] duration-150 ease-out hover:-translate-y-px hover:border-[#b9c2d0] hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 active:translate-y-0 dark:border-[#303b4c] dark:bg-[#1b2432] dark:text-[#d2dae6] dark:hover:border-[#45638f] dark:hover:bg-[#203657]" onClick={onInspect}>
                    <FileSearch size={16} /> Inspect a link
                </button>
            </div>

            <section aria-labelledby="create-link-heading" className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)] sm:p-6 dark:border-[#293445] dark:bg-[#171e29] dark:shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h2 id="create-link-heading" className="font-display text-lg font-bold text-[#172033] dark:text-[#f1f5fb]">Create a short link</h2>
                        <p className="mt-1 text-sm text-[#667085] dark:text-[#a3afc2]">Turn a long URL into something clear and shareable.</p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef5ff] text-[#1769e0] dark:bg-[#203657] dark:text-[#82b2ff]" aria-hidden="true">
                        <Link2 size={18} />
                    </span>
                </div>

                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
                    <input
                        className="w-full flex-1 rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#354258] dark:bg-[#111822] dark:text-[#f1f5fb] dark:placeholder:text-[#7f8ba0]"
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

                {error && <p className="mt-3 text-sm text-[#c92a2a] dark:text-[#ff9da8]">{error}</p>}
                {result && <ResultBanner link={result} />}
            </section>

            <section aria-labelledby="overview-heading" className="mt-8">
                <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                        <h2 id="overview-heading" className="font-display text-lg font-bold text-[#172033] dark:text-[#f1f5fb]">At a glance</h2>
                        <p className="mt-1 text-sm text-[#667085] dark:text-[#a3afc2]">A quick view of your link performance.</p>
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
                onNotify={onNotify}
            />
        </div>
    );
}

function Metric({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
    return (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)] dark:border-[#293445] dark:bg-[#171e29] dark:shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
            <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[#eef5ff] text-[#1769e0] dark:bg-[#203657] dark:text-[#82b2ff]">{icon}</span>
                <span className="text-[11px] font-medium text-[#98a2b3] dark:text-[#8492a7]">{trend}</span>
            </div>
            <p className="mt-5 text-sm text-[#667085] dark:text-[#a3afc2]">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-[#172033] dark:text-[#f1f5fb]">{value}</p>
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
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#cde6d7] bg-[#f2fbf5] px-4 py-3 dark:border-[#295342] dark:bg-[#172b25]">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-[#25804c] dark:text-[#75d59d]">Your short link is ready</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#1769e0]">{value}</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#b9dec7] bg-white px-3.5 py-2.5 font-semibold text-[#25804c] transition-[border-color,background,transform] hover:-translate-y-px hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#35654b] dark:bg-[#1d352b] dark:text-[#75d59d] dark:hover:bg-[#244434]" onClick={copy}>
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
    onNotify,
}: {
    links: LinkRecord[];
    loading: boolean;
    loadError: string;
    onRemove: (slug: string) => void;
    onNotify: (notice: ToastNoticeData) => void;
}) {
    const [query, setQuery] = useState("");
    const [confirmLink, setConfirmLink] = useState<LinkRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const filtered = useMemo(
        () => links.filter((link) => `${link.slug} ${link.destinationUrl}`.toLowerCase().includes(query.toLowerCase())),
        [links, query],
    );

    const handleDelete = useCallback(async () => {
        if (!confirmLink) return;
        setDeleting(true);
        try {
            await api(`/api/v1/links/${encodeURIComponent(confirmLink.slug)}`, {
                method: "DELETE",
            });
            onRemove(confirmLink.slug);
            onNotify({ message: "Short link deleted.", type: "success" });
            setConfirmLink(null);
        } catch (error) {
            onNotify({
                message: error instanceof Error ? error.message : "Unable to delete this link. Please try again.",
                type: "error",
            });
        } finally {
            setDeleting(false);
        }
    }, [confirmLink, onNotify, onRemove]);

    return (
        <section className="mt-7 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_14px_36px_rgba(31,41,55,0.055)] dark:border-[#293445] dark:bg-[#171e29] dark:shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                <div>
                    <h2 className="font-display text-lg font-bold text-[#172033] dark:text-[#f1f5fb]">Recent links</h2>
                    <p className="mt-1 text-sm text-[#667085] dark:text-[#a3afc2]">Your latest shortened URLs and activity.</p>
                </div>
                <label className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={15} />
                    <input
                        className="w-[210px] rounded-lg border border-[#dfe3ea] bg-white py-2 pl-9 pr-3.5 text-sm text-[#1f2937] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#354258] dark:bg-[#111822] dark:text-[#f1f5fb] dark:placeholder:text-[#7f8ba0]"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search links"
                        aria-label="Search your links"
                    />
                </label>
            </div>

            <div className="hidden bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-[.08em] text-[#98a2b3] sm:block dark:bg-[#1d2735] dark:text-[#8492a7]">
                <div className="grid grid-cols-[minmax(190px,1fr)_minmax(230px,1.7fr)_90px_115px_72px] items-center gap-4 px-5 py-[15px]">
                    <span>Short URL</span>
                    <span>Destination</span>
                    <span>Clicks</span>
                    <span>Created</span>
                    <span />
                </div>
            </div>

            {loading ? (
                <div className="px-6 py-12 text-center text-sm text-[#98a2b3] dark:text-[#8492a7]">Loading links...</div>
            ) : loadError ? (
                <div className="px-6 py-12 text-center text-sm text-[#c92a2a] dark:text-[#ff9da8]">{loadError}</div>
            ) : filtered.length ? (
                filtered.map((link, index) => (
                    <div className="grid grid-cols-[minmax(190px,1fr)_minmax(230px,1.7fr)_90px_115px_72px] items-center gap-4 border-t border-[#edf0f4] px-5 py-[15px] text-[13px] transition-colors hover:bg-[#fafbfc] max-[900px]:grid-cols-[minmax(130px,1fr)_minmax(120px,1.2fr)_55px_76px_32px] max-[700px]:grid-cols-[minmax(0,1fr)_56px_32px] max-[700px]:gap-2 max-[700px]:px-3.5 max-[700px]:[&>:nth-child(2)]:hidden max-[700px]:[&>:nth-child(4)]:hidden dark:border-[#293445] dark:hover:bg-[#1d2735]" key={`${link.id}-${index}`}>
                        <a className="truncate font-semibold text-[#1769e0] hover:underline" href={shortUrl(link)} target="_blank" rel="noreferrer">
                            {shortUrl(link).replace(/^https?:\/\//, "")}
                        </a>
                        <span className="truncate text-[#667085] dark:text-[#a3afc2]">{link.destinationUrl}</span>
                        <span className="text-[#344054] dark:text-[#d2dae6]">{link.clicks}</span>
                        <span className="text-[#667085] dark:text-[#a3afc2]">{formatDate(link.createdAt)}</span>
                        <button
                            type="button"
                            className="grid h-8 w-8 place-items-center rounded-md text-[#98a2b3] transition-colors hover:bg-[#fff1f1] hover:text-[#c92a2a] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#8492a7] dark:hover:bg-[#3a222a] dark:hover:text-[#ff9da8]"
                            aria-label={`Delete ${link.slug}`}
                            onClick={() => setConfirmLink(link)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))
            ) : (
                <div className="px-6 py-12 text-center text-sm text-[#98a2b3] dark:text-[#8492a7]">No links yet. Create your first short link above.</div>
            )}

            <div className="border-t border-[#edf0f4] px-5 py-3 text-xs text-[#98a2b3] dark:border-[#293445] dark:text-[#8492a7]">
                Showing {filtered.length} of {links.length} links
            </div>
            {confirmLink && (
                <ConfirmDialog
                    title="Delete this short link?"
                    description={
                        <>
                            The link <span className="font-semibold text-[#344054] dark:text-[#d2dae6]">{shortUrl(confirmLink)}</span> will stop working. This action cannot be undone.
                        </>
                    }
                    confirmLabel="Delete link"
                    busyLabel="Deleting..."
                    busy={deleting}
                    variant="danger"
                    icon={Trash2}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmLink(null)}
                />
            )}
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
