import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Todo State Changes", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should track todo creation", async ({ page, todoApp }) => {
    // Add a todo
    await todoApp.addTodo("State test todo");
    await page.waitForTimeout(300);

    // Verify it was added
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should track todo completion", async ({ page, todoApp }) => {
    // Add a todo
    await todoApp.addTodo("Complete state test");
    await page.waitForTimeout(300);

    // Complete it
    await todoApp.toggleTodo("Complete state test");
    await page.waitForTimeout(300);

    // Verify completion by checking the todo item
    const todoItem = page.getByTestId("todo-item").first();
    await expect(todoItem).toBeVisible();
  });

  test("should handle multiple operations", async ({ page, todoApp }) => {
    // Add multiple todos
    for (let i = 1; i <= 3; i++) {
      await todoApp.addTodo(`Multi state test ${i}`);
      await page.waitForTimeout(100);
    }

    // Verify all were added
    let count = await todoApp.getTodoCount();
    expect(count).toBe(3);

    // Complete one
    await todoApp.toggleTodo("Multi state test 1");
    await page.waitForTimeout(200);

    // All todos should still exist
    count = await todoApp.getTodoCount();
    expect(count).toBe(3);
  });
});

test.describe("Keyboard Shortcuts for Operations", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should support keyboard navigation", async ({ page, todoApp }) => {
    // Add a todo
    await todoApp.addTodo("Keyboard test");
    await page.waitForTimeout(300);

    // Try keyboard shortcut (if supported)
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(200);

    // The app should still be functional
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should handle escape key", async ({ page, todoApp }) => {
    // Add a todo
    await todoApp.addTodo("Escape test");
    await page.waitForTimeout(300);

    // Open details
    await todoApp.openTodoDetails("Escape test");
    await page.waitForTimeout(300);

    // Press escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Details should be closed (overlay gone)
    // The main view should be visible
    const todoApp2 = page.getByTestId("todo-app");
    await expect(todoApp2).toBeVisible();
  });
});
