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
 * The smoke specs that also run in WebKit and Firefox: task creation, the
 * rich-text editor, and settings with storage. Those are the areas where the
 * engines differ most -- contenteditable, IndexedDB and persistence.
 */
const CROSS_BROWSER_SPECS = [
  "**/crud-workflow.spec.ts",
  "**/rich-text-editor.spec.ts",
  "**/persistence-settings.spec.ts",
];

/**
 * Playwright configuration for Doit E2E tests
 *
 * Test structure:
 * - e2e/smoke/ - Sequential smoke tests (workflow-based)
 * - e2e/visual.spec.ts - Visual regression tests
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

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
      maxDiffPixelRatio: 0.001, // ~0.1%: absorbs antialiasing, not a changed label
      animations: "disabled", // Disable animations for consistent screenshots
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.001,
    },
  },

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: BASE_URL,

    /* One time zone on every machine, and one behind UTC: that is where a
     * date-only string parsed as UTC shows up as the previous day. Matches the
     * Jest pin in jest.config.js. */
    timezoneId: "America/Los_Angeles",

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
   * visual.spec.ts, and the spec covers mobile itself via its own viewport.
   * Including {-projectName} in the path orphaned every baseline when the
   * projects were renamed. Revisit if a second project ever runs visual specs. */
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

    /* The mobile spec again, on a phone profile: touch input and a mobile user
     * agent, which the narrow desktop window in `smoke-tests` does not have. */
    {
      name: "smoke-mobile",
      testDir: "./e2e/smoke",
      testMatch: "**/mobile.spec.ts",
      use: { ...devices["Pixel 5"] },
    },

    /* The cross-browser subset. Not part of `npm run test:smoke` or of CI:
     * run it with `npm run test:browsers`, which needs the two browsers
     * installed (`npx playwright install webkit firefox`). */
    {
      name: "webkit",
      testDir: "./e2e/smoke",
      testMatch: CROSS_BROWSER_SPECS,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "firefox",
      testDir: "./e2e/smoke",
      testMatch: CROSS_BROWSER_SPECS,
      use: {
        ...devices["Desktop Firefox"],
        /* Startup asks for persistent storage and waits for the answer.
         * Firefox answers with a prompt, which nothing here can click, so the
         * app would stay on "Loading..." for good. These two preferences make
         * Firefox say yes without asking. They get the tests past startup --
         * and mean this project cannot see the wait itself, which is U0089. */
        launchOptions: {
          firefoxUserPrefs: {
            "dom.storageManager.prompt.testing": true,
            "dom.storageManager.prompt.testing.allow": true,
          },
        },
      },
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
