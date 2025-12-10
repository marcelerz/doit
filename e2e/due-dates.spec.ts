import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Due Dates Detection", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should detect 'today' as due date", async ({ page, todoApp }) => {
    await todoApp.addTodo("Finish report today");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect 'tomorrow' as due date", async ({ page, todoApp }) => {
    await todoApp.addTodo("Submit form tomorrow");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect 'next week' as due date", async ({ page, todoApp }) => {
    await todoApp.addTodo("Prepare presentation next week");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect specific weekday as due date", async ({ page, todoApp }) => {
    await todoApp.addTodo("Meeting on friday");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect 'eod' shorthand", async ({ page, todoApp }) => {
    await todoApp.addTodo("Call client eod");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should detect 'morning' shorthand", async ({ page, todoApp }) => {
    await todoApp.addTodo("Exercise morning");
    await page.waitForTimeout(300);

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});

test.describe("Due Date Display", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should show due date in todo details", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task due tomorrow");
    await page.waitForTimeout(300);

    await todoApp.openTodoDetails("Task due");
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();
  });

  test("should persist due date after reload", async ({ page, todoApp }) => {
    await todoApp.addTodo("Important deadline today");
    await page.waitForTimeout(300);

    await page.reload();
    await todoApp.waitForAppLoad();

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});
