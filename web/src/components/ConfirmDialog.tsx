import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

export function ConfirmDialog({
    title,
    description,
    confirmLabel,
    onConfirm,
    onCancel,
}: {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const previousFocus = document.activeElement;
        cancelButtonRef.current?.focus();
        return () => {
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
                previousFocus.focus();
            }
        };
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = "hidden";
        return () => {
            root.style.overflow = previousOverflow;
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#172033]/35 p-4">
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="logout-dialog-title"
                aria-describedby="logout-dialog-description"
                className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_24px_70px_rgba(23,32,51,0.24)] dark:border-[#354258] dark:bg-[#171e29]"
            >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1f1] text-[#c92a2a] dark:bg-[#3a222a] dark:text-[#ff9da8]">
                    <LogOut size={20} aria-hidden="true" />
                </div>
                <h2 id="logout-dialog-title" className="mt-4 font-display text-lg font-bold text-[#172033] dark:text-[#f1f5fb]">
                    {title}
                </h2>
                <p id="logout-dialog-description" className="mt-2 text-sm leading-6 text-[#667085] dark:text-[#a3afc2]">
                    {description}
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-[#dfe3ea] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#f9fafb] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#354258] dark:bg-[#1b2432] dark:text-[#d2dae6] dark:hover:bg-[#253145]"
                    >
                        Stay signed in
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c92a2a] bg-[#c92a2a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ae2222] focus-visible:outline-3 focus-visible:outline-[#c92a2a]/30 focus-visible:outline-offset-2"
                    >
                        <LogOut size={15} aria-hidden="true" />
                        {confirmLabel}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
