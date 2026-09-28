type AuthMode = "login" | "register";

type AuthUser = {
    id: string;
    email: string;
};

type AuthResponse = {
    user: AuthUser;
};

type LinkRecord = {
    id: string;
    shortUrl: string;
    longUrl: string;
    createdBy?: string;
};

type ApiError = {
    error?: string;
};

type ApiRequestInit = RequestInit & {
    authenticated?: boolean;
};

const STORAGE_KEYS = {
    user: "urlz.user",
    recentLinks: "urlz.recentLinks",
} as const;

const state = {
    mode: "login" as AuthMode,
    authenticated: false,
    user: readJson<AuthUser>(STORAGE_KEYS.user),
    recentLinks: readJson<LinkRecord[]>(STORAGE_KEYS.recentLinks) ?? [],
};

const root = document.getElementById("app");
if (!root) {
    throw new Error("App root not found");
}

const authForm = document.getElementById("authForm") as HTMLFormElement;
const authSubmit = document.getElementById("authSubmit") as HTMLButtonElement;
const authEmail = document.getElementById("authEmail") as HTMLInputElement;
const authPassword = document.getElementById(
    "authPassword",
) as HTMLInputElement;
const authOutput = document.getElementById("authOutput") as HTMLDivElement;
const authState = document.getElementById("authState") as HTMLSpanElement;
const sessionBadgeText = document.getElementById(
    "sessionBadgeText",
) as HTMLSpanElement;
const sessionDot = document.getElementById("sessionDot") as HTMLSpanElement;
const signOutButton = document.getElementById(
    "signOutButton",
) as HTMLButtonElement;
const createForm = document.getElementById("linkForm") as HTMLFormElement;
const longUrlInput = document.getElementById("longUrl") as HTMLInputElement;
const createOutput = document.getElementById("createOutput") as HTMLDivElement;
const lookupForm = document.getElementById("lookupForm") as HTMLFormElement;
const slugInput = document.getElementById("slugInput") as HTMLInputElement;
const lookupOutput = document.getElementById("lookupOutput") as HTMLDivElement;
const recentLinks = document.getElementById("recentLinks") as HTMLDivElement;
const heroOutput = document.getElementById("heroOutput") as HTMLDivElement;
const authModeButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-auth-mode]"),
);

updateAuthUi();
renderRecentLinks();
renderHeroState();
bindAuthModeButtons();
bindForms();
restoreSession();

function bindAuthModeButtons(): void {
    for (const button of authModeButtons) {
        button.addEventListener("click", () => {
            state.mode =
                button.dataset.authMode === "register" ? "register" : "login";
            updateAuthUi();
        });
    }
}

function bindForms(): void {
    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setOutput(authOutput, "", false);
        setBusy(
            authSubmit,
            true,
            state.mode === "login" ? "Logging in..." : "Creating account...",
        );

        try {
            const payload = {
                email: authEmail.value.trim(),
                password: authPassword.value,
            };

            const endpoint =
                state.mode === "login"
                    ? "/api/v1/auth/login"
                    : "/api/v1/auth/register";
            const response = await request<AuthResponse>(endpoint, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            persistSession(response.user);
            setOutput(
                authOutput,
                `${state.mode === "login" ? "Welcome back" : "Account created"}: ${response.user.email}`,
                false,
            );
            renderHeroState();
        } catch (error) {
            setOutput(authOutput, resolveError(error), true);
        } finally {
            setBusy(
                authSubmit,
                false,
                state.mode === "login" ? "Login" : "Register",
            );
        }
    });

    signOutButton.addEventListener("click", async () => {
        await request<void>("/api/v1/auth/logout", { method: "POST" });
        clearSession();
        setOutput(authOutput, "Session cleared.", false);
        renderHeroState();
    });

    createForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setOutput(createOutput, "", false);

        if (!state.authenticated) {
            setOutput(createOutput, "Sign in before creating links.", true);
            return;
        }

        const longUrl = longUrlInput.value.trim();
        if (!longUrl) {
            setOutput(createOutput, "Enter a valid URL.", true);
            return;
        }

        const createButton = createForm.querySelector(
            "button",
        ) as HTMLButtonElement;
        setBusy(createButton, true, "Shortening...");

        try {
            const link = await request<LinkRecord>("/api/v1/links", {
                method: "POST",
                body: JSON.stringify({ longUrl }),
                authenticated: true,
            });

            rememberLink(link);
            longUrlInput.value = "";
            setLinkPreview(createOutput, "Created link", link);
            renderRecentLinks();
            renderHeroState();
        } catch (error) {
            setOutput(createOutput, resolveError(error), true);
        } finally {
            setBusy(createButton, false, "Shorten");
        }
    });

    lookupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setOutput(lookupOutput, "", false);
        const slug = slugInput.value.trim();

        if (!slug) {
            setOutput(lookupOutput, "Enter a slug.", true);
            return;
        }

        const lookupButton = lookupForm.querySelector(
            "button",
        ) as HTMLButtonElement;
        setBusy(lookupButton, true, "Inspecting...");

        try {
            const link = await request<LinkRecord>(
                `/api/v1/links/${encodeURIComponent(slug)}`,
                { authenticated: true },
            );
            rememberLink(link);
            setLinkPreview(lookupOutput, "Lookup result", link);
            renderRecentLinks();
        } catch (error) {
            setOutput(lookupOutput, resolveError(error), true);
        } finally {
            setBusy(lookupButton, false, "Inspect");
        }
    });
}

