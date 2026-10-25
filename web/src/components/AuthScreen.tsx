import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../lib/urlz";
import type { AuthMode, User } from "../types";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export function AuthScreen({
    mode,
    onModeChange,
    onAuthenticated,
    darkMode,
    onToggleTheme,
}: {
    mode: AuthMode;
    onModeChange: (mode: AuthMode) => void;
    onAuthenticated: (user: User) => void;
    darkMode: boolean;
    onToggleTheme: () => void;
}) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const register = mode === "register";

    useEffect(() => {
        setError("");
    }, [mode]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");

        if (
            window.location.protocol !== "https:" &&
            window.location.hostname !== "localhost" &&
            window.location.hostname !== "127.0.0.1"
        ) {
            setError("Sign in and registration require a secure HTTPS connection.");
            return;
        }

        if (register && password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setBusy(true);
        try {
            const result = await api<{ user: User }>(`/api/v1/auth/${register ? "register" : "login"}`, {
                method: "POST",
                body: JSON.stringify({ ...(register ? { name } : {}), email, password }),
            });
            onAuthenticated(result.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to continue.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="relative grid min-h-screen grid-cols-[minmax(300px,1fr)_minmax(400px,0.92fr)] bg-white max-md:block dark:bg-[#171e29]">
            <div className="fixed right-5 top-5 z-20">
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
            </div>
            <section className="relative hidden overflow-hidden bg-[#f0f4ff] p-8 md:block xl:p-12 dark:bg-[#142039]">
                <Brand />
                <div className="absolute inset-x-8 top-[56%] max-w-[480px] -translate-y-1/2 xl:inset-x-12">
                    <div className="mb-6 inline-flex items-center rounded-full border border-[#c9dafe] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#1769e0] dark:border-[#35527d] dark:bg-[#1c2c47] dark:text-[#9fc3ff]">
                        URL shortener and link inspector
                    </div>
                    <h1 className="font-display text-4xl font-bold leading-[.98] tracking-[-.07em] text-[#16213a] xl:text-6xl dark:text-[#f1f5fb]">
                        Short links, ready to share.
                    </h1>
                    <p className="mt-5 max-w-[410px] text-sm leading-6 text-[#667085] xl:mt-6 xl:text-base xl:leading-7 dark:text-[#afbdd1]">
                        Create a clean URL, inspect where it goes, and keep your links together in one workspace.
                    </p>
                </div>
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[38px] border-[#d9e6ff] opacity-70 dark:border-[#243b61]" />
            </section>

            <section className="grid place-items-center bg-white px-8 py-10 max-md:min-h-[100svh] max-md:px-5 max-md:py-7 dark:bg-[#171e29]">
                <div className="w-full max-w-[400px] animate-[fade-in_0.35s_ease_both]">
                    <div className="mb-8 md:hidden">
                        <Brand />
                    </div>
                    <div className="mb-8">
                        <h2 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033] dark:text-[#f1f5fb]">
                            {register ? "Create an account" : "Sign in to URLZ"}
                        </h2>
                        <p className="mt-2 text-sm text-[#667085] dark:text-[#a3afc2]">
                            {register
                                ? "Create short links and inspect them from one place."
                                : "Use your URLZ account to manage your links."}
                        </p>
                    </div>

                    <div className="mb-5" aria-live="polite">
                        {error ? (
                            <div className="rounded-md border border-[#f5c2c7] bg-[#fff5f5] px-3 py-2.5 text-sm leading-5 text-[#c92a2a] dark:border-[#693843] dark:bg-[#321e27] dark:text-[#ff9da8]">
                                {error}
                            </div>
                        ) : null}
                    </div>

                    <form className="space-y-5" onSubmit={submit}>
                        {register && (
                            <label className="block text-sm font-semibold text-[#344054] dark:text-[#d2dae6]">
                                Name
                                <input
                                    className="mt-2 w-full rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] dark:border-[#354258] dark:bg-[#111822] dark:text-[#f1f5fb] dark:placeholder:text-[#7f8ba0]"
                                    type="text"
                                    name="name"
                                    autoComplete="name"
                                    required
                                    maxLength={100}
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Your name"
                                />
                            </label>
                        )}
                        <label className="block text-sm font-semibold text-[#344054] dark:text-[#d2dae6]">
                            Email address
                            <input
                                className="mt-2 w-full rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] dark:border-[#354258] dark:bg-[#111822] dark:text-[#f1f5fb] dark:placeholder:text-[#7f8ba0]"
                                type="email"
                                name="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@company.com"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-[#344054] dark:text-[#d2dae6]">
                            Password
                            <input
                                className="mt-2 w-full rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] dark:border-[#354258] dark:bg-[#111822] dark:text-[#f1f5fb] dark:placeholder:text-[#7f8ba0]"
                                type="password"
                                name="password"
                                autoComplete={register ? "new-password" : "current-password"}
                                minLength={8}
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="At least 8 characters"
                            />
                        </label>

                        {register && (
                            <label className="block text-sm font-semibold text-[#344054] dark:text-[#d2dae6]">
                                Confirm password
                                <input
                                    className="mt-2 w-full rounded-lg border border-[#dfe3ea] bg-white px-3.5 py-3 text-[#1f2937] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus:border-[#2878ee] focus:shadow-[0_0_0_3px_rgba(40,120,238,0.12)] dark:border-[#354258] dark:bg-[#111822] dark:text-[#f1f5fb] dark:placeholder:text-[#7f8ba0]"
                                    type="password"
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                    value={confirm}
                                    onChange={(event) => setConfirm(event.target.value)}
                                    placeholder="Repeat your password"
                                />
                            </label>
                        )}

                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#1769e0] bg-[#1769e0] px-4 py-3 font-semibold text-white transition-[background,transform] hover:-translate-y-px hover:bg-[#0f59c5] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2" disabled={busy}>
                            {busy ? "Please wait..." : register ? "Create account" : "Login"}
                            <ArrowUpRight size={16} />
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-[#667085] dark:text-[#a3afc2]">
                        {register ? "Already have an account?" : "New to URLZ?"}{" "}
                        <button
                            className="font-semibold text-[#1769e0] hover:underline"
                            onClick={() => onModeChange(register ? "login" : "register")}
                        >
                            {register ? "Sign in" : "Create an account"}
                        </button>
                    </p>

                </div>
            </section>
        </div>
    );
}
