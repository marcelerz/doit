import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";
import { STORAGE_KEYS } from "../../src/storage/keys";

/**
 * Smoke Test: Views Workflow
 *
 * This test file consolidates views.spec.ts, kanban.spec.ts,
 * calendar.spec.ts, gantt.spec.ts, and view-presets.spec.ts
 * into a single sequential workflow.
 */
test.describe("Views Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
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

      // The board itself, with the tasks on it as cards.
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toBeVisible();
      await expect(kanbanView.getByTestId("todo-item").filter({ hasText: "Task A" })).toBeVisible();
      await expect(kanbanView.getByTestId("todo-item")).toHaveCount(5);
    });

    test("Step 4: Open todo details from current view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open details for a todo
      await todoApp.openTodoDetails("Task A");

      // The dialog is the one for the task that was opened.
      const dialog = page.getByRole("dialog", { name: "Task details" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("Task A");

      await todoApp.closeOverlay();
      await expect(dialog).toBeHidden();
    });

    test("Step 5: Switch to Calendar view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch to calendar
      await todoApp.switchView("calendar");

      await expect(page.getByTestId("calendar-view")).toBeVisible();
      await expect(page.getByRole("grid")).toBeVisible();
    });

    test("Step 6: Switch to Gantt view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Switch to gantt
      await todoApp.switchView("gantt");

      await expect(page.getByTestId("gantt-view")).toBeVisible();
      await expect(page.getByRole("region", { name: "Gantt Chart Schedule" })).toBeVisible();
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

      await todoApp.switchView("kanban");
      // Wait for the choice to be stored, not for a fixed time.
      await expect
        .poll(async () => JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.UI_OPTIONS)) ?? "{}").activeTab)
        .toBe("kanban");

      await page.reload();
      await todoApp.waitForAppLoad();

      // The app comes back on the view it was left on.
      await expect(page.getByTestId("view-tab-kanban")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("kanban-view")).toBeVisible();

      // Switch back to list for cleanup
      await todoApp.switchView("list");

      // Verify todos preserved
      const count = await todoApp.getTodoCount();
      expect(count).toBe(5);
    });
  });
});
