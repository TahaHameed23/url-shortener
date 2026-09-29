import { BarChart3, FileSearch, LogOut, Settings } from "lucide-react";
import React from "react";
import { View } from "../types";
import { Brand } from "./Brand";

export function Sidebar({
    view,
    mobileOpen,
    onNavigate,
    onLogout,
}: {
    view: View;
    mobileOpen: boolean;
    onNavigate: (view: View) => void;
    onLogout: () => void;
}) {
    const items: { id: View; label: string; icon: typeof BarChart3 }[] = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "inspect", label: "Inspect link", icon: FileSearch },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className={`sidebar flex flex-col px-4 py-6 ${mobileOpen ? "" : ""}`}>
            <Brand />
            <nav className="mt-10 space-y-1">
                {items.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        className={`nav-item w-full ${view === id ? "active" : ""}`}
                        onClick={() => onNavigate(id)}
                    >
                        <Icon size={17} />
                        <span className="sidebar-label">{label}</span>
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer mt-auto border-t border-[#edf0f4] pt-5">
                <button className="nav-item w-full" onClick={onLogout}>
                    <LogOut size={17} />
                    <span className="sidebar-label">Log out</span>
                </button>
                <p className="sidebar-footer-text mt-4 px-3 text-[11px] text-[#98a2b3]">Secure workspace</p>
            </div>
        </aside>
    );
}
