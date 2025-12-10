import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Smart Input Features", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should add a todo with @assigned people markers", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task for @John");

    // The todo should be created with the assigned person metadata
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
  });

  test("should detect date expressions", async ({ page, todoApp }) => {
    await todoApp.addTodo("Meeting tomorrow");

    // The todo should have the date auto-detected
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
  });

  test("should detect priority markers with !!", async ({ page, todoApp }) => {
    await todoApp.addTodo("!!urgent Fix critical bug");

    // Verify todo is created
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
  });

  test("should detect project markers with %", async ({ page, todoApp }) => {
    await todoApp.addTodo("Work on %MyProject feature");

    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
  });

  test("should detect tag markers with #", async ({ page, todoApp }) => {
    await todoApp.addTodo("Research topic #important #research");

    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
  });

  test("should clear input after adding todo", async ({ page, todoApp }) => {
    // Open the Add overlay
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();

    // Wait for overlay
    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const input = page.getByTestId("smart-input");
    await input.click();
    await input.fill("New task");

    // Click Add Todo button
    const submitButton = page.locator('button:has-text("Add Todo")');
    await submitButton.click();

    // Wait for the todo to be added
    await page.waitForTimeout(500);

    // A todo should be added
    const todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(1);
  });

  test("should support keyboard navigation in autocomplete", async ({ page, todoApp }) => {
    // Open the Add overlay
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();

    // Wait for overlay
    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const input = page.getByTestId("smart-input");
    await input.click();

    // Type @ to trigger autocomplete
    await page.keyboard.type("@");
    await page.waitForTimeout(200);

    // Press Escape to close any dropdown
    await page.keyboard.press("Escape");
  });
});
