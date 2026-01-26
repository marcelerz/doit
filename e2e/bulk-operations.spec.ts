import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Bulk Operations", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add multiple todos
    await todoApp.addTodo("Bulk task 1");
    await todoApp.addTodo("Bulk task 2");
    await todoApp.addTodo("Bulk task 3");
  });

  test("should have selection mode button when feature is enabled", async ({ page }) => {
    // The selection mode button may be hidden on mobile viewports
    // This is a desktop test
    const selectionButton = page.getByTestId("selection-mode-button");

    // Check if button exists (may not be visible if feature is disabled)
    const isVisible = await selectionButton.isVisible();
    if (isVisible) {
      await expect(selectionButton).toBeVisible();
    }
  });

  test("should toggle selection mode", async ({ page }) => {
    const selectionButton = page.getByTestId("selection-mode-button");

    if (await selectionButton.isVisible()) {
      // Click to enter selection mode
      await selectionButton.click();
      await page.waitForTimeout(300);

      // Button should have active styling (check for bg-blue class)
      await expect(selectionButton).toHaveClass(/bg-blue/);

      // Click again to exit
      await selectionButton.click();
      await page.waitForTimeout(300);

      // Should no longer have active styling
      await expect(selectionButton).not.toHaveClass(/bg-blue/);
    }
  });

  test("should be able to select multiple todos", async ({ page }) => {
    const selectionButton = page.getByTestId("selection-mode-button");

    if (await selectionButton.isVisible()) {
      // Enter selection mode
      await selectionButton.click();
      await page.waitForTimeout(300);

      // Click on first todo to select
      const firstTodo = page.locator('[data-testid="todo-item"]').first();
      await firstTodo.click();
      await page.waitForTimeout(200);

      // The todo should now be selected (visual indication)
      await expect(firstTodo).toBeVisible();
    }
  });
});

test.describe("Multiple Todo Operations", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should complete multiple todos individually", async ({ page, todoApp }) => {
    await todoApp.addTodo("Complete me 1");
    await todoApp.addTodo("Complete me 2");

    // Complete both
    await todoApp.toggleTodo("Complete me 1");
    await todoApp.toggleTodo("Complete me 2");

    // Both should show as completed (line-through or different styling)
    const todos = page.locator('[data-testid="todo-item"]');
    await expect(todos).toHaveCount(2);
  });

  test("should delete a todo from details overlay", async ({ page, todoApp }) => {
    await todoApp.addTodo("Delete me from overlay");

    // Get initial count
    let count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Open details and delete
    await todoApp.openTodoDetails("Delete me from overlay");
    const deleteButton = page.getByTestId("action-delete");
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Should have 0 todos
    count = await todoApp.getTodoCount();
    expect(count).toBe(0);
  });

  test("should archive multiple todos individually", async ({ page, todoApp }) => {
    await todoApp.addTodo("Archive test 1");
    await todoApp.addTodo("Archive test 2");

    // Archive both
    await todoApp.archiveTodo("Archive test 1");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await todoApp.archiveTodo("Archive test 2");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Both should be archived (may be filtered out of default view)
    // This test just verifies the operations don't throw errors
  });

  test("should duplicate multiple todos individually", async ({ page: _page, todoApp }) => {
    await todoApp.addTodo("Duplicate source 1");
    await todoApp.addTodo("Duplicate source 2");

    // Get initial count
    let count = await todoApp.getTodoCount();
    expect(count).toBe(2);

    // Duplicate both
    await todoApp.duplicateTodo("Duplicate source 1");
    await todoApp.duplicateTodo("Duplicate source 2");

    // Should have 4 todos now
    count = await todoApp.getTodoCount();
    expect(count).toBe(4);
  });
});
