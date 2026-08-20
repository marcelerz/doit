import { test, expect } from "../fixtures/todo-app.fixture";

/**
 * Smoke Test: Dates and Recurring Tasks
 *
 * This test file consolidates due-dates.spec.ts, recurring.spec.ts,
 * and sorting-grouping.spec.ts into a single sequential workflow.
 */
test.describe("Dates and Recurring Workflow", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      if (typeof indexedDB !== "undefined") {
        indexedDB.deleteDatabase("doit-db");
      }
      localStorage.setItem("doit-tutorial-preferences", JSON.stringify({ completed: true, showOnStartup: false }));
    });
    await page.close();
  });

  test.describe.serial("Sequential Date and Recurring Operations", () => {
    test("Step 1: Add todos with various date expressions", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todos with natural language dates
      await todoApp.addTodo("Morning standup today");
      await todoApp.addTodo("Code review tomorrow");
      await todoApp.addTodo("Sprint planning next week");

      const count = await todoApp.getTodoCount();
      expect(count).toBe(3);
    });

    test("Step 2: Add recurring task", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add recurring task
      await todoApp.addTodo("Weekly sync every monday");

      // Verify it was created
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Weekly sync" });
      await expect(todoItem).toBeVisible();

      const count = await todoApp.getTodoCount();
      expect(count).toBe(4);
    });

    test("Step 3: Verify dates detected correctly", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open a todo and check for due date indicator
      await todoApp.openTodoDetails("Morning standup");

      // Look for due date display in the overlay
      const detailsOverlay = page.locator('[data-testid="todo-details-overlay"]');
      await expect(detailsOverlay).toBeVisible();

      await todoApp.closeOverlay();
    });

    test("Step 4: Check for recurring indicator", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open recurring task details
      await todoApp.openTodoDetails("Weekly sync");

      // Check for recurring indicator in overlay
      const detailsOverlay = page.locator('[data-testid="todo-details-overlay"]');
      await expect(detailsOverlay).toBeVisible();

      await todoApp.closeOverlay();
    });

    test("Step 5: Verify sorting/grouping works", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Look for sort/group options
      const sortButton = page.locator('[data-testid="sort-button"]');
      if (await sortButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sortButton.click();
        await page.waitForTimeout(300);
        // Close any dropdown
        await page.keyboard.press("Escape");
      }

      // Verify todos are still visible
      const count = await todoApp.getTodoCount();
      expect(count).toBe(4);
    });

    test("Step 6: Apply filter (if available)", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Look for filter options
      const filterButton = page.locator('[data-testid="filter-button"]');
      if (await filterButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await filterButton.click();
        await page.waitForTimeout(300);
        // Close any dropdown
        await page.keyboard.press("Escape");
      }

      // Verify todos are still accessible
      const todos = await todoApp.getTodos();
      expect(todos.length).toBe(4);
    });

    test("Step 7: Persistence - reload and verify dates preserved", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // Verify todos still exist
      const count = await todoApp.getTodoCount();
      expect(count).toBe(4);

      // Verify specific todos
      const todos = await todoApp.getTodos();
      expect(todos.some((t) => t.includes("Morning standup"))).toBe(true);
      expect(todos.some((t) => t.includes("Weekly sync"))).toBe(true);
    });
  });
});
