import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.BVB_TEST_PORT || 4173);
const windowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const localLaunchOptions =
  !process.env.CI && existsSync(windowsChrome)
    ? { executablePath: windowsChrome }
    : {};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    reducedMotion: "reduce",
    launchOptions: localLaunchOptions
  },
  webServer: {
    command: `node scripts/serve.mjs --port=${port}`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
