import { test, expect } from "../fixtures/todo-app.fixture";

/**
 * Smoke Test: CRUD Workflow
 *
 * This test file consolidates todo-crud.spec.ts, archive-duplicate.spec.ts,
 * and bulk-operations.spec.ts into a single sequential workflow.
 *
 * The tests build on previous state, reducing setup overhead.
 */
test.describe("CRUD Workflow", () => {
  // Only clear storage once at the beginning
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

  test.describe.serial("Sequential CRUD Operations", () => {
    test("Step 1: Empty state - app loads with no todos", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Verify app is loaded with Add button visible
      const addButton = page.getByTestId("add-todo-button");
      await expect(addButton).toBeVisible();

      // No todos should exist
      const count = await todoApp.getTodoCount();
      expect(count).toBe(0);
    });

    test("Step 2: Add todos with varied metadata", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add 5 todos with different metadata
      await todoApp.addTodo("Buy groceries @john !!high tomorrow");
      await todoApp.addTodo("Review code %ProjectA #coding");
      await todoApp.addTodo("Call dentist due:next monday");
      await todoApp.addTodo("Write tests !!medium 2h");
      await todoApp.addTodo("Plan meeting @sarah %ProjectB");

      // Verify all 5 todos exist
      const count = await todoApp.getTodoCount();
      expect(count).toBe(5);
    });

    test("Step 3: Complete todos", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Complete 2 todos
      await todoApp.toggleTodo("Buy groceries");
      await todoApp.toggleTodo("Call dentist");

      // Verify they still appear (might be in completed section)
      const count = await todoApp.getTodoCount();
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 active
    });

    test("Step 4: Archive a completed todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Archive "Call dentist" todo
      await todoApp.archiveTodo("Call dentist");

      // Wait for archive to complete
      await page.waitForTimeout(500);

      // The archived todo should be hidden in default view
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Call dentist" });
      await expect(todoItem).not.toBeVisible({ timeout: 5000 });
    });

    test("Step 5: Duplicate a todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Get initial count
      const initialCount = await todoApp.getTodoCount();

      // Duplicate "Write tests"
      await todoApp.duplicateTodo("Write tests");

      // Verify count increased
      const newCount = await todoApp.getTodoCount();
      expect(newCount).toBe(initialCount + 1);
    });

    test("Step 6: Delete a todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Get initial count
      const initialCount = await todoApp.getTodoCount();

      // Delete "Plan meeting"
      await todoApp.deleteTodo("Plan meeting");

      // Wait for delete (with undo period)
      await page.waitForTimeout(12000);

      // Verify count decreased
      const newCount = await todoApp.getTodoCount();
      expect(newCount).toBeLessThan(initialCount);
    });

    test("Step 7: Persistence - reload and verify state", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Get current state
      const initialTodos = await todoApp.getTodos();
      const initialCount = initialTodos.length;

      // Hard reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // Verify state persisted
      const afterReloadCount = await todoApp.getTodoCount();
      expect(afterReloadCount).toBe(initialCount);

      // Verify specific todos still exist
      const todos = await todoApp.getTodos();
      expect(todos.some((t) => t.includes("Review code"))).toBe(true);
      expect(todos.some((t) => t.includes("Write tests"))).toBe(true);
    });
  });
});
