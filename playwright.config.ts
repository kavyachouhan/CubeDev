import { defineConfig, devices } from "@playwright/test";
import { applyTestEnv } from "./tests/setup/env";

applyTestEnv();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npx next dev --turbopack -p 3000",
      url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      ...process.env,
    },
  },
});