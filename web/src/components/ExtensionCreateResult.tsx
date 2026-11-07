import React, { useState } from "react";
import { AlertCircle, Check, Clipboard, ExternalLink, LoaderCircle, X } from "lucide-react";
import type { LinkRecord } from "../types";
import { shortUrl } from "../lib/urlz";

export type ExtensionCreateStatus =
    | { state: "review"; destinationUrl: string }
    | { state: "creating"; destinationUrl: string }
    | { state: "created"; destinationUrl: string; link: LinkRecord }
    | { state: "failed"; destinationUrl?: string; error: string };

export function ExtensionCreateResult({
    status,
    onDismiss,
    onCreate,
    onRetry,
}: {
    status: ExtensionCreateStatus;
    onDismiss: () => void;
    onCreate: () => void;
    onRetry: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");
    const created = status.state === "created";
    const failed = status.state === "failed";
    const review = status.state === "review";
    const linkUrl = created ? shortUrl(status.link) : "";

    const copyLink = async () => {
        setCopyError("");
        try {
            await navigator.clipboard.writeText(linkUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch (error) {
            console.error("Unable to copy the extension-created short link.", error);
            setCopyError("Copy was blocked by the browser. Select the link to copy it manually.");
        }
    };

    return (
        <section
            aria-label="Extension link creation"
            aria-live={failed ? "assertive" : "polite"}
            className={`mb-6 rounded-xl border p-4 sm:p-5 ${failed
                    ? "border-[#f2c7c7] bg-[#fff7f7] dark:border-[#62353d] dark:bg-[#2b1d23]"
                    : "border-[#cde6d7] bg-[#f5fbf7] dark:border-[#295342] dark:bg-[#172a23]"
                }`}
            role={failed ? "alert" : review ? "region" : "status"}
        >
            <div
                className={
                    review
                        ? "grid grid-cols-[32px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 md:grid-cols-[32px_minmax(0,1fr)_auto]"
                        : "flex items-center gap-3"
                }
            >
                <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${review ? "self-center" : ""} ${failed
                            ? "bg-[#fde8e8] text-[#c92a2a] dark:bg-[#3a222a] dark:text-[#ff9da8]"
                            : "bg-[#e2f3e8] text-[#25804c] dark:bg-[#203c30] dark:text-[#75d59d]"
                        }`}
                >
                    {status.state === "creating" ? (
                        <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                    ) : failed ? (
                        <AlertCircle size={17} aria-hidden="true" />
                    ) : (
                        <Check size={17} aria-hidden="true" />
                    )}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-[#172033] dark:text-[#f1f5fb]">
                        {review
                            ? "Review this destination"
                            : status.state === "creating"
                                ? "Creating your short link…"
                                : failed
                                    ? "Couldn’t create the short link"
                                    : "Short link created"}
                    </h2>
                    {(review || status.state === "creating") && (
                        <a
                            className="mt-2 block w-fit max-w-full truncate rounded-lg border border-[#cde6d7] bg-white/80 px-3 py-2 text-sm font-semibold text-[#1769e0] transition-colors hover:border-[#9fd4b5] hover:bg-white focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#295342] dark:bg-[#111822] dark:text-[#9bc2ff] dark:hover:border-[#3c795d] dark:hover:bg-[#182231]"
                            href={status.destinationUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={status.destinationUrl}
                        >
                            {status.destinationUrl}
                        </a>
                    )}
                    {failed && (
                        <p className="mt-1 text-sm leading-5 text-[#8f2929] dark:text-[#ffb4bc]">
                            {status.error}
                        </p>
                    )}
                    {created && (
                        <>
                            <p className="mt-1 truncate text-sm text-[#667085] dark:text-[#a3afc2]">
                                {status.destinationUrl}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <a
                                    className="max-w-full truncate rounded-md text-sm font-semibold text-[#1769e0] hover:underline focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#82b2ff]"
                                    href={linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {linkUrl}
                                </a>
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#cde6d7] bg-white px-2.5 text-xs font-semibold text-[#344054] transition-colors hover:bg-[#edf8f1] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#295342] dark:bg-[#1b2432] dark:text-[#d2dae6] dark:hover:bg-[#203c30]"
                                >
                                    {copied ? <Check size={14} /> : <Clipboard size={14} />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                                <a
                                    href={linkUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#667085] transition-colors hover:bg-white focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#a3afc2] dark:hover:bg-[#1b2432]"
                                >
                                    Open <ExternalLink size={13} aria-hidden="true" />
                                </a>
                            </div>
                            {copyError && (
                                <p className="mt-2 text-xs leading-5 text-[#8f2929] dark:text-[#ffb4bc]" role="alert">
                                    {copyError}
                                </p>
                            )}
                        </>
                    )}
                </div>
                {review && (
                    <div className="col-span-2 grid grid-cols-1 gap-2 md:col-span-1 md:flex md:items-center md:justify-end">
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="min-h-10 w-full rounded-lg px-3 text-sm font-semibold text-[#667085] transition-colors hover:bg-white focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#a3afc2] dark:hover:bg-[#1b2432] md:min-h-9 md:w-auto md:px-2.5 md:text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onCreate}
                            className="min-h-10 w-full rounded-lg bg-[#1769e0] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f59c5] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 md:min-h-9 md:w-auto md:text-xs"
                        >
                            Create link
                        </button>
                    </div>
                )}
                {status.state !== "creating" && !review && (
                    <div className="flex shrink-0 items-center gap-1">
                        {failed && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="rounded-md px-2 py-1 text-xs font-semibold text-[#1769e0] hover:bg-white focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#82b2ff] dark:hover:bg-[#1b2432]"
                            >
                                Retry
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="grid h-7 w-7 place-items-center rounded-md text-[#667085] transition-colors hover:bg-white focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#a3afc2] dark:hover:bg-[#1b2432]"
                            aria-label="Dismiss extension link result"
                        >
                            <X size={15} aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
