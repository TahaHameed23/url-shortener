import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LogOut, Menu } from "lucide-react";
import { Brand } from "./components/Brand";
import { AuthScreen } from "./components/AuthScreen";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Dashboard } from "./components/Dashboard";
import { FeedbackToast } from "./components/FeedbackToast";
import type { ToastNoticeData } from "./components/FeedbackToast";
import { Inspect } from "./components/Inspect";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { api } from "./lib/urlz";
import type { AuthMode, LinkListResponse, LinkRecord, User, View } from "./types";

const appPaths = new Set(["/", "/login", "/register", "/inspect", "/settings"]);

function isAppPath(pathname: string) {
    const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    return appPaths.has(normalizedPath);
}

function LoadingScreen() {
    return (
        <div className="grid min-h-screen place-items-center bg-[#f7f8fa] dark:bg-[#10151e]">
            <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#a3afc2]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1769e0]" />
                Loading your workspace
            </div>
        </div>
    );
}

function NotFoundPage() {
    return (
        <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f8fa] px-6 py-12 dark:bg-[#10151e]">
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#dceaff] blur-3xl dark:bg-[#172b48]" />
            <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#e7e9ff] blur-3xl dark:bg-[#282341]" />
            <section
                className="relative w-full max-w-lg text-center"
                aria-labelledby="not-found-title"
            >
                <div className="mb-12 flex justify-center">
                    <Brand />
                </div>
                <p className="font-display text-[clamp(7rem,25vw,12rem)] font-bold leading-[0.8] tracking-[-0.1em] text-[#1769e0]">
                    404
                </p>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#1769e0]">
                    Page not found
                </p>
                <h1
                    id="not-found-title"
                    className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-[#172033] sm:text-4xl dark:text-[#f1f5fb]"
                >
                    This link has gone missing.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#667085] dark:text-[#a3afc2]">
                    The page may have moved, or the address might be mistyped. Let’s get you back to your links.
                </p>
                <a
                    href="/"
                    className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1769e0] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f59c5] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to URLZ
                </a>
                <p className="mt-12 text-xs font-medium tracking-wide text-[#98a2b3] dark:text-[#8492a7]">
                    URLZ <span aria-hidden="true">·</span> Simple link management
                </p>
            </section>
        </main>
    );
}

