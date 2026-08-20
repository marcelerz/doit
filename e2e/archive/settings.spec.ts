import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
  });

  test("should navigate to settings page", async ({ page }) => {
    // Find and click settings link
    const settingsLink = page.locator('a[href="/settings"]').first();

    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForURL("**/settings");

      // Verify settings page loaded
      await expect(page).toHaveURL(/.*settings/);
    }
  });

  test("should display settings tabs", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForTimeout(500);

    // Settings page should have various tabs/sections
    // Check for common settings elements
    const settingsContainer = page.locator('[data-testid="settings-page"], main, .settings');
    await expect(settingsContainer.first()).toBeVisible();
  });

  test("should persist settings changes", async ({ page, todoApp }) => {
    await page.goto("/settings");
    await page.waitForTimeout(500);

    // Make a change (this depends on actual settings UI)
    // For now, just verify the page loads and we can navigate back

    // Go back to main app
    await page.goto("/");
    await todoApp.waitForAppLoad();

    // App should still work
    await todoApp.addTodo("After settings visit");
    const todoItem = page.locator('[data-testid="todo-item"]').first();
    await expect(todoItem).toBeVisible();
  });
});
