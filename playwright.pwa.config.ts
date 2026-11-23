import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the installed-app run.
 *
 * The main configuration tests `next dev`. This one tests what is deployed: the
 * static export, served under /doit/ as on GitHub Pages, with its service
 * worker -- reloading offline and the update prompt.
 *
 * It is a separate configuration, not another project, because Playwright
 * starts every web server of a configuration whichever project is selected,
 * and this one has to build the export first. Run it with `npm run test:pwa`.
 *
 * The server is never reused: the build is part of the command, so a server
 * left over from an earlier run would mean testing an earlier build.
 */
const PORT = process.env.PLAYWRIGHT_PWA_PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}/doit/`;

export default defineConfig({
  testDir: "./e2e/pwa",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  timeout: 60000,
  expect: { timeout: 15000 },

  use: {
    baseURL: BASE_URL,
    timezoneId: "America/Los_Angeles",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "pwa", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: `npm run build:gh-pages && node e2e/pwa/serve-export.mjs ${PORT}`,
    env: { GITHUB_PAGES: "true" },
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 5 * 60 * 1000,
  },
});
