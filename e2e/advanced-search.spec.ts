import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Advanced Search", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add various todos with different metadata
    await todoApp.addTodo("Meeting with @John tomorrow");
    await todoApp.addTodo("Review %ProjectX documentation");
    await todoApp.addTodo("!!urgent Fix production bug");
    await todoApp.addTodo("Research #learning new framework");
    await todoApp.addTodo("Call client next week");
  });

  test("should search by assigned person", async ({ page, todoApp }) => {
    await todoApp.search("John");

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    // Should find the todo with @John
    await expect(visibleTodos.first()).toContainText("John");
  });

  test("should search by project name", async ({ page, todoApp }) => {
    await todoApp.search("ProjectX");

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos.first()).toContainText("ProjectX");
  });

  test("should search by tag", async ({ page, todoApp }) => {
    await todoApp.search("learning");

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
  });

  test("should search by priority", async ({ page, todoApp }) => {
    await todoApp.search("urgent");

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos.first()).toContainText("bug");
  });

  test("should search partial words", async ({ page, todoApp }) => {
    await todoApp.search("meet");

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
    await expect(visibleTodos.first()).toContainText("Meeting");
  });

  test("should handle special characters in search", async ({ page, todoApp }) => {
    await todoApp.search("@");

    // Should not crash, may or may not find results
    const app = page.getByTestId("todo-app");
    await expect(app).toBeVisible();
  });

  test("should update results as user types", async ({ page, todoApp }) => {
    const searchInput = page.getByTestId("search-input");

    // Type "c" - should match "Call" and "client"
    await searchInput.fill("c");
    await page.waitForTimeout(300);

    let visibleTodos = page.locator('[data-testid="todo-item"]');
    const countAfterC = await visibleTodos.count();

    // Type "call" - should narrow results
    await searchInput.fill("call");
    await page.waitForTimeout(300);

    visibleTodos = page.locator('[data-testid="todo-item"]');
    const countAfterCall = await visibleTodos.count();

    // Should have same or fewer results
    expect(countAfterCall).toBeLessThanOrEqual(countAfterC);
  });

  test("should clear search and show all todos", async ({ page, todoApp }) => {
    // First filter to one result
    await todoApp.search("bug");

    let visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);

    // Clear search
    await todoApp.clearSearch();

    // All todos should be visible
    visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(5);
  });
});

test.describe("Search Edge Cases", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should handle empty search gracefully", async ({ page, todoApp }) => {
    await todoApp.addTodo("Test todo");

    await todoApp.search("");
    await page.waitForTimeout(300);

    // Should show all todos
    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
  });

  test("should handle whitespace-only search", async ({ page, todoApp }) => {
    await todoApp.addTodo("Test todo");

    await todoApp.search("   ");
    await page.waitForTimeout(300);

    // Should show all todos (whitespace is trimmed)
    const app = page.getByTestId("todo-app");
    await expect(app).toBeVisible();
  });

  test("should handle very long search query", async ({ page, todoApp }) => {
    await todoApp.addTodo("Short todo");

    const longQuery = "a".repeat(100);
    await todoApp.search(longQuery);
    await page.waitForTimeout(300);

    // Should not crash
    const app = page.getByTestId("todo-app");
    await expect(app).toBeVisible();
  });

  test("should be case insensitive for mixed case searches", async ({ page, todoApp }) => {
    await todoApp.addTodo("MixedCaseTask");

    await todoApp.search("MIXEDCASETASK");
    await page.waitForTimeout(300);

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
  });

  test("should handle unicode characters", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task with émojis 🎉");

    await todoApp.search("émojis");
    await page.waitForTimeout(300);

    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(1);
  });
});
