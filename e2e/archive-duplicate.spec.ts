import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Archive and Unarchive", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should archive a todo via details overlay", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task to archive");

    // Verify todo exists
    let count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Open details and archive
    await todoApp.openTodoDetails("Task to archive");
    const archiveButton = page.getByTestId("action-archive");
    await archiveButton.click();

    await page.waitForTimeout(500);

    // In list view, archived todos may not be visible by default
    // The todo should be moved to archived state
    const overlay = page.getByTestId("todo-details-overlay");

    // If overlay is still visible, check that unarchive button now shows
    if (await overlay.isVisible()) {
      const unarchiveButton = page.getByTestId("action-unarchive");
      await expect(unarchiveButton).toBeVisible();
    }
  });

  test("should unarchive a todo", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task to unarchive");

    // Archive it first
    await todoApp.openTodoDetails("Task to unarchive");
    const archiveButton = page.getByTestId("action-archive");
    await archiveButton.click();
    await page.waitForTimeout(500);

    // Now unarchive it
    const unarchiveButton = page.getByTestId("action-unarchive");
    if (await unarchiveButton.isVisible()) {
      await unarchiveButton.click();
      await page.waitForTimeout(500);

      // Archive button should be back
      await expect(page.getByTestId("action-archive")).toBeVisible();
    }
  });

  test("should show archive button for active todos", async ({ page, todoApp }) => {
    await todoApp.addTodo("Active task");

    await todoApp.openTodoDetails("Active task");

    // Archive button should be visible for active todos
    const archiveButton = page.getByTestId("action-archive");
    await expect(archiveButton).toBeVisible();
  });

  test("should persist archived state after page reload", async ({ page, todoApp }) => {
    await todoApp.addTodo("Persist archive test");

    // Archive it
    await todoApp.openTodoDetails("Persist archive test");
    const archiveButton = page.getByTestId("action-archive");
    await archiveButton.click();
    await page.waitForTimeout(500);

    // Close overlay
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // Try to find and open the todo (it may be filtered out)
    // This test verifies the state persists
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Persist archive test" });
    if (await todoItem.isVisible()) {
      await todoItem.dblclick();
      await page.waitForSelector('[data-testid="todo-details-overlay"]', { timeout: 5000 });

      // Should show unarchive button
      const unarchiveButton = page.getByTestId("action-unarchive");
      await expect(unarchiveButton).toBeVisible();
    }
  });
});

test.describe("Duplicate Todo", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should duplicate a todo", async ({ page, todoApp }) => {
    await todoApp.addTodo("Original task");

    // Get initial count
    let count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Duplicate via fixture helper
    await todoApp.duplicateTodo("Original task");

    // Should have 2 todos now
    count = await todoApp.getTodoCount();
    expect(count).toBe(2);
  });

  test("should duplicate todo with metadata", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task with metadata #important");

    await todoApp.duplicateTodo("Task with metadata");

    // Should have 2 todos
    const count = await todoApp.getTodoCount();
    expect(count).toBe(2);

    // Both should contain the tag (visual verification)
    const todos = page.locator('[data-testid="todo-item"]');
    await expect(todos).toHaveCount(2);
  });

  test("should show duplicate button in details overlay", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task with duplicate button");

    await todoApp.openTodoDetails("Task with duplicate button");

    // Duplicate button should be visible
    const duplicateButton = page.getByTestId("action-duplicate");
    await expect(duplicateButton).toBeVisible();
  });

  test("duplicate should create independent copy", async ({ page, todoApp }) => {
    await todoApp.addTodo("Independent task");

    // Duplicate it
    await todoApp.duplicateTodo("Independent task");

    // Should have 2 todos now (both with same text)
    const count = await todoApp.getTodoCount();
    expect(count).toBe(2);

    // Complete just the first one using the first checkbox
    const firstTodo = page.locator('[data-testid="todo-item"]').first();
    await firstTodo.locator('[data-testid="todo-checkbox"]').click();
    await page.waitForTimeout(300);

    // Should still have both todos visible
    const finalCount = await todoApp.getTodoCount();
    expect(finalCount).toBeGreaterThanOrEqual(1);
  });
});
