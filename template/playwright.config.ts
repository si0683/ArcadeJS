import { defineConfig, devices } from "@playwright/test"

// Browser checks of the running game (e2e/). First time: npx playwright install chromium
const PORT = 5179

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  // Screenshots that do not exist yet are saved on the first run (then committed and compared)
  updateSnapshots: "missing",
  projects: [
    // npm run test:e2e — everything except the slow performance check
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: "perf.spec.ts" },
    // npm run test:perf — frame rate with a slowed-down CPU
    { name: "perf", use: { ...devices["Desktop Chrome"] }, testMatch: "perf.spec.ts" },
  ],
  // The dev server: window.game and window.save are available there for the checks
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