export default function App() {
    const [darkMode, setDarkMode] = useState(() => {
        try {
            const savedDarkMode = window.localStorage.getItem("urlz-theme") === "dark";
            document.documentElement.classList.toggle("dark", savedDarkMode);
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", savedDarkMode ? "#10151e" : "#f7f8fa");
            return savedDarkMode;
        } catch (error) {
            console.error("Unable to read the saved theme preference.", error);
            return false;
        }
    });
    const [user, setUser] = useState<User | null>(null);
    const [links, setLinks] = useState<LinkRecord[]>([]);
    const [totalLinks, setTotalLinks] = useState(0);
    const [linksLoading, setLinksLoading] = useState(true);
    const [linksError, setLinksError] = useState("");
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [view, setView] = useState<View>("dashboard");
    const [notFound, setNotFound] = useState(false);
    const [mobileNav, setMobileNav] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [logoutBusy, setLogoutBusy] = useState(false);
    const [notice, setNotice] = useState<ToastNoticeData | null>(null);
    const dismissNotice = useCallback(() => setNotice(null), []);

    useEffect(() => {
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", darkMode ? "#10151e" : "#f7f8fa");

        try {
            window.localStorage.setItem("urlz-theme", darkMode ? "dark" : "light");
        } catch (error) {
            console.error("Unable to save the theme preference.", error);
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        const nextDarkMode = !darkMode;
        document.documentElement.classList.toggle("dark", nextDarkMode);
        setDarkMode(nextDarkMode);
    };

    const handleAuthModeChange = (nextMode: AuthMode) => {
        setAuthMode(nextMode);
    };

    useEffect(() => {
        api<{ user: User }>("/api/v1/auth/me")
            .then((result) => setUser(result.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user) {
            setLinks([]);
            setTotalLinks(0);
            setLinksLoading(false);
            return;
        }

        setLinksLoading(true);
        setLinksError("");
        api<LinkListResponse>("/api/v1/links")
            .then((result) => {
                setLinks(result.links);
                setTotalLinks(result.total);
            })
            .catch((error) => {
                setLinksError(error instanceof Error ? error.message : "Unable to load links.");
            })
            .finally(() => setLinksLoading(false));
    }, [user]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const syncFromPath = () => {
            setMobileNav(false);
            const path = window.location.pathname;
            if (!isAppPath(path)) {
                setNotFound(true);
                return;
            }
            setNotFound(false);
            const segments = path.split("/").filter(Boolean);

            if (!user) {
                const nextMode: AuthMode = segments[0] === "register" ? "register" : "login";
                setAuthMode((current) => (current === nextMode ? current : nextMode));
                return;
            }

            if (segments[0] === "login" || segments[0] === "register") {
                setView("dashboard");
                if (window.location.pathname !== "/") {
                    window.history.pushState({}, "", "/");
                }
                return;
            }

            const nextView: View =
                segments[0] === "inspect" ? "inspect" : segments[0] === "settings" ? "settings" : "dashboard";

            setView((current) => (current === nextView ? current : nextView));
        };

        syncFromPath();
        window.addEventListener("popstate", syncFromPath);
        return () => window.removeEventListener("popstate", syncFromPath);
    }, [user]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!isAppPath(window.location.pathname)) return;

        const nextPath = !user
            ? authMode === "register"
                ? "/register"
                : "/login"
            : view === "dashboard"
                ? "/"
                : `/${view}`;

        if (window.location.pathname !== nextPath) {
            window.history.pushState({}, "", nextPath);
        }
    }, [user, authMode, view]);

    const addLink = useCallback((link: LinkRecord) => {
        setLinks((current) => [
            link,
            ...current.filter((entry) => entry.slug !== link.slug),
        ]);
        setTotalLinks((current) => current + 1);
    }, []);

    const removeLink = useCallback((slug: string) => {
        setLinks((current) => current.filter((entry) => entry.slug !== slug));
        setTotalLinks((current) => Math.max(0, current - 1));
    }, []);

    const handleAuthenticated = (authenticatedUser: User) => {
        setLogoutDialogOpen(false);
        setMobileNav(false);
        setUser(authenticatedUser);
    };

    if (notFound) return <NotFoundPage />;
    if (loading) return <LoadingScreen />;
    if (!user) {
        return (
            <>
                <AuthScreen mode={authMode} onModeChange={handleAuthModeChange} onAuthenticated={handleAuthenticated} darkMode={darkMode} onToggleTheme={toggleDarkMode} />
                <FeedbackToast notice={notice} onDismiss={dismissNotice} />
            </>
        );
    }

    const navigate = (next: View) => {
        setView(next);
        setMobileNav(false);
    };

    const openLogoutConfirmation = () => {
        setMobileNav(false);
        setLogoutDialogOpen(true);
    };

    const logout = async () => {
        setLogoutBusy(true);
        let failed = false;
        try {
            await api("/api/v1/auth/logout", { method: "POST" });
        } catch {
            failed = true;
        } finally {
            setLogoutDialogOpen(false);
            setMobileNav(false);
            setLogoutBusy(false);
            setUser(null);
            setAuthMode("login");
            setView("dashboard");
        }
        setNotice(
            failed
                ? { message: "You were signed out here, but the server could not confirm logout.", type: "error" }
                : { message: "You’ve been logged out.", type: "success" },
        );
    };

    return (
        <>
        <div className={`grid min-h-screen bg-[#f7f8fa] transition-[grid-template-columns,background-color] duration-200 ease-out max-[700px]:block dark:bg-[#10151e] ${sidebarCollapsed ? "grid-cols-[76px_minmax(0,1fr)]" : "grid-cols-[236px_minmax(0,1fr)]"} max-[900px]:grid-cols-[72px_minmax(0,1fr)]`}>
            <Sidebar
                view={view}
                mobileOpen={mobileNav}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((current) => !current)}
                onCloseMobile={() => setMobileNav(false)}
                onNavigate={navigate}
                onLogout={openLogoutConfirmation}
                darkMode={darkMode}
                onToggleTheme={toggleDarkMode}
            />
            <main className="min-w-0">
                <header className="flex h-[74px] items-center justify-between border-b border-[#e5e7eb] bg-white px-5 sm:px-8 dark:border-[#293445] dark:bg-[#171e29]">
                    <button
                        className="hidden h-9 w-9 place-items-center rounded-lg border-0 bg-transparent text-[#667085] transition-colors hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[700px]:grid dark:text-[#a3afc2] dark:hover:bg-[#253145] dark:hover:text-[#82b2ff]"
                        onClick={() => setMobileNav(!mobileNav)}
                        aria-expanded={mobileNav}
                        aria-controls="primary-navigation"
                        aria-label={mobileNav ? "Close navigation" : "Open navigation"}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="hidden items-center gap-2 text-sm text-[#667085] md:flex dark:text-[#a3afc2]">
                        <span>Workspace</span>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
                            <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-[#667085] sm:inline dark:text-[#a3afc2]">{user.name || user.email}</span>
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e7f0ff] text-sm font-bold text-[#1769e0] dark:bg-[#203657] dark:text-[#82b2ff]">
                            {(user.name || user.email)[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="mx-auto w-[min(1120px,calc(100%-64px))] py-8 sm:py-10 max-[700px]:w-[min(100%-32px,620px)]">
                    {view === "dashboard" && (
                        <Dashboard
                            user={user}
                            links={links}
                            totalLinks={totalLinks}
                            loading={linksLoading}
                            loadError={linksError}
                            onAddLink={addLink}
                            onRemoveLink={removeLink}
                            onInspect={() => navigate("inspect")}
                            onNotify={setNotice}
                        />
                    )}
                    {view === "inspect" && <Inspect />}
                    {view === "settings" && <SettingsView user={user} />}
                </div>
            </main>
        </div>
        <FeedbackToast notice={notice} onDismiss={dismissNotice} />
        {logoutDialogOpen && (
            <ConfirmDialog
                title="Log out of URLZ?"
                description="You’ll need to sign in again to manage your links."
                confirmLabel="Log out"
                busyLabel="Logging out..."
                busy={logoutBusy}
                icon={LogOut}
                onConfirm={logout}
                onCancel={() => setLogoutDialogOpen(false)}
            />
        )}
        </>
    );
}
