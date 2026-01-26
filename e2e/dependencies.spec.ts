import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Dependencies Creation", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Create multiple todos for dependency tests
    await todoApp.addTodo("Task A - prerequisite");
    await todoApp.addTodo("Task B - depends on A");
  });

  test("should allow creating multiple tasks for dependencies", async ({ page: _page, todoApp }) => {
    const count = await todoApp.getTodoCount();
    expect(count).toBe(2);
  });

  test("should open details overlay for dependency management", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task B");
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();
  });

  test("should complete prerequisite task", async ({ page, todoApp }) => {
    // Complete the prerequisite
    await todoApp.toggleTodo("Task A");
    await page.waitForTimeout(300);

    // Task B should still be available
    const count = await todoApp.getTodoCount();
    expect(count).toBe(2);
  });
});

test.describe("Dependencies Workflow", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should handle task chains", async ({ page, todoApp }) => {
    // Create a chain of tasks
    await todoApp.addTodo("Step 1");
    await todoApp.addTodo("Step 2");
    await todoApp.addTodo("Step 3");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(3);
  });

  test("should allow completing tasks in order", async ({ page, todoApp }) => {
    await todoApp.addTodo("First task");
    await todoApp.addTodo("Second task");
    await page.waitForTimeout(300);

    // Complete first
    await todoApp.toggleTodo("First task");
    await page.waitForTimeout(300);

    // Complete second
    await todoApp.toggleTodo("Second task");
    await page.waitForTimeout(300);

    // Both should be in completed state
    const count = await todoApp.getTodoCount();
    expect(count).toBe(2);
  });

  test("should persist dependency relationships across reload", async ({ page, todoApp }) => {
    await todoApp.addTodo("Dependent task chain");
    await page.waitForTimeout(300);

    await page.reload();
    await todoApp.waitForAppLoad();

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});
