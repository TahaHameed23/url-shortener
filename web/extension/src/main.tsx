import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    ArrowUpRight,
    Check,
    ChevronLeft,
    Link2,
    LockKeyhole,
    Settings2,
    WandSparkles,
} from "lucide-react";
import { DEFAULT_URLZ_ORIGIN } from "./config";
import "./styles.css";

const ORIGIN_KEY = "urlzOrigin";

function getOrigin(value: string): string | null {
    try {
        const url = new URL(value.trim());
        const localHttp =
            url.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

        if (
            (url.protocol !== "https:" && !localHttp) ||
            url.username ||
            url.password ||
            (url.pathname !== "/" && url.pathname !== "")
        ) {
            return null;
        }

        return url.origin;
    } catch {
        return null;
    }
}

function isShortenableUrl(value: string): boolean {
    try {
        const url = new URL(value.trim());
        return (
            (url.protocol === "https:" || url.protocol === "http:") &&
            !url.username &&
            !url.password
        );
    } catch {
        return false;
    }
}

function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                <Link2 size={19} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div>
                <p className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">
                    URLZ
                </p>
                {!compact && (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Quick short links
                    </p>
                )}
            </div>
        </div>
    );
}

function Popup() {
    const [url, setUrl] = useState("");
    const [origin, setOrigin] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);

    useEffect(() => {
        let active = true;
        Promise.all([
            chrome.storage.local.get(ORIGIN_KEY),
            chrome.tabs.query({ active: true, currentWindow: true }),
        ])
            .then(([settings, tabs]) => {
                if (!active) return;
                const savedOrigin =
                    typeof settings[ORIGIN_KEY] === "string"
                        ? getOrigin(settings[ORIGIN_KEY])
                        : null;
                setOrigin(savedOrigin ?? DEFAULT_URLZ_ORIGIN);

                const activeUrl = tabs[0]?.url;
                if (activeUrl && isShortenableUrl(activeUrl)) {
                    setUrl(activeUrl);
                }
            })
            .catch(() => {
                if (active) {
                    setError("Could not read the active tab or extension settings.");
                }
            })
            .finally(() => {
                if (active) setBusy(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const openSettings = async () => {
        try {
            await chrome.runtime.openOptionsPage();
        } catch {
            setError("Could not open URLZ settings. Try again from the extension menu.");
        }
    };

    const createShortLink = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        const appOrigin = getOrigin(origin);
        if (!appOrigin) {
            setError("Set a valid URLZ website in settings before continuing.");
            return;
        }
        if (!isShortenableUrl(url)) {
            setError("Enter a valid http or https URL without a username or password.");
            return;
        }

        setBusy(true);
        try {
            const target = new URL("/", appOrigin);
            target.hash = new URLSearchParams({
                extensionCreate: url.trim(),
            }).toString();
            await chrome.tabs.create({ url: target.toString() });
            window.close();
        } catch {
            setError("Could not open URLZ. Check your connection and try again.");
            setBusy(false);
        }
    };

    return (
        <main className="w-[360px] bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <header className="mb-5 flex items-center justify-between">
                <Brand />
                <button
                    type="button"
                    onClick={openSettings}
                    className="icon-button"
                    aria-label="Open URLZ extension settings"
                    title="Settings"
                >
                    <Settings2 size={17} aria-hidden="true" />
                </button>
            </header>

            {!origin ? (
                <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-3 grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <WandSparkles size={20} aria-hidden="true" />
                    </span>
                    <h1 className="text-base font-bold tracking-tight">
                        Connect your URLZ site
                    </h1>
                    <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-400">
                        Set your URLZ website once to create links from any tab.
                    </p>
                    {error && (
                        <p className="mt-2 text-xs leading-5 text-red-700 dark:text-red-300" role="alert">
                            {error}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={openSettings}
                        className="primary-button mt-4 w-full"
                    >
                        Set up URLZ <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                </section>
            ) : (
                <>
                    <section className="mb-4">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                            Quick create
                        </p>
                        <h1 className="text-xl font-bold tracking-tight">
                            Shorten a URL
                        </h1>
                        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                            Check the destination, then review and confirm it in URLZ.
                        </p>
                    </section>

                    <form
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        onSubmit={createShortLink}
                    >
                        <label
                            className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                            htmlFor="destination-url"
                        >
                            Destination URL
                        </label>
                        <textarea
                            id="destination-url"
                            className="min-h-[92px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            placeholder="https://example.com/article"
                            autoFocus
                            required
                        />

                        {error && (
                            <p className="mt-2 text-xs leading-5 text-red-700 dark:text-red-300" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={busy || !url.trim()}
                            className="primary-button mt-3 w-full"
                        >
                            {busy ? "Opening URLZ…" : "Review & create link"}
                            <ArrowUpRight size={16} aria-hidden="true" />
                        </button>
                    </form>

                    <div className="mt-4 flex items-start gap-2.5 px-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                        <LockKeyhole className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
                        <p>
                            Your link is created on{" "}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {origin}
                            </span>
                            . Sign in there if needed; this extension never sees your password.
                        </p>
                    </div>
                </>
            )}

            <footer className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Only the active tab URL is read</span>
                <span className="inline-flex items-center gap-1">
                    <Check size={12} aria-hidden="true" /> Private by design
                </span>
            </footer>
        </main>
    );
}

function Options() {
    const [origin, setOrigin] = useState(DEFAULT_URLZ_ORIGIN);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chrome.storage.local
            .get(ORIGIN_KEY)
            .then((settings) => {
                const savedOrigin = settings[ORIGIN_KEY];
                if (typeof savedOrigin === "string") {
                    setOrigin(getOrigin(savedOrigin) ?? DEFAULT_URLZ_ORIGIN);
                }
            })
            .catch(() => setError("Could not load extension settings."))
            .finally(() => setLoading(false));
    }, []);

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaved(false);
        setError("");
        const normalizedOrigin = getOrigin(origin);
        if (!normalizedOrigin) {
            setError(
                "Enter a URLZ site origin such as https://urlz.example. Only localhost may use http.",
            );
            return;
        }

        try {
            await chrome.storage.local.set({ [ORIGIN_KEY]: normalizedOrigin });
            setOrigin(normalizedOrigin);
            setSaved(true);
        } catch {
            setError("Could not save your URLZ site. Check browser storage and try again.");
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8">
            <div className="mx-auto max-w-xl">
                <button
                    type="button"
                    className="mb-8 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => window.close()}
                >
                    <ChevronLeft size={17} aria-hidden="true" /> Back
                </button>

                <header className="mb-7">
                    <Brand />
                    <h1 className="mt-8 text-2xl font-bold tracking-tight">
                        Extension settings
                    </h1>
                    <p className="mt-2 max-w-prose text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Connect the extension to the URLZ website where you manage your links.
                    </p>
                </header>

                <form
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
                    onSubmit={save}
                >
                    <label
                        htmlFor="urlz-origin"
                        className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                        URLZ website
                    </label>
                    <p className="mb-2 mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Defaults to {DEFAULT_URLZ_ORIGIN}. Change this only for a self-hosted URLZ site.
                    </p>
                    <input
                        id="urlz-origin"
                        type="url"
                        required
                        autoComplete="url"
                        placeholder="https://urlz.example"
                        value={origin}
                        onChange={(event) => {
                            setOrigin(event.target.value);
                            setSaved(false);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                    />
                    {error && (
                        <p className="mt-2 text-sm leading-5 text-red-700 dark:text-red-300" role="alert">
                            {error}
                        </p>
                    )}
                    {saved && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status">
                            <Check size={15} aria-hidden="true" /> URLZ website saved
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="primary-button mt-5 w-full sm:w-auto"
                    >
                        Save settings
                    </button>
                </form>

                <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            <LockKeyhole size={17} aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold">Your account stays protected</h2>
                            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                                The extension reads the current tab only after you open it. It then opens your URLZ site to create the link using your existing sign-in. Passwords and session tokens are never collected or stored here.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

const isOptionsPage = window.location.pathname.endsWith("/options.html");
createRoot(document.getElementById("root")!).render(
    <React.StrictMode>{isOptionsPage ? <Options /> : <Popup />}</React.StrictMode>,
);
