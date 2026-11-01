import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

export type ToastNoticeData = {
    message: string;
    type: "success" | "error";
};

export function FeedbackToast({
    notice,
    onDismiss,
}: {
    notice: ToastNoticeData | null;
    onDismiss: () => void;
}) {
    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(onDismiss, 4000);
        return () => window.clearTimeout(timeout);
    }, [notice, onDismiss]);

    if (!notice) return null;

    const success = notice.type === "success";
    const Icon = success ? CheckCircle2 : CircleAlert;

    return createPortal(
        <div
            className={`fixed right-4 top-4 z-[110] flex w-[min(420px,calc(100vw-32px))] items-start gap-3 rounded-xl border bg-white p-4 shadow-[0_16px_40px_rgba(23,32,51,0.16)] transition-[opacity,transform] duration-200 ease-out dark:bg-[#171e29] ${
                success ? "border-[#cde6d7] dark:border-[#295342]" : "border-[#f2c7c7] dark:border-[#62353d]"
            }`}
            role={success ? "status" : "alert"}
            aria-live={success ? "polite" : "assertive"}
        >
            <Icon
                size={19}
                className={`mt-0.5 shrink-0 ${success ? "text-[#25804c] dark:text-[#75d59d]" : "text-[#c92a2a] dark:text-[#ff9da8]"}`}
                aria-hidden="true"
            />
            <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-[#344054] dark:text-[#d2dae6]">{notice.message}</p>
            <button
                type="button"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#667085] transition-colors hover:bg-[#f2f4f7] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:text-[#a3afc2] dark:hover:bg-[#253145]"
                onClick={onDismiss}
                aria-label="Dismiss notification"
            >
                <X size={15} />
            </button>
        </div>,
        document.body,
    );
}
