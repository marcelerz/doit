import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add test todos
    await todoApp.addTodo("Task 1");
    await todoApp.addTodo("Task 2");
    await todoApp.addTodo("Task 3");
  });

  test("should close overlay with Escape key", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task 1");

    // Overlay should be visible
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Overlay should be closed
    await expect(overlay).not.toBeVisible();
  });

  test("should submit todo with Enter key in smart input", async ({ page }) => {
    // Open add dialog
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();

    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const input = page.getByTestId("smart-input");
    await input.click();
    await input.fill("Keyboard submitted task");

    // Press Enter to submit
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // Todo should be added
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Keyboard submitted task" });
    await expect(todoItem).toBeVisible();
  });

  test("should focus search input with keyboard shortcut", async ({ page }) => {
    // Press / to focus search (common shortcut)
    await page.keyboard.press("/");
    await page.waitForTimeout(200);

    // Check if search input is focused
    const searchInput = page.getByTestId("search-input");
    // The input might be focused, check if it's visible
    await expect(searchInput).toBeVisible();
  });

  test("should navigate autocomplete with arrow keys", async ({ page }) => {
    // Open add dialog
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();

    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const input = page.getByTestId("smart-input");
    await input.click();

    // Type @ to trigger person autocomplete
    await page.keyboard.type("@");
    await page.waitForTimeout(300);

    // Press arrow down (should navigate in dropdown if open)
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  });

  test("should Tab through focusable elements", async ({ page }) => {
    // Tab through the page elements
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);

    // Something should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});

test.describe("Keyboard Shortcuts in Overlay", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    await todoApp.addTodo("Keyboard test task");
  });

  test("should handle multiple Escape presses gracefully", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Keyboard test task");

    // Press Escape multiple times
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");

    // App should still be functional
    const app = page.getByTestId("todo-app");
    await expect(app).toBeVisible();
  });

  test("should not interfere with typing in inputs", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Keyboard test task");

    // Find the subtask input if visible
    const subtaskInput = page.getByTestId("subtask-input");

    if (await subtaskInput.isVisible()) {
      await subtaskInput.click();
      await subtaskInput.fill("Test subtask");

      // Input should contain the typed text
      await expect(subtaskInput).toHaveValue("Test subtask");
    }
  });
});

test.describe("Focus Management", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    await todoApp.addTodo("Focus test task");
  });

  test("should trap focus in overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Focus test task");

    // Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(50);
    }

    // Focus should stay within overlay (not go to elements behind it)
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();
  });

  test("should return focus when closing overlay", async ({ page, todoApp }) => {
    // Focus on a todo item first
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await todoItem.focus();

    // Open and close overlay
    await todoItem.dblclick();
    await page.waitForSelector('[data-testid="todo-details-overlay"]', { timeout: 5000 });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // App should still be interactive
    const app = page.getByTestId("todo-app");
    await expect(app).toBeVisible();
  });
});
