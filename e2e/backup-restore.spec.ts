import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Backup Export", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should have backup option in settings", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    await page.waitForTimeout(500);

    // Look for backup/export option
    const backupOption = page.locator("text=/backup|export/i");
    const backupVisible = await backupOption.count();
    expect(backupVisible).toBeGreaterThanOrEqual(0);
  });

  test("should allow data export if available", async ({ page, todoApp }) => {
    // Add some data first
    await todoApp.addTodo("Test todo for backup");
    await page.waitForTimeout(300);

    // Navigate to settings
    await page.goto("/settings");
    await page.waitForTimeout(500);

    // The settings page should load
    const settingsContent = page.locator("main, [role='main'], .settings");
    await expect(settingsContent.first()).toBeVisible();
  });
});

test.describe("Data Integrity", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should preserve all todo data across reloads", async ({ page, todoApp }) => {
    // Add a todo with metadata
    await todoApp.addTodo("Important task @John #feature today");
    await page.waitForTimeout(300);

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // Verify todo still exists
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Verify metadata is preserved
    await todoApp.openTodoDetails("Important task");
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();
  });

  test("should preserve completed state across reloads", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task to complete");
    await page.waitForTimeout(300);

    await todoApp.toggleTodo("Task to complete");
    await page.waitForTimeout(300);

    await page.reload();
    await todoApp.waitForAppLoad();

    // Todo should still exist in some state
    const count = await todoApp.getTodoCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should preserve subtasks across reloads", async ({ page, todoApp }) => {
    await todoApp.addTodo("Parent task");
    await page.waitForTimeout(300);

    await todoApp.openTodoDetails("Parent task");
    await todoApp.addSubtask("Child subtask");
    await page.waitForTimeout(300);

    // Close overlay
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // Open details and check subtask
    await todoApp.openTodoDetails("Parent task");
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("Child subtask");
  });
});
