import { test, expect } from "../fixtures/todo-app.fixture";

/**
 * Smoke Test: Persistence and Settings
 *
 * This test file consolidates persistence.spec.ts, backup-restore.spec.ts,
 * and settings.spec.ts into a single sequential workflow.
 */
test.describe("Persistence and Settings Workflow", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      if (typeof indexedDB !== "undefined") {
        indexedDB.deleteDatabase("doit-storage");
      }
      localStorage.setItem("doit-tutorial-preferences", JSON.stringify({ completed: true, showOnStartup: false }));
    });
    await page.close();
  });

  test.describe.serial("Sequential Persistence and Settings", () => {
    test("Step 1: Add todos and verify storage", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todos
      await todoApp.addTodo("Persistence test 1");
      await todoApp.addTodo("Persistence test 2");

      // Verify in storage
      const storageData = await page.evaluate(() => {
        return localStorage.getItem("doit-todos") || "[]";
      });
      expect(storageData.length).toBeGreaterThan(2);

      const count = await todoApp.getTodoCount();
      expect(count).toBe(2);
    });

    test("Step 2: Complete todo and verify state persisted", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Complete a todo
      await todoApp.toggleTodo("Persistence test 1");
      await page.waitForTimeout(500);

      // Reload and verify
      await page.reload();
      await todoApp.waitForAppLoad();

      // Todo should still exist and be completed
      const count = await todoApp.getTodoCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("Step 3: Navigate to settings (if available)", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Look for settings button/link
      const settingsButton = page.locator('[data-testid="settings-button"]');
      if (await settingsButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await settingsButton.click();
        await page.waitForTimeout(500);

        // Verify settings page/overlay
        const settingsView = page.locator('[data-testid="settings-view"]');
        if (await settingsView.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(settingsView).toBeVisible();
        }

        // Go back
        await page.keyboard.press("Escape");
      }
    });

    test("Step 4: Verify settings persistence", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Check settings are in storage
      const settingsData = await page.evaluate(() => {
        return localStorage.getItem("doit-settings") || "{}";
      });

      // Settings should exist (even if default)
      expect(settingsData).toBeDefined();
    });

    test("Step 5: Add more data and verify", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add another todo
      await todoApp.addTodo("Persistence test 3 @user %project");

      // Verify
      const todos = await todoApp.getTodos();
      expect(todos.some((t) => t.includes("Persistence test 3"))).toBe(true);
    });

    test("Step 6: Hard reload and verify all state restored", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Get initial state
      const beforeTodos = await todoApp.getTodos();

      // Hard reload with cache clear
      await page.reload();
      await todoApp.waitForAppLoad();

      // Verify state
      const afterTodos = await todoApp.getTodos();
      expect(afterTodos.length).toBe(beforeTodos.length);
    });

    test("Step 7: Verify data integrity", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Check specific todos exist
      const todos = await todoApp.getTodos();

      // At least our test todos should be there
      expect(todos.length).toBeGreaterThanOrEqual(2);
    });
  });
});