function updateAuthUi(): void {
    const isRegister = state.mode === "register";
    authSubmit.textContent = isRegister ? "Register" : "Login";
    for (const button of authModeButtons) {
        const active = button.dataset.authMode === state.mode;
        button.setAttribute("aria-pressed", String(active));
    }

    const signedIn = Boolean(state.authenticated && state.user);
    authState.textContent = signedIn
        ? (state.user?.email ?? "Signed in")
        : "Signed out";
    sessionBadgeText.textContent = signedIn
        ? (state.user?.email ?? "Signed in")
        : "Anonymous";
    sessionDot.style.color = signedIn ? "#f5f5f5" : "#7b7b7b";
    signOutButton.disabled = !signedIn;
}

async function restoreSession(): Promise<void> {
    try {
        const response = await request<{ user: AuthUser }>("/api/v1/auth/me", {
            authenticated: true,
        });
        state.authenticated = true;
        state.user = response.user;
        writeStorage(STORAGE_KEYS.user, response.user);
        updateAuthUi();
        renderHeroState();
    } catch {
        clearSession();
    }
}

function persistSession(user: AuthUser): void {
    state.authenticated = true;
    state.user = user;
    writeStorage(STORAGE_KEYS.user, user);
    updateAuthUi();
}

function clearSession(): void {
    state.authenticated = false;
    state.user = null;
    removeStorage(STORAGE_KEYS.user);
    updateAuthUi();
}

async function request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    const response = await fetch(path, {
        ...init,
        headers,
        credentials: "same-origin",
    });

    const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
    const payload = isJson ? ((await response.json()) as T & ApiError) : null;

    if (!response.ok) {
        throw new Error(
            payload?.error ?? `Request failed (${response.status})`,
        );
    }

    return (payload ?? (await response.text())) as T;
}

function setBusy(
    button: HTMLButtonElement,
    busy: boolean,
    label: string,
): void {
    button.disabled = busy;
    button.textContent = label;
}

function setOutput(
    node: HTMLDivElement,
    message: string,
    isError: boolean,
): void {
    node.innerHTML = "";

    if (!message) {
        return;
    }

    const box = document.createElement("div");
    box.className = `alert${isError ? " error" : ""}`;
    box.textContent = message;
    node.appendChild(box);
}

function setLinkPreview(
    node: HTMLDivElement,
    title: string,
    link: LinkRecord,
): void {
    const shortUrl = buildShortUrl(link.shortUrl);
    const item = document.createElement("div");
    item.className = "output-card";
    item.innerHTML = `
		<p class="output-title">${escapeHtml(title)}</p>
		<p class="output-meta">${escapeHtml(link.longUrl)}</p>
		<div class="code-line">
			<span>${escapeHtml(shortUrl)}</span>
			<button type="button">Copy</button>
		</div>
	`;

    const copyButton = item.querySelector("button");
    copyButton?.addEventListener("click", async () => {
        await copyText(shortUrl);
        copyButton.textContent = "Copied";
        window.setTimeout(() => {
            copyButton.textContent = "Copy";
        }, 1000);
    });

    node.innerHTML = "";
    node.appendChild(item);
}

function rememberLink(link: LinkRecord): void {
    state.recentLinks = [
        link,
        ...state.recentLinks.filter(
            (entry) => entry.shortUrl !== link.shortUrl,
        ),
    ].slice(0, 6);
    writeStorage(STORAGE_KEYS.recentLinks, state.recentLinks);
}

function renderRecentLinks(): void {
    recentLinks.innerHTML = "";

    if (state.recentLinks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "alert";
        empty.textContent =
            "Nothing yet. Create or inspect a link to populate this list.";
        recentLinks.appendChild(empty);
        return;
    }

    for (const link of state.recentLinks) {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `
			<strong>${escapeHtml(buildShortUrl(link.shortUrl))}</strong>
			<p class="muted small">${escapeHtml(link.longUrl)}</p>
		`;
        recentLinks.appendChild(item);
    }
}

function renderHeroState(): void {
    heroOutput.innerHTML = "";
    const card = document.createElement("div");
    card.className = "output-card";
    card.innerHTML = state.user
        ? `
			<p class="output-title">Signed in as ${escapeHtml(state.user.email)}</p>
			<p class="output-meta">Your token is active and requests will include the Bearer header automatically.</p>
		`
        : `
			<p class="output-title">No session loaded</p>
			<p class="output-meta">Register or log in to create links, then keep the token local to this browser.</p>
		`;
    heroOutput.appendChild(card);
}

function buildShortUrl(slug: string): string {
    return `${window.location.origin}/l/${slug}`;
}

function resolveError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong.";
}

async function copyText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    document.execCommand("copy");
    helper.remove();
}

function readStorage(key: string): string | null {
    return window.localStorage.getItem(key);
}

function readJson<T>(key: string): T | null {
    const value = readStorage(key);

    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: unknown): void {
    window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key: string): void {
    window.localStorage.removeItem(key);
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
