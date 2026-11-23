import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Todo Details Workflow
 *
 * This test file consolidates todo-details.spec.ts, dependencies.spec.ts,
 * subtasks.spec.ts, and comments.spec.ts into a single sequential workflow.
 */
test.describe("Todo Details Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Sequential Todo Details Operations", () => {
    test("Step 1: Create parent todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await todoApp.addTodo("Main Project Task !!high");

      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Main Project Task" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 2: Open details and add subtasks", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open details
      await todoApp.openTodoDetails("Main Project Task");

      // Add 3 subtasks
      await todoApp.addSubtask("Research requirements");
      await todoApp.addSubtask("Write implementation");
      await todoApp.addSubtask("Write tests");

      const subtaskItems = page.getByTestId("subtask-item");
      await expect(subtaskItems).toHaveCount(3);
      await expect(subtaskItems.first()).toContainText("Research requirements");

      await todoApp.closeOverlay();
    });

    test("Step 3: Complete a subtask", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open details
      await todoApp.openTodoDetails("Main Project Task");

      const subtaskItems = page.getByTestId("subtask-item");
      const checkbox = subtaskItems.first().getByTestId("subtask-checkbox");
      await expect(checkbox).not.toBeChecked();
      await checkbox.click();

      await expect(checkbox).toBeChecked();
      // Only the one that was clicked.
      await expect(subtaskItems.nth(1).getByTestId("subtask-checkbox")).not.toBeChecked();

      await todoApp.closeOverlay();
    });

    // Comments are covered in rich-text-editor.spec.ts. The step that stood
    // here looked for a "comment-input" test id that the app never had, so its
    // body never ran.

    test("Step 4: Create a second todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await todoApp.addTodo("Follow-up Task");

      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Follow-up Task" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 5: Verify persistence after reload", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // Verify main todo exists
      const mainTodo = page.locator('[data-testid="todo-item"]').filter({ hasText: "Main Project Task" });
      await expect(mainTodo).toBeVisible();

      // Open and verify subtasks persisted
      await todoApp.openTodoDetails("Main Project Task");

      // All three subtasks came back, and the completed one is still completed.
      const subtaskItems = page.getByTestId("subtask-item");
      await expect(subtaskItems).toHaveCount(3);
      await expect(subtaskItems.first().getByTestId("subtask-checkbox")).toBeChecked();
      await expect(subtaskItems.nth(1).getByTestId("subtask-checkbox")).not.toBeChecked();

      await todoApp.closeOverlay();
    });

    test("Step 6: Complete parent todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      const todoItem = page.getByTestId("todo-item").filter({ hasText: "Main Project Task" });
      await expect(todoItem).toHaveAttribute("data-completed", "false");

      await todoApp.toggleTodo("Main Project Task");

      await expect(todoItem).toHaveAttribute("data-completed", "true");
    });
  });
});
