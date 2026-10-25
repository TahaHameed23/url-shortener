import { Moon, Sun } from "lucide-react";
import React from "react";

export function ThemeToggle({
    darkMode,
    onToggle,
}: {
    darkMode: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-[#dfe3ea] bg-white text-[#667085] transition-colors hover:bg-[#f9fafb] hover:text-[#1769e0] focus-visible:outline-3 focus-visible:outline-[#2878ee]/30 focus-visible:outline-offset-2 dark:border-[#303b4c] dark:bg-[#1b2432] dark:text-[#a3afc2] dark:hover:bg-[#253145] dark:hover:text-[#82b2ff]"
            onClick={onToggle}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={darkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
            <Sun className={`absolute transition-opacity duration-150 ease-out ${darkMode ? "opacity-100" : "opacity-0"}`} size={18} aria-hidden="true" />
            <Moon className={`absolute transition-opacity duration-150 ease-out ${darkMode ? "opacity-0" : "opacity-100"}`} size={18} aria-hidden="true" />
        </button>
    );
}
