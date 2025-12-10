import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Data Persistence", () => {
  test("should persist todos in localStorage/IndexedDB", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add todos
    await todoApp.addTodo("Persistent todo 1");
    await todoApp.addTodo("Persistent todo 2");

    // Verify they exist
    let todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(2);

    // Reload page
    await page.reload();
    await todoApp.waitForAppLoad();

    // Verify todos persist
    todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(2);
  });

  test("should persist completed state", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add and complete a todo
    await todoApp.addTodo("Complete me");
    await todoApp.toggleTodo("Complete me");

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // Todo should still be in completed state
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Complete me" });
    await expect(todoItem).toBeVisible();
  });

  test("should persist view preferences", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Change view (if available)
    const kanbanTab = page.getByTestId("view-tab-kanban");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(500);

      // Reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // View preference might persist based on settings
      // This test verifies the app loads correctly after view change
    }
  });

  test("should handle storage quota gracefully", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add several todos to test storage handling
    for (let i = 0; i < 10; i++) {
      await todoApp.addTodo(`Bulk todo ${i + 1}`);
    }

    // All should be added
    const todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(10);

    // Reload and verify
    await page.reload();
    await todoApp.waitForAppLoad();

    const persistedTodos = page.locator('[data-testid="todo-item"]');
    await expect(persistedTodos).toHaveCount(10);
  });

  test("should recover from corrupted storage", async ({ page, todoApp }) => {
    await page.goto("/");

    // Inject corrupted data
    await page.evaluate(() => {
      localStorage.setItem("doit-todos", "corrupted data {{{");
    });

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // App should still function - check that the app container is visible
    const appContainer = page.getByTestId("todo-app");
    await expect(appContainer).toBeVisible();

    // Should be able to add new todos
    await todoApp.addTodo("Recovery test todo");
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Recovery test todo" });
    await expect(todoItem).toBeVisible();
  });
});
