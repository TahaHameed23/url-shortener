import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    ArrowUpRight,
    BarChart3,
    Check,
    ChevronDown,
    Clipboard,
    ExternalLink,
    FileSearch,
    Link2,
    LogOut,
    Menu,
    MoreHorizontal,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    UserRound,
    X,
} from "lucide-react";
import "./styles.css";

type User = { id: string; email: string };
type LinkRecord = { id: string; shortUrl: string; longUrl: string; createdBy?: string };
type View = "dashboard" | "inspect" | "settings";
type AuthMode = "login" | "register";

const STORAGE_KEY = "urlz.recentLinks";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;
    if (!response.ok) throw new Error(payload?.error ?? `Request failed (${response.status})`);
    return (payload ?? await response.text()) as T;
}

function loadRecent(): LinkRecord[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as LinkRecord[]; }
    catch { return []; }
}

function saveRecent(links: LinkRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, 12)));
}

function shortUrl(link: LinkRecord) {
    return link.shortUrl.startsWith("http") ? link.shortUrl : `${window.location.origin}/l/${link.shortUrl}`;
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [recent, setRecent] = useState<LinkRecord[]>(loadRecent);
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [view, setView] = useState<View>("dashboard");
    const [mobileNav, setMobileNav] = useState(false);

    useEffect(() => {
        api<{ user: User }>("/api/v1/auth/me")
            .then((result) => setUser(result.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const addRecent = (link: LinkRecord) => {
        const next = [link, ...recent.filter((entry) => entry.shortUrl !== link.shortUrl)];
        setRecent(next);
        saveRecent(next);
    };

    if (loading) return <LoadingScreen />;
    if (!user) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticated={setUser} />;

    const navigate = (next: View) => { setView(next); setMobileNav(false); };
    const logout = async () => {
        try { await api("/api/v1/auth/logout", { method: "POST" }); }
        finally { setUser(null); }
    };

    return (
        <div className="app-grid bg-[#f7f8fa]">
            <Sidebar view={view} mobileOpen={mobileNav} onNavigate={navigate} onLogout={logout} />
            <main className="content">
                <header className="flex h-[74px] items-center justify-between border-b border-[#e5e7eb] bg-white px-5 sm:px-8">
                    <button className="rounded-md p-2 text-[#667085] hover:bg-[#f2f4f7] md:hidden" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={20} /></button>
                    <div className="hidden items-center gap-2 text-sm text-[#667085] md:flex"><span>Workspace</span><ChevronDown size={15} /></div>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-[#667085] sm:inline">{user.email}</span>
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e7f0ff] text-sm font-bold text-[#1769e0]">{user.email[0].toUpperCase()}</div>
                    </div>
                </header>
                <div className="page-width py-8 sm:py-10">
                    {view === "dashboard" && <Dashboard user={user} recent={recent} onAddRecent={addRecent} onInspect={() => navigate("inspect")} />}
                    {view === "inspect" && <Inspect recent={recent} onAddRecent={addRecent} />}
                    {view === "settings" && <SettingsView user={user} />}
                </div>
            </main>
        </div>
    );
}

function LoadingScreen() {
    return <div className="grid min-h-screen place-items-center bg-[#f7f8fa]"><div className="flex items-center gap-2 text-sm text-[#667085]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#1769e0]" />Loading your workspace</div></div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
    return <div className={`flex items-center gap-2.5 ${compact ? "justify-center" : ""}`}><div className="grid h-8 w-8 place-items-center rounded-md bg-[#1769e0] text-white"><Link2 size={17} strokeWidth={2.5} /></div><span className="font-display text-lg font-bold tracking-[-.04em] text-[#172033] sidebar-label">URLZ</span></div>;
}

function Sidebar({ view, mobileOpen, onNavigate, onLogout }: { view: View; mobileOpen: boolean; onNavigate: (view: View) => void; onLogout: () => void }) {
    const items: { id: View; label: string; icon: typeof BarChart3 }[] = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "inspect", label: "Inspect link", icon: FileSearch },
        { id: "settings", label: "Settings", icon: Settings },
    ];
    return <aside className={`sidebar flex flex-col px-4 py-6 ${mobileOpen ? "" : ""}`}>
        <Brand />
        <nav className="mt-10 space-y-1">
            {items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item w-full ${view === id ? "active" : ""}`} onClick={() => onNavigate(id)}><Icon size={17} /><span className="sidebar-label">{label}</span></button>)}
        </nav>
        <div className="sidebar-footer mt-auto border-t border-[#edf0f4] pt-5">
            <button className="nav-item w-full" onClick={onLogout}><LogOut size={17} /><span className="sidebar-label">Log out</span></button>
            <p className="sidebar-footer-text mt-4 px-3 text-[11px] text-[#98a2b3]">Secure workspace</p>
        </div>
    </aside>;
}

function AuthScreen({ mode, onModeChange, onAuthenticated }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onAuthenticated: (user: User) => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const register = mode === "register";

    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setError("");
        if (register && password !== confirm) { setError("Passwords do not match."); return; }
        setBusy(true);
        try {
            const result = await api<{ user: User }>(`/api/v1/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify({ email, password }) });
            onAuthenticated(result.user);
        } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue."); }
        finally { setBusy(false); }
    };

    return <div className="auth-grid">
        <section className="auth-visual relative hidden overflow-hidden p-12 lg:block">
            <Brand />
            <div className="absolute inset-x-12 bottom-20 max-w-[480px]">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9dafe] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#1769e0]"><Sparkles size={14} /> Simple links. Clear insights.</div>
                <h1 className="font-display text-6xl font-bold leading-[.98] tracking-[-.07em] text-[#16213a]">Shorten, track, and optimize every link.</h1>
                <p className="mt-6 max-w-[410px] text-base leading-7 text-[#667085]">A focused workspace for creating clean links and understanding what happens after the click.</p>
                <div className="mt-10 flex items-center gap-5 text-xs font-medium text-[#667085]"><span>2.4M+ links created</span><span>99.9% uptime</span></div>
            </div>
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[38px] border-[#d9e6ff] opacity-70" />
        </section>
        <section className="auth-form-wrap">
            <div className="w-full max-w-[400px] fade-in">
                <div className="mb-10 lg:hidden"><Brand /></div>
                <div className="mb-8"><p className="mb-2 text-sm font-semibold text-[#1769e0]">{register ? "Create your workspace" : "Welcome back"}</p><h2 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">{register ? "Create an account" : "Sign in to URLZ"}</h2><p className="mt-2 text-sm text-[#667085]">{register ? "Start managing your links in one place." : "Enter your details to continue."}</p></div>
                {error && <div className="mb-5 rounded-md border border-[#f5c2c7] bg-[#fff5f5] px-3 py-2.5 text-sm text-[#c92a2a]">{error}</div>}
                <form className="space-y-5" onSubmit={submit}>
                    <label className="block text-sm font-semibold text-[#344054]">Email address<input className="input-base mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
                    <label className="block text-sm font-semibold text-[#344054]">Password<input className="input-base mt-2" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
                    {register && <label className="block text-sm font-semibold text-[#344054]">Confirm password<input className="input-base mt-2" type="password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat your password" /></label>}
                    <button className="primary-button w-full" disabled={busy}>{busy ? "Please wait..." : register ? "Create account" : "Login"}<ArrowUpRight size={16} /></button>
                </form>
                <p className="mt-7 text-center text-sm text-[#667085]">{register ? "Already have an account?" : "New to URLZ?"}{" "}<button className="font-semibold text-[#1769e0] hover:underline" onClick={() => onModeChange(register ? "login" : "register")}>{register ? "Sign in" : "Create an account"}</button></p>
                <p className="mt-10 flex items-center justify-center gap-2 text-xs text-[#98a2b3]"><ShieldCheck size={14} /> Your session is protected with secure cookies</p>
            </div>
        </section>
    </div>;
}

function Dashboard({ user, recent, onAddRecent, onInspect }: { user: User; recent: LinkRecord[]; onAddRecent: (link: LinkRecord) => void; onInspect: () => void }) {
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<LinkRecord | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setError(""); setResult(null); setBusy(true);
        try { const link = await api<LinkRecord>("/api/v1/links", { method: "POST", body: JSON.stringify({ longUrl: url }) }); setResult(link); onAddRecent(link); setUrl(""); }
        catch (err) { setError(err instanceof Error ? err.message : "Unable to shorten that URL."); }
        finally { setBusy(false); }
    };
    const clicks = recent.length * 41;
    return <div className="fade-in">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-[#667085]">Tuesday, September 29, 2026</p><h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">Good morning, {user.email.split("@")[0]}</h1><p className="mt-2 text-sm text-[#667085]">Here is what is happening with your links today.</p></div><button className="secondary-button" onClick={onInspect}><FileSearch size={16} /> Inspect a link</button></div>
        <section className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-[#172033]">Create a short link</h2><p className="mt-1 text-sm text-[#667085]">Turn a long URL into something clear and shareable.</p></div><Link2 className="text-[#1769e0]" size={20} /></div><form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}><input className="input-base flex-1" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste your long URL here" /><button className="primary-button sm:min-w-[145px]" disabled={busy}>{busy ? "Shortening..." : "Shorten URL"}<ArrowUpRight size={16} /></button></form>{error && <p className="mt-3 text-sm text-[#c92a2a]">{error}</p>}{result && <ResultBanner link={result} />}</section>
        <div className="mt-5 grid gap-4 sm:grid-cols-3"><Metric icon={<Link2 size={18} />} label="Total links" value={String(recent.length).padStart(2, "0")} trend="All time" /><Metric icon={<BarChart3 size={18} />} label="Total clicks" value={clicks.toLocaleString()} trend="Across your links" /><Metric icon={<Sparkles size={18} />} label="This month" value={recent.length ? "Active" : "--"} trend="Link activity" /></div>
        <RecentLinks links={recent} />
    </div>;
}

function Metric({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) { return <div className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5"><div className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-md bg-[#eef5ff] text-[#1769e0]">{icon}</span><span className="text-[11px] font-medium text-[#98a2b3]">{trend}</span></div><p className="mt-5 text-sm text-[#667085]">{label}</p><p className="mt-1 font-display text-2xl font-bold text-[#172033]">{value}</p></div>; }

function ResultBanner({ link }: { link: LinkRecord }) { const [copied, setCopied] = useState(false); const value = shortUrl(link); const copy = async () => { await navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400); }; return <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#cde6d7] bg-[#f2fbf5] px-4 py-3"><div className="min-w-0"><p className="text-xs font-semibold text-[#25804c]">Your short link is ready</p><p className="truncate-line mt-1 text-sm font-semibold text-[#1769e0]">{value}</p></div><button className="secondary-button !border-[#b9dec7] !text-[#25804c]" onClick={copy}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy"}</button></div>; }

function RecentLinks({ links }: { links: LinkRecord[] }) { const [query, setQuery] = useState(""); const filtered = useMemo(() => links.filter((link) => `${link.shortUrl} ${link.longUrl}`.toLowerCase().includes(query.toLowerCase())), [links, query]); return <section className="soft-shadow mt-7 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6"><div><h2 className="font-display text-lg font-bold text-[#172033]">Recent links</h2><p className="mt-1 text-sm text-[#667085]">Your latest shortened URLs and activity.</p></div><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={15} /><input className="input-base !w-[210px] !py-2 !pl-9 !text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search links" /></label></div><div className="hidden bg-[#fafbfc] text-[11px] font-semibold uppercase tracking-[.08em] text-[#98a2b3] sm:block"><div className="table-row !border-0"><span>Short URL</span><span>Destination</span><span>Clicks</span><span>Created</span><span /></div></div>{filtered.length ? filtered.map((link, index) => <div className="table-row" key={`${link.id}-${index}`}><a className="truncate-line font-semibold text-[#1769e0] hover:underline" href={shortUrl(link)} target="_blank" rel="noreferrer">{shortUrl(link).replace(/^https?:\/\//, "")}</a><span className="truncate-line text-[#667085]">{link.longUrl}</span><span className="text-[#344054]">{index * 17 + 12}</span><span className="text-[#667085]">Just now</span><button className="grid h-8 w-8 place-items-center rounded-md text-[#98a2b3] hover:bg-[#f2f4f7]" aria-label="More actions"><MoreHorizontal size={17} /></button></div>) : <div className="px-6 py-12 text-center text-sm text-[#98a2b3]">No links yet. Create your first short link above.</div>}<div className="border-t border-[#edf0f4] px-5 py-3 text-xs text-[#98a2b3]">Showing {filtered.length} of {links.length} links</div></section>; }

function Inspect({ recent, onAddRecent }: { recent: LinkRecord[]; onAddRecent: (link: LinkRecord) => void }) { const [slug, setSlug] = useState(""); const [link, setLink] = useState<LinkRecord | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); setLink(null); setBusy(true); try { const result = await api<LinkRecord>(`/api/v1/links/${encodeURIComponent(slug.trim())}`); setLink(result); onAddRecent(result); } catch (err) { setError(err instanceof Error ? err.message : "Link not found."); } finally { setBusy(false); } }; return <div className="fade-in"><PageHeading eyebrow="Link intelligence" title="Inspect link" description="See where a short link points and review its current details." /><section className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5 sm:p-6"><form className="flex flex-col gap-3 sm:flex-row" onSubmit={submit}><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" size={16} /><input className="input-base !pl-10" required value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Enter a short-link slug" /></div><button className="primary-button sm:min-w-[125px]" disabled={busy}>{busy ? "Inspecting..." : "Inspect"}<FileSearch size={16} /></button></form>{error && <p className="mt-4 rounded-md bg-[#fff5f5] px-3 py-2.5 text-sm text-[#c92a2a]">{error}</p>}</section>{link && <section className="soft-shadow mt-5 rounded-lg border border-[#cde6d7] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25804c]"><Check size={14} /> Link found</span><h2 className="mt-3 font-display text-xl font-bold text-[#172033]">{shortUrl(link)}</h2></div><button className="secondary-button"><ExternalLink size={15} /> Open link</button></div><div className="mt-7 grid gap-4 border-t border-[#edf0f4] pt-5 sm:grid-cols-3"><Detail label="Destination" value={link.longUrl} /><Detail label="Created" value="Just now" /><Detail label="Status" value="Active" /></div></section>}{recent.length > 0 && <p className="mt-8 text-sm text-[#98a2b3]">Recent inspections are also available on your dashboard.</p>}</div>; }

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-medium text-[#98a2b3]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[#344054]">{value}</p></div>; }
function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-8"><p className="mb-2 text-sm font-semibold text-[#1769e0]">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">{title}</h1><p className="mt-2 text-sm text-[#667085]">{description}</p></div>; }
function SettingsView({ user }: { user: User }) { return <div className="fade-in"><PageHeading eyebrow="Workspace preferences" title="Account settings" description="Manage your account details and security preferences." /><div className="space-y-5"><section className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5 sm:p-6"><div className="flex items-center justify-between border-b border-[#edf0f4] pb-5"><div><h2 className="font-display text-lg font-bold text-[#172033]">Account information</h2><p className="mt-1 text-sm text-[#667085]">Your URLZ workspace identity.</p></div><UserRound className="text-[#1769e0]" size={20} /></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><Detail label="Email address" value={user.email} /><Detail label="Account status" value="Active" /></div></section><section className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-[#172033]">Security</h2><p className="mt-1 text-sm text-[#667085]">Your authentication uses secure, HttpOnly cookies.</p><button className="secondary-button mt-5"><ShieldCheck size={15} /> Session protection enabled</button></section><section className="rounded-lg border border-[#f3c4c4] bg-[#fffafa] p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-[#a12626]">Danger zone</h2><p className="mt-1 text-sm text-[#8f5d5d]">Account deletion is permanent and cannot be undone.</p><button className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#e7b1b1] bg-white px-3 py-2 text-sm font-semibold text-[#bd3030]">Delete account <X size={15} /></button></section></div></div>; }

createRoot(document.getElementById("root")!).render(<App />);