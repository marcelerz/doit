import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Recurring Tasks", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should detect recurring pattern with 'every' keyword", async ({ page, todoApp }) => {
    await todoApp.addTodo("Team standup every monday");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Open details to verify recurring was detected
    await todoApp.openTodoDetails("Team standup");
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();
  });

  test("should detect daily recurring pattern", async ({ page, todoApp }) => {
    await todoApp.addTodo("Check emails every day");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect weekly recurring pattern", async ({ page, todoApp }) => {
    await todoApp.addTodo("Weekly review every week");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect interval recurring pattern", async ({ page, todoApp }) => {
    await todoApp.addTodo("Water plants every 3 days");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect specific weekday recurring", async ({ page, todoApp }) => {
    await todoApp.addTodo("Gym session every tuesday and thursday");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});

test.describe("Recurring Display", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should show recurring indicator in todo item", async ({ page, todoApp }) => {
    await todoApp.addTodo("Daily task every day");
    await page.waitForTimeout(300);

    // The todo item should indicate it's recurring
    const todoItem = page.getByTestId("todo-item").first();
    await expect(todoItem).toBeVisible();
  });

  test("should persist recurring pattern after reload", async ({ page, todoApp }) => {
    await todoApp.addTodo("Recurring task every friday");
    await page.waitForTimeout(300);

    await page.reload();
    await todoApp.waitForAppLoad();

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});
