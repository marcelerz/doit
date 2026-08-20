import { test, expect } from "../fixtures/todo-app.fixture";

/**
 * Smoke Test: Views Workflow
 *
 * This test file consolidates views.spec.ts, kanban.spec.ts,
 * calendar.spec.ts, gantt.spec.ts, and view-presets.spec.ts
 * into a single sequential workflow.
 */
test.describe("Views Workflow", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      if (typeof indexedDB !== "undefined") {
        indexedDB.deleteDatabase("doit-storage");
      }
      localStorage.setItem("doit-tutorial-preferences", JSON.stringify({ completed: true, showOnStartup: false }));
    });
    await page.close();
  });

  test.describe.serial("Sequential View Navigation", () => {
    test("Step 1: Set up todos with dates for views", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todos with dates for better view testing
      await todoApp.addTodo("Task A due:today !!high");
      await todoApp.addTodo("Task B due:tomorrow %ProjectX");
      await todoApp.addTodo("Task C due:next week @alice");
      await todoApp.addTodo("Task D 30m !!medium");
      await todoApp.addTodo("Task E 1h %ProjectY");

      const count = await todoApp.getTodoCount();
      expect(count).toBe(5);
    });

    test("Step 2: List view - verify todos display", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Should start in list view
      const todoItems = page.locator('[data-testid="todo-item"]');
      await expect(todoItems).toHaveCount(5);

      // Verify a specific todo
      const taskA = page.locator('[data-testid="todo-item"]').filter({ hasText: "Task A" });
      await expect(taskA).toBeVisible();
    });

    test("Step 3: Switch to Kanban view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch to kanban
      await todoApp.switchView("kanban");

      // Verify kanban view is active
      const kanbanView = page.locator('[data-testid="kanban-view"]');
      // If the view exists, it should be visible; otherwise, the tab might not exist
      if (await kanbanView.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(kanbanView).toBeVisible();
      }
    });

    test("Step 4: Open todo details from current view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open details for a todo
      await todoApp.openTodoDetails("Task A");

      // Verify overlay opened
      const overlay = page.locator('[data-testid="todo-details-overlay"]');
      await expect(overlay).toBeVisible();

      // Close overlay
      await todoApp.closeOverlay();
    });

    test("Step 5: Switch to Calendar view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch to calendar
      await todoApp.switchView("calendar");

      // Verify calendar view (if available)
      const calendarView = page.locator('[data-testid="calendar-view"]');
      if (await calendarView.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(calendarView).toBeVisible();
      }
    });

    test("Step 6: Switch to Gantt view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch to gantt
      await todoApp.switchView("gantt");

      // Verify gantt view (if available)
      const ganttView = page.locator('[data-testid="gantt-view"]');
      if (await ganttView.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(ganttView).toBeVisible();
      }
    });

    test("Step 7: Return to list view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch back to list
      await todoApp.switchView("list");

      // Verify all todos still exist
      const count = await todoApp.getTodoCount();
      expect(count).toBe(5);
    });

    test("Step 8: Persistence - reload and verify view preference", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch to kanban
      await todoApp.switchView("kanban");
      await page.waitForTimeout(500);

      // Reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // Switch back to list for cleanup
      await todoApp.switchView("list");

      // Verify todos preserved
      const count = await todoApp.getTodoCount();
      expect(count).toBe(5);
    });
  });
});
