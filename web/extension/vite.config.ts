import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const extensionRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: extensionRoot,
    plugins: [react(), tailwindcss()],
    publicDir: resolve(extensionRoot, "public"),
    build: {
        outDir: resolve(extensionRoot, "dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(extensionRoot, "popup.html"),
                options: resolve(extensionRoot, "options.html"),
            },
        },
    },
});
