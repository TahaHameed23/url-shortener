import React, { useEffect, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { Inspect } from "./components/Inspect";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { api, loadRecent, saveRecent } from "./lib/urlz";
import { AuthMode, LinkRecord, User, View } from "./types";

function LoadingScreen() {
    return (
        <div className="grid min-h-screen place-items-center bg-[#f7f8fa]">
            <div className="flex items-center gap-2 text-sm text-[#667085]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1769e0]" />
                Loading your workspace
            </div>
        </div>
    );
}

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [recent, setRecent] = useState<LinkRecord[]>(loadRecent);
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [view, setView] = useState<View>("dashboard");
    const [mobileNav, setMobileNav] = useState(false);

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
        if (typeof window === "undefined") return;

        const syncFromPath = () => {
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

    const addRecent = (link: LinkRecord) => {
        const next = [link, ...recent.filter((entry) => entry.shortUrl !== link.shortUrl)];
        setRecent(next);
        saveRecent(next);
    };

    if (loading) return <LoadingScreen />;
    if (!user) return <AuthScreen mode={authMode} onModeChange={handleAuthModeChange} onAuthenticated={setUser} />;

    const navigate = (next: View) => {
        setView(next);
        setMobileNav(false);
    };

    const logout = async () => {
        try {
            await api("/api/v1/auth/logout", { method: "POST" });
        } finally {
            setUser(null);
            setAuthMode("login");
            setView("dashboard");
        }
    };

    return (
        <div className="app-grid bg-[#f7f8fa]">
            <Sidebar view={view} mobileOpen={mobileNav} onNavigate={navigate} onLogout={logout} />
            <main className="content">
                <header className="flex h-[74px] items-center justify-between border-b border-[#e5e7eb] bg-white px-5 sm:px-8">
                    <button
                        className="rounded-md p-2 text-[#667085] hover:bg-[#f2f4f7] md:hidden"
                        onClick={() => setMobileNav(!mobileNav)}
                        aria-label="Toggle navigation"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                        </svg>
                    </button>
                    <div className="hidden items-center gap-2 text-sm text-[#667085] md:flex">
                        <span>Workspace</span>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
                            <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-[#667085] sm:inline">{user.email}</span>
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e7f0ff] text-sm font-bold text-[#1769e0]">
                            {user.email[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="page-width py-8 sm:py-10">
                    {view === "dashboard" && (
                        <Dashboard user={user} recent={recent} onAddRecent={addRecent} onInspect={() => navigate("inspect")} />
                    )}
                    {view === "inspect" && <Inspect recent={recent} onAddRecent={addRecent} />}
                    {view === "settings" && <SettingsView user={user} />}
                </div>
            </main>
        </div>
    );
}
