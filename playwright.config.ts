import { defineConfig, devices } from "@playwright/test";

/**
 * Dev-server port, overridable with PLAYWRIGHT_PORT.
 *
 * reuseExistingServer means whatever already answers on this port gets tested.
 * With a fixed 3000 that can be another project's dev server, and the run then
 * fails with "todo-app not visible" rather than anything that points at the
 * real cause.
 */
const PORT = process.env.PLAYWRIGHT_PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Playwright configuration for Doit E2E tests
 *
 * Test structure:
 * - e2e/smoke/ - Sequential smoke tests (workflow-based)
 * - e2e/visual.spec.ts - Visual regression tests
 * - e2e/archive/ - Deprecated granular tests (excluded)
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  /* Ignore archived tests */
  testIgnore: ["**/archive/**"],

  /* Run test files in parallel, but tests within smoke files are sequential */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Workers configuration - smoke tests run faster with more workers */
  workers: process.env.CI ? 2 : 4,

  /* Reporter to use */
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  /* Global timeout - increased for sequential workflow tests */
  timeout: 90000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
    /* Visual comparison settings */
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // Allow 1% pixel difference by default
      animations: "disabled", // Disable animations for consistent screenshots
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "on-first-retry",

    /* Action timeout */
    actionTimeout: 15000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Visual baselines are project-agnostic: only the `visual-tests` project runs
   * visual.spec.ts (the `chromium` project explicitly ignores it), and the spec
   * covers mobile itself via its own viewport. Including {-projectName} in the
   * path orphaned every baseline when the projects were renamed. Revisit if a
   * second project ever runs visual specs. */
  snapshotPathTemplate:
    "{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-snapshotSuffix}{ext}",

  /* Configure projects */
  projects: [
    /* Smoke tests - run on desktop Chrome */
    {
      name: "smoke-tests",
      testDir: "./e2e/smoke",
      use: { ...devices["Desktop Chrome"] },
    },

    /* Visual tests - run on desktop Chrome */
    {
      name: "visual-tests",
      testMatch: "**/visual.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    /* Mobile smoke tests - run on mobile viewport */
    {
      name: "smoke-mobile",
      testDir: "./e2e/smoke",
      testMatch: "**/edge-cases-mobile.spec.ts",
      use: { ...devices["Pixel 5"] },
    },

    // Legacy project for running any remaining tests on chromium
    {
      name: "chromium",
      testIgnore: ["**/smoke/**", "**/archive/**", "**/visual.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
