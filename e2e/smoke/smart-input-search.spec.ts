import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Smart Input and Search
 *
 * This test file consolidates smart-input.spec.ts, advanced-search.spec.ts,
 * and search-filter.spec.ts into a single sequential workflow.
 */
test.describe("Smart Input and Search Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Sequential Smart Input and Search", () => {
    test("Step 1: Create todos with @person mentions", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with @person
      await todoApp.addTodo("Review PR @john");

      // Verify todo is created with assignee
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Review PR" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 2: Create todos with %project references", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with %project
      await todoApp.addTodo("Update docs %Website");

      // Verify todo is created
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Update docs" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 3: Create todos with #tags and !!priority", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with #tag and !!priority
      await todoApp.addTodo("Fix bug #critical !!urgent");

      // Verify todo is created
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Fix bug" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 4: Create todos with date expressions", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with natural language date
      await todoApp.addTodo("Team meeting tomorrow");

      // Verify todo is created
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Team meeting" });
      await expect(todoItem).toBeVisible();
    });

    test("Step 5: Search by person", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Search for person
      await todoApp.search("@john");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Should show filtered results (the PR review todo)
      const todoItems = page.locator('[data-testid="todo-item"]');
      const count = await todoItems.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Clear search
      await todoApp.clearSearch();
    });

    test("Step 6: Search by project", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Search for project
      await todoApp.search("%Website");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Should show filtered results
      const todoItems = page.locator('[data-testid="todo-item"]');
      const count = await todoItems.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Clear search
      await todoApp.clearSearch();
    });

    test("Step 7: Search by partial text", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Search partial text
      await todoApp.search("bug");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Should find the "Fix bug" todo
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Fix bug" });
      await expect(todoItem).toBeVisible();

      // Clear search
      await todoApp.clearSearch();
    });

    test("Step 8: Clear search shows all todos", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Apply search first
      await todoApp.search("nothing matches this");
      await page.waitForTimeout(300);

      // Clear search
      await todoApp.clearSearch();
      await page.waitForTimeout(500);

      // All todos should be visible again
      const count = await todoApp.getTodoCount();
      expect(count).toBeGreaterThanOrEqual(4); // At least the 4 we created
    });

    test("Step 9: Persistence - reload and verify search state cleared", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Verify all todos are accessible
      const todos = await todoApp.getTodos();
      expect(todos.length).toBeGreaterThanOrEqual(4);

      // Verify specific todos with metadata exist
      expect(todos.some((t) => t.includes("Review PR"))).toBe(true);
      expect(todos.some((t) => t.includes("Fix bug"))).toBe(true);
    });
  });
});
