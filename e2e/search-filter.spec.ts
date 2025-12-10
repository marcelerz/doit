import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Search and Filter", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add test todos
    await todoApp.addTodo("Buy milk from store");
    await todoApp.addTodo("Call dentist for appointment");
    await todoApp.addTodo("Send email to team");
    await todoApp.addTodo("Review project proposal");
  });

  test("should filter todos by search text", async ({ page, todoApp }) => {
    await todoApp.search("email");

    // Only the email todo should be visible
    const visibleTodos = page.locator('[data-testid="todo-item"]:visible');
    await expect(visibleTodos).toHaveCount(1);

    const todoText = await visibleTodos.first().locator('[data-testid="todo-text"]').textContent();
    expect(todoText).toContain("email");
  });

  test("should show all todos when search is cleared", async ({ page, todoApp }) => {
    // First filter
    await todoApp.search("email");
    await page.waitForTimeout(300);

    // Then clear
    await todoApp.clearSearch();

    // All todos should be visible again
    const visibleTodos = page.locator('[data-testid="todo-item"]');
    await expect(visibleTodos).toHaveCount(4);
  });

  test("should handle search with no results", async ({ page, todoApp }) => {
    await todoApp.search("nonexistent xyz123");

    // No todos should be visible
    const visibleTodos = page.locator('[data-testid="todo-item"]').filter({ visible: true });
    await expect(visibleTodos).toHaveCount(0);
  });

  test("should search case-insensitively", async ({ page, todoApp }) => {
    await todoApp.search("MILK");

    // The milk todo should still be found
    const visibleTodos = page.locator('[data-testid="todo-item"]').filter({ visible: true });
    await expect(visibleTodos).toHaveCount(1);
  });

  test("should search across multiple words", async ({ page, todoApp }) => {
    await todoApp.search("project");

    // The project proposal todo should be found
    const visibleTodos = page.locator('[data-testid="todo-item"]').filter({ visible: true });
    await expect(visibleTodos).toHaveCount(1);
  });
});
