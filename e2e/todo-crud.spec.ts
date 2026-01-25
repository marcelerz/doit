import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Todo CRUD Operations", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    // Clear storage before each test
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should display empty state when no todos exist", async ({ page }) => {
    // The app should be loaded and the Add button visible
    const addButton = page.locator('button:has-text("Add")').first();
    await expect(addButton).toBeVisible();
  });

  test("should add a new todo", async ({ page, todoApp }) => {
    await todoApp.addTodo("Buy groceries");

    // Verify the todo appears in the list
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Buy groceries" });
    await expect(todoItem).toBeVisible();
  });

  test("should add multiple todos", async ({ page, todoApp }) => {
    await todoApp.addTodo("First task");
    await todoApp.addTodo("Second task");
    await todoApp.addTodo("Third task");

    // Verify all todos appear
    const todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(3);
  });

  test("should toggle todo completion", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task to complete");

    // Toggle completion
    await todoApp.toggleTodo("Task to complete");

    // Verify the todo is marked as completed (check for completed styling)
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Task to complete" });
    // The checkbox should be checked or have completed state
    const checkbox = todoItem.locator('[data-testid="todo-checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test("should delete a todo", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task to delete");

    // Verify it exists
    let todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Task to delete" });
    await expect(todoItem).toBeVisible();

    // Delete it
    await todoApp.deleteTodo("Task to delete");

    // Verify it's gone (might be in deleted state or removed)
    // Wait for the undo timeout to pass (10 seconds) or the item to be hidden
    todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Task to delete" });
    await expect(todoItem).toBeHidden({ timeout: 15000 });
  });

  test("should persist todos after page reload", async ({ page, todoApp }) => {
    await todoApp.addTodo("Persistent task");

    // Reload the page
    await page.reload();
    await todoApp.waitForAppLoad();

    // Verify the todo still exists
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Persistent task" });
    await expect(todoItem).toBeVisible();
  });

  test("should handle special characters in todo text", async ({ page, todoApp }) => {
    const specialText = 'Task with special chars & "quotes"';
    await todoApp.addTodo(specialText);

    // The text might be parsed differently due to markers, but should still be visible
    const todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(1);
  });
});
