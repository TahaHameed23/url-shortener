import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../lib/urlz";
import { AuthMode, User } from "../types";
import { Brand } from "./Brand";

export function AuthScreen({
    mode,
    onModeChange,
    onAuthenticated,
}: {
    mode: AuthMode;
    onModeChange: (mode: AuthMode) => void;
    onAuthenticated: (user: User) => void;
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
        <div className="auth-grid">
            <section className="auth-visual relative hidden overflow-hidden p-12 lg:block">
                <Brand />
                <div className="absolute inset-x-12 bottom-20 max-w-[480px]">
                    <div className="mb-6 inline-flex items-center rounded-full border border-[#c9dafe] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#1769e0]">
                        URL shortener and link inspector
                    </div>
                    <h1 className="font-display text-6xl font-bold leading-[.98] tracking-[-.07em] text-[#16213a]">
                        Short links, ready to share.
                    </h1>
                    <p className="mt-6 max-w-[410px] text-base leading-7 text-[#667085]">
                        Create a clean URL, inspect where it goes, and keep your links together in one workspace.
                    </p>
                </div>
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[38px] border-[#d9e6ff] opacity-70" />
            </section>

            <section className="auth-form-wrap">
                <div className="w-full max-w-[400px] fade-in">
                    <div className="mb-8 lg:hidden">
                        <Brand />
                    </div>
                    <div className="mb-8">
                        <h2 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">
                            {register ? "Create an account" : "Sign in to URLZ"}
                        </h2>
                        <p className="mt-2 text-sm text-[#667085]">
                            {register
                                ? "Create short links and inspect them from one place."
                                : "Use your URLZ account to manage your links."}
                        </p>
                    </div>

                    <div className="mb-5" aria-live="polite">
                        {error ? (
                            <div className="rounded-md border border-[#f5c2c7] bg-[#fff5f5] px-3 py-2.5 text-sm leading-5 text-[#c92a2a]">
                                {error}
                            </div>
                        ) : null}
                    </div>

                    <form className="space-y-5" onSubmit={submit}>
                        {register && (
                            <label className="block text-sm font-semibold text-[#344054]">
                                Name
                                <input
                                    className="input-base mt-2"
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
                        <label className="block text-sm font-semibold text-[#344054]">
                            Email address
                            <input
                                className="input-base mt-2"
                                type="email"
                                name="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@company.com"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-[#344054]">
                            Password
                            <input
                                className="input-base mt-2"
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
                            <label className="block text-sm font-semibold text-[#344054]">
                                Confirm password
                                <input
                                    className="input-base mt-2"
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

                        <button className="primary-button w-full" disabled={busy}>
                            {busy ? "Please wait..." : register ? "Create account" : "Login"}
                            <ArrowUpRight size={16} />
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-[#667085]">
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
