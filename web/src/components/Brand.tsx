import { Link2 } from "lucide-react";
import React from "react";

export function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`flex items-center gap-2.5 ${compact ? "justify-center" : ""}`}>
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[#1769e0] text-white">
                <Link2 size={17} strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-[-.04em] text-[#172033] sidebar-label">URLZ</span>
        </div>
    );
}

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
    return (
        <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-[#1769e0]">{eyebrow}</p>
            <h1 className="font-display text-3xl font-bold tracking-[-.05em] text-[#172033]">{title}</h1>
            <p className="mt-2 text-sm text-[#667085]">{description}</p>
        </div>
    );
}

export function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-[#98a2b3]">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#344054]">{value}</p>
        </div>
    );
}
