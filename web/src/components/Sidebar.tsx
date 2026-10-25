import { BarChart3, FileSearch, LogOut, PanelLeftClose, PanelLeftOpen, Settings, X } from "lucide-react";
import React from "react";
import type { View } from "../types";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar({
    view,
    mobileOpen,
    collapsed,
    onToggle,
    onCloseMobile,
    onNavigate,
    onLogout,
    darkMode,
    onToggleTheme,
}: {
    view: View;
    mobileOpen: boolean;
    collapsed: boolean;
    onToggle: () => void;
    onCloseMobile: () => void;
    onNavigate: (view: View) => void;
    onLogout: () => void;
    darkMode: boolean;
    onToggleTheme: () => void;
}) {
    const items: { id: View; label: string; icon: typeof BarChart3 }[] = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "inspect", label: "Inspect link", icon: FileSearch },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <>
        <div className={`fixed inset-0 z-20 hidden bg-[#172033]/30 opacity-0 transition-opacity duration-200 max-[700px]:block ${mobileOpen ? "opacity-100" : ""}`} style={{ pointerEvents: mobileOpen ? "auto" : "none" }} onClick={onCloseMobile} aria-hidden="true" />
        <aside id="primary-navigation" className={`sticky top-0 z-30 flex h-screen min-h-0 flex-col self-start border-r border-[#e5e7eb] bg-white px-4 py-6 transition-[width,padding,transform,color,background-color,border-color] duration-200 ease-out max-[900px]:px-2.5 max-[900px]:py-4 max-[700px]:fixed max-[700px]:inset-y-0 max-[700px]:left-0 max-[700px]:w-[min(280px,86vw)] max-[700px]:px-4 max-[700px]:py-5 max-[700px]:shadow-[18px_0_40px_rgba(23,32,51,0.14)] dark:border-[#293445] dark:bg-[#171e29] ${collapsed ? "max-[900px]:px-2.5" : ""} ${mobileOpen ? "max-[700px]:translate-x-0" : "max-[700px]:-translate-x-[105%]"}`} aria-label="Primary navigation">
            <div className="flex min-h-8 items-center max-[900px]:justify-center max-[700px]:justify-between">
                <Brand compact={collapsed} hideLabel={collapsed} hideLabelOnNarrow />
                <button className="hidden h-[34px] w-[34px] place-items-center rounded-lg border-0 bg-transparent text-[#667085] transition-colors hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[700px]:grid dark:text-[#a3afc2] dark:hover:bg-[#253145] dark:hover:text-[#82b2ff]" onClick={onCloseMobile} aria-label="Close navigation">
                    <X size={19} />
                </button>
            </div>
            <button
                className="absolute -right-3.5 top-10 z-40 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-[#e5e7eb] bg-white text-[#98a2b3] transition-colors duration-150 hover:border-[#c9dafe] hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[900px]:hidden dark:border-[#354258] dark:bg-[#202a39] dark:text-[#a3afc2] dark:hover:border-[#45638f] dark:hover:bg-[#253145] dark:hover:text-[#82b2ff]"
                onClick={onToggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                aria-controls="primary-navigation"
            >
                <span className="relative grid h-4 w-4 place-items-center">
                    <PanelLeftOpen className={`absolute transition-opacity duration-150 ease-out ${collapsed ? "opacity-100" : "opacity-0"}`} size={15} aria-hidden="true" />
                    <PanelLeftClose className={`absolute transition-opacity duration-150 ease-out ${collapsed ? "opacity-0" : "opacity-100"}`} size={15} aria-hidden="true" />
                </span>
            </button>
            <nav className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
                {items.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        className={`flex w-full items-center gap-[11px] rounded-lg px-3 py-2.5 text-sm font-medium text-[#667085] transition-colors duration-150 ease-out focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[900px]:justify-center max-[900px]:px-2 max-[700px]:justify-start max-[700px]:px-3 ${view === id ? "bg-[#eef5ff] text-[#1769e0] hover:bg-[#eef5ff] dark:bg-[#203657] dark:text-[#82b2ff] dark:hover:bg-[#203657]" : "hover:bg-[#eef5ff] hover:text-[#1769e0] dark:text-[#a3afc2] dark:hover:bg-[#253145] dark:hover:text-[#82b2ff]}"}`}
                        onClick={() => onNavigate(id)}
                    >
                        <Icon size={17} />
                        <span className={collapsed ? "hidden max-[700px]:inline" : "max-[900px]:hidden max-[700px]:inline"}>{label}</span>
                    </button>
                ))}
            </nav>
            <div className={`mt-auto flex shrink-0 items-center gap-2 border-t border-[#edf0f4] pt-5 dark:border-[#293445] max-[900px]:flex-col max-[700px]:flex-row ${collapsed ? "flex-col" : ""}`}>
                <button className="flex min-w-0 flex-1 items-center gap-[11px] rounded-lg px-3 py-2.5 text-sm font-medium text-[#667085] transition-colors duration-150 hover:bg-[#eef5ff] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 max-[900px]:justify-center max-[900px]:px-2 max-[700px]:justify-start max-[700px]:px-3 dark:text-[#a3afc2] dark:hover:bg-[#253145] dark:hover:text-[#82b2ff]" onClick={onLogout}>
                    <LogOut size={17} />
                    <span className={collapsed ? "hidden max-[700px]:inline" : "max-[900px]:hidden max-[700px]:inline"}>Log out</span>
                </button>
                <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
            </div>
        </aside>
        </>
    );
}
