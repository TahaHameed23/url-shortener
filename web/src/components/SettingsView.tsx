import { UserRound, X } from "lucide-react";
import React from "react";
import { User } from "../types";
import { Detail } from "./Brand";

export function SettingsView({ user }: { user: User }) {
    return (
        <div className="fade-in">
            <h1 className="mb-8 font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">
                Account settings
            </h1>

            <div className="space-y-5">
                <section className="soft-shadow rounded-lg border border-[#e5e7eb] bg-white p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-[#edf0f4] pb-5">
                        <div>
                            <h2 className="font-display text-lg font-bold text-[#172033]">Account information</h2>
                        </div>
                        <UserRound className="text-[#1769e0]" size={20} />
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Detail label="Email address" value={user.email} />
                        <Detail label="Name" value={user.name} />
                    </div>
                </section>

                <section className="rounded-lg border border-[#f3c4c4] bg-[#fffafa] p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold text-[#a12626]">Danger zone</h2>
                    <p className="mt-1 text-sm text-[#8f5d5d]">Account deletion is permanent and cannot be undone.</p>
                    <button className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#e7b1b1] bg-white px-3 py-2 text-sm font-semibold text-[#bd3030]">
                        Delete account <X size={15} />
                    </button>
                </section>
            </div>
        </div>
    );
}
