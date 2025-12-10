import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Mobile Responsiveness", () => {
  // These tests run on mobile viewport (configured in playwright.config.ts for Mobile Chrome)

  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should display app on mobile viewport", async ({ page }) => {
    // App should be visible and usable
    const appContainer = page.getByTestId("todo-app");
    await expect(appContainer).toBeVisible();
  });

  test("should allow adding todos on mobile", async ({ page, todoApp }) => {
    await todoApp.addTodo("Mobile todo test");

    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Mobile todo test" });
    await expect(todoItem).toBeVisible();
  });

  test("should handle click interactions", async ({ page, todoApp }) => {
    await todoApp.addTodo("Click interaction test");

    // Click on the todo item
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await todoItem.click();

    // Item should respond to click and still be visible
    await expect(todoItem).toBeVisible();
  });

  test("should show responsive navigation", async ({ page }) => {
    // On mobile, navigation might be in a different layout
    // Check that view tabs are accessible
    const listTab = page.getByTestId("view-tab-list");
    await expect(listTab).toBeVisible();
  });
});
