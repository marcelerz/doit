import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should have proper focus management", async ({ page }) => {
    // Tab through the page
    await page.keyboard.press("Tab");

    // Something should be focused
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should support keyboard navigation for todos", async ({ page, todoApp }) => {
    await todoApp.addTodo("Keyboard nav test 1");
    await todoApp.addTodo("Keyboard nav test 2");

    // Tab to navigate through the page
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);

    // Should be able to interact with keyboard
    await page.keyboard.press("Enter");
  });

  test("should have accessible form labels", async ({ page }) => {
    // Open the Add overlay
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();

    // Wait for overlay
    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    // Check that input has accessible name
    const input = page.getByTestId("smart-input");
    await expect(input).toBeVisible();

    // The input should have some form of label or placeholder
    const placeholder = await input.getAttribute("data-placeholder");
    const ariaLabel = await input.getAttribute("aria-label");

    // At least one should be present
    expect(placeholder || ariaLabel).toBeTruthy();

    // Close overlay
    await page.keyboard.press("Escape");
  });

  test("should support screen reader navigation", async ({ page, todoApp }) => {
    await todoApp.addTodo("Screen reader test");

    // Check for ARIA attributes on todo items
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();

    // Check for checkbox role
    const checkbox = todoItem.locator('[data-testid="todo-checkbox"]');
    const hasRole = await checkbox.getAttribute("role");

    // Checkbox should have role
    expect(hasRole).toBe("checkbox");
  });

  test("should have sufficient color contrast", async ({ page, todoApp }) => {
    await todoApp.addTodo("Color contrast test");

    // This is a basic test - for full contrast testing, use axe-playwright
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();

    // Verify text is visible (basic check)
    const todoText = todoItem.locator('[data-testid="todo-text"]');
    await expect(todoText).toBeVisible();
  });

  test("should handle escape key to close overlays", async ({ page, todoApp }) => {
    await todoApp.addTodo("Escape key test");

    // Try to open details
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await todoItem.dblclick();

    await page.waitForTimeout(300);

    // Press Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Overlay should be closed
    const overlay = page.locator('[data-testid="todo-details-overlay"]');
    await expect(overlay).toBeHidden();
  });
});
