import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    root: "web",
    plugins: [react({ jsxRuntime: "classic" }), tailwindcss()],
    build: {
        outDir: "../public",
        emptyOutDir: false,
    },
});
