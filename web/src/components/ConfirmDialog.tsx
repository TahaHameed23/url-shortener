import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

type ConfirmDialogProps = {
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    busyLabel?: string;
    cancelLabel?: string;
    busy?: boolean;
    variant?: "danger" | "primary";
    icon: LucideIcon;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    title,
    description,
    confirmLabel,
    busyLabel,
    cancelLabel = "Cancel",
    busy = false,
    variant = "primary",
    icon: Icon,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const titleId = "confirmation-dialog-title";
    const descriptionId = "confirmation-dialog-description";

    useEffect(() => {
        cancelButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) onCancel();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [busy, onCancel]);

    useEffect(() => {
        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        const previousScrollbarGutter = root.style.scrollbarGutter;
        root.style.overflow = "clip";
        root.style.scrollbarGutter = "stable";

        return () => {
            root.style.overflow = previousOverflow;
            root.style.scrollbarGutter = previousScrollbarGutter;
        };
    }, []);

    const isDanger = variant === "danger";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#172033]/35 p-4">
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_24px_70px_rgba(23,32,51,0.24)] dark:border-[#354258] dark:bg-[#171e29]"
            >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDanger ? "bg-[#fff1f1] text-[#c92a2a] dark:bg-[#3a222a] dark:text-[#ff9da8]" : "bg-[#eef5ff] text-[#1769e0] dark:bg-[#203657] dark:text-[#82b2ff]"}`}>
                    <Icon size={20} aria-hidden="true" />
                </div>
                <h2 id={titleId} className="mt-4 font-display text-lg font-bold text-[#172033] dark:text-[#f1f5fb]">
                    {title}
                </h2>
                <div id={descriptionId} className="mt-2 break-words text-sm leading-6 text-[#667085] dark:text-[#a3afc2]">
                    {description}
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="rounded-lg border border-[#dfe3ea] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#354258] dark:bg-[#1b2432] dark:text-[#d2dae6] dark:hover:bg-[#253145]"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 disabled:cursor-wait ${
                            isDanger
                                ? "border-[#c92a2a] bg-[#c92a2a] hover:bg-[#ae2222] focus-visible:outline-[#c92a2a]/30"
                                : "border-[#1769e0] bg-[#1769e0] hover:bg-[#0f59c5] focus-visible:outline-[#2878ee]/30"
                        }`}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        <Icon size={15} aria-hidden="true" />
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
