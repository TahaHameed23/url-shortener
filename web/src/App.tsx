import React, { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { Inspect } from "./components/Inspect";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { api } from "./lib/urlz";
import type { AuthMode, LinkListResponse, LinkRecord, User, View } from "./types";

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
    const [mobileNav, setMobileNav] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        setMobileNav(false);
        setUser(authenticatedUser);
    };

    if (loading) return <LoadingScreen />;
    if (!user) return <AuthScreen mode={authMode} onModeChange={handleAuthModeChange} onAuthenticated={handleAuthenticated} darkMode={darkMode} onToggleTheme={toggleDarkMode} />;

    const navigate = (next: View) => {
        setView(next);
        setMobileNav(false);
    };

    const logout = async () => {
        try {
            await api("/api/v1/auth/logout", { method: "POST" });
        } finally {
            setMobileNav(false);
            setUser(null);
            setAuthMode("login");
            setView("dashboard");
        }
    };

    return (
        <div className={`grid min-h-screen bg-[#f7f8fa] transition-[grid-template-columns,background-color] duration-200 ease-out max-[700px]:block dark:bg-[#10151e] ${sidebarCollapsed ? "grid-cols-[76px_minmax(0,1fr)]" : "grid-cols-[236px_minmax(0,1fr)]"} max-[900px]:grid-cols-[72px_minmax(0,1fr)]`}>
            <Sidebar
                view={view}
                mobileOpen={mobileNav}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((current) => !current)}
                onCloseMobile={() => setMobileNav(false)}
                onNavigate={navigate}
                onLogout={logout}
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
                        />
                    )}
                    {view === "inspect" && <Inspect />}
                    {view === "settings" && <SettingsView user={user} />}
                </div>
            </main>
        </div>
    );
}
