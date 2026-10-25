import { UserRound, X } from "lucide-react";
import React from "react";
import type { User } from "../types";
import { Detail } from "./Brand";

export function SettingsView({ user }: { user: User }) {
    return (
        <div className="animate-[fade-in_0.35s_ease_both]">
            <h1 className="mb-8 font-display text-3xl font-bold tracking-[-.05em] text-[#172033] dark:text-[#f1f5fb]">
                Account settings
            </h1>

            <div className="space-y-5">
                <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_14px_36px_rgba(31,41,55,0.055)] sm:p-6 dark:border-[#293445] dark:bg-[#171e29] dark:shadow-[0_14px_36px_rgba(0,0,0,0.14)]">
                    <div className="flex items-center justify-between border-b border-[#edf0f4] pb-5 dark:border-[#293445]">
                        <div>
                            <h2 className="font-display text-lg font-bold text-[#172033] dark:text-[#f1f5fb]">Account information</h2>
                        </div>
                        <UserRound className="text-[#1769e0]" size={20} />
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Detail label="Email address" value={user.email} />
                        <Detail label="Name" value={user.name} />
                    </div>
                </section>

                <section className="rounded-lg border border-[#f3c4c4] bg-[#fffafa] p-5 sm:p-6 dark:border-[#633741] dark:bg-[#241a21]">
                    <h2 className="font-display text-lg font-bold text-[#a12626] dark:text-[#ff9da8]">Danger zone</h2>
                    <p className="mt-1 text-sm text-[#8f5d5d] dark:text-[#d59ba2]">Account deletion is permanent and cannot be undone.</p>
                    <button className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#e7b1b1] bg-white px-3 py-2 text-sm font-semibold text-[#bd3030] transition-colors hover:bg-[#fff5f5] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#75444e] dark:bg-[#321e27] dark:text-[#ff9da8] dark:hover:bg-[#402630]">
                        Delete account <X size={15} />
                    </button>
                </section>
            </div>
        </div>
    );
}
