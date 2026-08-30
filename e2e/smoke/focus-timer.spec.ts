import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Focus Timer and Command Palette
 *
 * Neither had any automated coverage. The repo's own manual sweep recorded the
 * timer as unverified rather than working, after an early "pass" turned out to
 * be an assertion matching a Gantt timestamp -- so every assertion here is one
 * that can actually fail.
 */
test.describe("Focus Timer", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Timer workflow", () => {
    test("Step 1: opens from the header, not only from the Gantt view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await page.getByTestId("open-focus-button").click();

      const dialog = page.getByRole("dialog", { name: "Open focus timer" });
      await expect(dialog).toBeVisible();
      // The setup screen, before anything is running.
      await expect(dialog.getByRole("button", { name: /^Start$/ })).toBeVisible();
    });

    test("Step 2: the duration can be changed before starting", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();
      await page.getByTestId("open-focus-button").click();

      const dialog = page.getByRole("dialog", { name: "Open focus timer" });
      const minutes = dialog.getByLabel(/^Minutes for /).first();
      await minutes.fill("7");

      // The preview is the proof the edit reached the timer rather than only
      // the input, which is the whole point of the screen.
      await expect(dialog.getByTestId("focus-timer-preview")).toHaveText("7:00");

      // Settings writes are coalesced over 300ms (sharedStore.ts). The app
      // flushes them when the tab hides, but page.goto in the next step does
      // not reliably fire that, so wait the window out rather than racing it.
      await page.waitForTimeout(600);
    });

    test("Step 3: the change is remembered next time", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();
      await page.getByTestId("open-focus-button").click();

      const dialog = page.getByRole("dialog", { name: "Open focus timer" });
      await expect(dialog.getByLabel(/^Minutes for /).first()).toHaveValue("7");
    });

    test("Step 4: starting counts down from the chosen length", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();
      await page.getByTestId("open-focus-button").click();

      const dialog = page.getByRole("dialog", { name: "Open focus timer" });
      await dialog.getByRole("button", { name: /^Start$/ }).click();

      const display = dialog.getByTestId("focus-timer-display");
      await expect(display).toBeVisible();
      // Started from 7:00 and is now below it.
      await expect(display).not.toHaveText("7:00", { timeout: 5000 });
      await expect(dialog.getByRole("button", { name: /Pause/ })).toBeVisible();
    });

    test("Step 5: a session survives a reload", async ({ page, todoApp }) => {
      await page.reload();
      await todoApp.waitForAppLoad();
      await page.getByTestId("open-focus-button").click();

      const dialog = page.getByRole("dialog", { name: "Open focus timer" });
      // Straight back into the running session rather than the setup screen.
      await expect(dialog.getByTestId("focus-timer-display")).toBeVisible();
      await expect(dialog.getByText(/Work:/)).toBeVisible();
    });

    test("Step 6: ending a session records it in Statistics", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();
      await page.getByTestId("open-focus-button").click();

      const dialog = page.getByRole("dialog", { name: "Open focus timer" });
      await dialog.getByRole("button", { name: "End session" }).click();
      await page.keyboard.press("Escape");

      await page.getByRole("tab", { name: /Stats/i }).click();
      await expect(page.getByText("Focus Timer")).toBeVisible();
      await expect(page.getByText("Sessions Recorded")).toBeVisible();
    });
  });
});

test.describe("Command Palette", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test("finds a task from anywhere and opens it", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Draft the onboarding email");

    await page.keyboard.press("ControlOrMeta+k");

    const palette = page.getByRole("dialog", { name: "Search everything" });
    await expect(palette).toBeVisible();

    await palette.getByRole("combobox", { name: "Search" }).fill("onboarding");
    const option = palette.getByRole("option").first();
    await expect(option).toContainText("onboarding");

    await page.keyboard.press("Enter");
    await expect(palette).toBeHidden();
  });

  test("says so when nothing matches", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();

    await page.keyboard.press("ControlOrMeta+k");
    const palette = page.getByRole("dialog", { name: "Search everything" });
    await palette.getByRole("combobox", { name: "Search" }).fill("zzzznothing");

    await expect(palette.getByText(/Nothing matches/)).toBeVisible();
    await expect(palette.getByRole("option")).toHaveCount(0);
  });
});
