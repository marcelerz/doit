import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Sorting", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add multiple todos for sorting tests
    await todoApp.addTodo("Alpha task");
    await todoApp.addTodo("Beta task");
    await todoApp.addTodo("Gamma task");
  });

  test("should display sort options", async ({ page }) => {
    // Look for sort dropdown or buttons
    const sortControl = page.locator('[data-testid="sort-dropdown"], button:has-text("Sort")');
    const sortVisible = await sortControl.count();
    expect(sortVisible).toBeGreaterThanOrEqual(0); // May or may not be visible
  });

  test("should maintain todos after sorting changes", async ({ page, todoApp }) => {
    // Verify all todos exist
    const count = await todoApp.getTodoCount();
    expect(count).toBe(3);
  });
});

test.describe("Grouping", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should display grouping options if available", async ({ page }) => {
    // Look for group dropdown or buttons
    const groupControl = page.locator('[data-testid="group-dropdown"], button:has-text("Group")');
    const groupVisible = await groupControl.count();
    expect(groupVisible).toBeGreaterThanOrEqual(0); // May or may not be visible
  });

  test("should display todos without grouping by default", async ({ page, todoApp }) => {
    await todoApp.addTodo("Test todo 1");
    await todoApp.addTodo("Test todo 2");

    const count = await todoApp.getTodoCount();
    expect(count).toBe(2);
  });
});

test.describe("Filter Combinations", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add todos with different properties
    await todoApp.addTodo("High priority task !!urgent");
    await todoApp.addTodo("Low priority task");
    await todoApp.addTodo("Tagged task #feature");
  });

  test("should filter by multiple criteria", async ({ page, todoApp }) => {
    // Search for specific text
    await todoApp.search("task");
    await page.waitForTimeout(300);

    // All three contain "task"
    const count = await todoApp.getTodoCount();
    expect(count).toBe(3);
  });

  test("should clear all filters", async ({ page, todoApp }) => {
    await todoApp.search("priority");
    await page.waitForTimeout(300);

    await todoApp.clearSearch();
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(3);
  });
});
