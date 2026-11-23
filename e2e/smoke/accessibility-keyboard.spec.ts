import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Accessibility and Keyboard Navigation
 *
 * This test file consolidates keyboard.spec.ts and accessibility.spec.ts
 * into a single sequential workflow.
 */
test.describe("Accessibility and Keyboard Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Sequential Accessibility Tests", () => {
    test("Step 1: Set up todos for keyboard testing", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await todoApp.addTodo("Task for keyboard nav");
      await todoApp.addTodo("Second task for testing");

      const count = await todoApp.getTodoCount();
      expect(count).toBe(2);
    });

    test("Step 2: Keyboard - use / to focus search", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Press / to focus search
      await page.keyboard.press("/");
      await page.waitForTimeout(300);

      // "/" must actually focus the search box. This used to assert
      // `isFocused || true`, which cannot fail and so verified nothing.
      const searchInput = page.getByTestId("search-input");
      await expect(searchInput).toBeFocused();

      // Press Escape to clear focus
      await page.keyboard.press("Escape");
    });

    test("Step 3: Keyboard - Tab through focusable elements", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Tab moves through the header controls in the order they are shown.
      await page.getByTestId("add-todo-button").focus();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("add-note-button")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("open-focus-button")).toBeFocused();

      // ...and Shift+Tab goes back.
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("add-note-button")).toBeFocused();
    });

    test("Step 4: Keyboard - Open overlay and verify focus trap", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open todo details
      await todoApp.openTodoDetails("Task for keyboard nav");

      const dialog = page.getByRole("dialog", { name: "Task details" });
      await expect(dialog).toBeVisible();

      const focusIsInDialog = () =>
        page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement) === true);

      // Opening the dialog moves focus to its first control.
      await expect.poll(focusIsInDialog).toBe(true);

      // The two edges are where focus could escape. Shift+Tab on the first
      // control has nowhere to go but the page behind, unless the dialog wraps
      // it round to its last control...
      await page.keyboard.press("Shift+Tab");
      expect(await focusIsInDialog()).toBe(true);
      // ...and Tab on the last control wraps forward to the first again.
      await page.keyboard.press("Tab");
      expect(await focusIsInDialog()).toBe(true);
      // In between, Tab moves on inside the dialog.
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      expect(await focusIsInDialog()).toBe(true);

      await page.keyboard.press("Escape");
    });

    test("Step 5: Keyboard - Close overlay with Escape", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open and then close with Escape
      await todoApp.openTodoDetails("Task for keyboard nav");

      const overlay = page.locator('[data-testid="todo-details-overlay"]');
      await expect(overlay).toBeVisible();

      // Press Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Overlay should be closed
      await expect(overlay).not.toBeVisible();
    });

    test("Step 6: Accessibility - Verify ARIA attributes present", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await expect(page.getByRole("main")).toBeVisible();

      // The view switcher is a named tablist with exactly one selected tab.
      const tablist = page.getByRole("tablist", { name: "Views" });
      await expect(tablist).toBeVisible();
      await expect(tablist.getByRole("tab", { selected: true })).toHaveCount(1);
      await expect(page.getByTestId("view-tab-list")).toHaveAttribute("aria-selected", "true");

      // Selecting another tab moves the selection with it.
      await todoApp.switchView("kanban");
      await expect(tablist.getByRole("tab", { selected: true })).toHaveCount(1);
      await expect(page.getByTestId("view-tab-list")).toHaveAttribute("aria-selected", "false");
      await todoApp.switchView("list");

      // The header's add button says what it does.
      await expect(page.getByTestId("add-todo-button")).toHaveAccessibleName(/todo/i);
    });

    test("Step 7: Add dialog opens from the keyboard and closes on Escape", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await page.getByTestId("add-todo-button").focus();
      await page.keyboard.press("Enter");

      const input = page.getByTestId("smart-input");
      await expect(input).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(input).toBeHidden();
    });

    // Two things a keyboard or screen-reader user needs here do not exist yet,
    // so there is nothing true to assert about them:
    //
    // - Focus stays on the header button when the add dialog opens. The dialog
    //   is hand-built and has no dialog role; U0462 moves it onto Modal.
    // - The input is a contenteditable with no label, role or aria-label.
    test.fixme("Step 8: The add dialog moves focus to its input (U0462)", async () => {});
    test.fixme("Step 9: The add-todo input has an accessible name (U0199)", async () => {});
  });
});
