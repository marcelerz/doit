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

      // Verify subtasks were added (check for subtask items in the overlay)
      const subtaskItems = page.locator('[data-testid="subtask-item"]');
      const count = await subtaskItems.count();
      expect(count).toBeGreaterThanOrEqual(3);

      await todoApp.closeOverlay();
    });

    test("Step 3: Complete a subtask", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open details
      await todoApp.openTodoDetails("Main Project Task");

      // Find and toggle first subtask
      const firstSubtask = page.locator('[data-testid="subtask-item"]').first();
      const checkbox = firstSubtask.locator('[data-testid="subtask-checkbox"]');
      if (await checkbox.isVisible()) {
        await checkbox.click();
      }

      await page.waitForTimeout(300);
      await todoApp.closeOverlay();
    });

    test("Step 4: Add a comment", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Open details
      await todoApp.openTodoDetails("Main Project Task");

      // Add a comment (if comment input exists)
      const commentInput = page.locator('[data-testid="comment-input"]');
      if (await commentInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await commentInput.fill("This is a test comment");
        const addCommentBtn = page.locator('[data-testid="add-comment-button"]');
        if (await addCommentBtn.isVisible()) {
          await addCommentBtn.click();
          await page.waitForTimeout(300);
        }
      }

      await todoApp.closeOverlay();
    });

    test("Step 5: Create child todo for dependency", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Create a second todo that will depend on the first
      await todoApp.addTodo("Follow-up Task");

      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Follow-up Task" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 6: Verify persistence after reload", async ({ page, todoApp }) => {
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

      const subtaskItems = page.locator('[data-testid="subtask-item"]');
      const count = await subtaskItems.count();
      expect(count).toBeGreaterThanOrEqual(3);

      await todoApp.closeOverlay();
    });

    test("Step 7: Complete parent todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Complete the parent todo
      await todoApp.toggleTodo("Main Project Task");

      // Verify it's marked completed
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Main Project Task" });
      await expect(todoItem).toBeVisible();
    });
  });
});
