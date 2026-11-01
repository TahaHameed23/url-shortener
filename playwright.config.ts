import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:8788";

export default defineConfig({
    testDir: "./e2e",
    testMatch: "**/*.e2e.ts",
    fullyParallel: false,
    reporter: "list",
    use: {
        baseURL,
        trace: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "bun run e2e:dev",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: false,
    },
});
