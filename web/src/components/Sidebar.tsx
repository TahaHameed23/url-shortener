import { BarChart3, FileSearch, LogOut, PanelLeftClose, PanelLeftOpen, Settings, X } from "lucide-react";
import React from "react";
import { View } from "../types";
import { Brand } from "./Brand";

export function Sidebar({
    view,
    mobileOpen,
    collapsed,
    onToggle,
    onCloseMobile,
    onNavigate,
    onLogout,
}: {
    view: View;
    mobileOpen: boolean;
    collapsed: boolean;
    onToggle: () => void;
    onCloseMobile: () => void;
    onNavigate: (view: View) => void;
    onLogout: () => void;
}) {
    const items: { id: View; label: string; icon: typeof BarChart3 }[] = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "inspect", label: "Inspect link", icon: FileSearch },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <>
        <div className={`pointer-events-none fixed inset-0 z-20 bg-[#172033]/30 opacity-0 transition-opacity duration-200 max-[700px]:block ${mobileOpen ? "pointer-events-auto opacity-100" : ""}`} onClick={onCloseMobile} aria-hidden="true" />
        <aside id="primary-navigation" className={`relative z-30 flex flex-col border-r border-[#e5e7eb] bg-white px-4 py-6 transition-[width,padding,transform] duration-200 ease-out max-[900px]:px-2.5 max-[900px]:py-4 max-[700px]:fixed max-[700px]:inset-y-0 max-[700px]:left-0 max-[700px]:min-h-screen max-[700px]:w-[min(280px,86vw)] max-[700px]:px-4 max-[700px]:py-5 max-[700px]:shadow-[18px_0_40px_rgba(23,32,51,0.14)] ${collapsed ? "max-[900px]:px-2.5" : ""} ${mobileOpen ? "max-[700px]:translate-x-0" : "max-[700px]:-translate-x-[105%]"}`} aria-label="Primary navigation">
            <div className="flex min-h-8 items-center max-[900px]:justify-center max-[700px]:justify-between">
                <Brand compact={collapsed} hideLabel={collapsed} hideLabelOnNarrow />
                <button className="hidden h-[34px] w-[34px] place-items-center rounded-lg border-0 bg-transparent text-[#667085] transition-colors hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[700px]:grid" onClick={onCloseMobile} aria-label="Close navigation">
                    <X size={19} />
                </button>
            </div>
            <button
                className="absolute -right-3.5 top-10 z-40 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-[#e5e7eb] bg-white text-[#98a2b3] transition-colors hover:border-[#c9dafe] hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[900px]:hidden"
                onClick={onToggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                aria-controls="primary-navigation"
            >
                {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
            <nav className="mt-10 space-y-1">
                {items.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        className={`flex w-full items-center gap-[11px] rounded-lg px-3 py-2.5 text-sm font-medium text-[#667085] transition-colors hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[900px]:justify-center max-[900px]:px-2 max-[700px]:justify-start max-[700px]:px-3 ${view === id ? "bg-[#eef5ff] text-[#1769e0]" : ""}`}
                        onClick={() => onNavigate(id)}
                    >
                        <Icon size={17} />
                        <span className={collapsed ? "hidden max-[700px]:inline" : "max-[900px]:hidden max-[700px]:inline"}>{label}</span>
                    </button>
                ))}
            </nav>
            <div className="mt-auto border-t border-[#edf0f4] pt-5">
                <button className="flex w-full items-center gap-[11px] rounded-lg px-3 py-2.5 text-sm font-medium text-[#667085] transition-colors hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[900px]:justify-center max-[900px]:px-2 max-[700px]:justify-start max-[700px]:px-3" onClick={onLogout}>
                    <LogOut size={17} />
                    <span className={collapsed ? "hidden max-[700px]:inline" : "max-[900px]:hidden max-[700px]:inline"}>Log out</span>
                </button>
            </div>
        </aside>
        </>
    );
}
