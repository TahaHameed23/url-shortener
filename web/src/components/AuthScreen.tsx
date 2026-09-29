import React, { useEffect, useState } from "react";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
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

        if (register && password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setBusy(true);
        try {
            const result = await api<{ user: User }>(`/api/v1/auth/${register ? "register" : "login"}`, {
                method: "POST",
                body: JSON.stringify({ email, password }),
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
                    <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9dafe] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#1769e0]">
                        <Sparkles size={14} /> Simple links. Clear insights.
                    </div>
                    <h1 className="font-display text-6xl font-bold leading-[.98] tracking-[-.07em] text-[#16213a]">
                        Shorten, track, and optimize every link.
                    </h1>
                    <p className="mt-6 max-w-[410px] text-base leading-7 text-[#667085]">
                        A focused workspace for creating clean links and understanding what happens after the click.
                    </p>
                    <div className="mt-10 flex items-center gap-5 text-xs font-medium text-[#667085]">
                        <span>2.4M+ links created</span>
                        <span>99.9% uptime</span>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[38px] border-[#d9e6ff] opacity-70" />
            </section>

            <section className="auth-form-wrap">
                <div className="w-full max-w-[400px] fade-in">
                    <div className="mb-10 lg:hidden">
                        <Brand />
                    </div>
                    <div className="mb-8">
                        <p className="mb-2 text-sm font-semibold text-[#1769e0]">
                            {register ? "Create your workspace" : "Welcome back"}
                        </p>
                        <h2 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">
                            {register ? "Create an account" : "Sign in to URLZ"}
                        </h2>
                        <p className="mt-2 text-sm text-[#667085]">
                            {register ? "Start managing your links in one place." : "Enter your details to continue."}
                        </p>
                    </div>

                    <div className="mb-5 min-h-[52px]" aria-live="polite">
                        {error ? (
                            <div className="rounded-md border border-[#f5c2c7] bg-[#fff5f5] px-3 py-2.5 text-sm text-[#c92a2a]">
                                {error}
                            </div>
                        ) : (
                            <div className="h-0" aria-hidden="true" />
                        )}
                    </div>

                    <form className="space-y-5" onSubmit={submit}>
                        <label className="block text-sm font-semibold text-[#344054]">
                            Email address
                            <input
                                className="input-base mt-2"
                                type="email"
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

                    <p className="mt-10 flex items-center justify-center gap-2 text-xs text-[#98a2b3]">
                        <ShieldCheck size={14} /> Your session is protected with secure cookies
                    </p>
                </div>
            </section>
        </div>
    );
}
