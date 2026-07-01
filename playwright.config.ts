import { defineConfig, devices } from "@playwright/test";

// WebLLM inference needs a real WebGPU adapter, which Chromium does not expose
// under automation. Tier 1 tests (UI + fallback path) run headless here; the
// Tier 2 inference smoke test self-skips unless a real adapter is present
// (run headed against a WebGPU-capable browser to exercise it).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
