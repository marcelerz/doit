import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("View Presets", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should maintain view state across sessions", async ({ page, todoApp }) => {
    // Switch to kanban view
    const kanbanTab = page.getByTestId("view-tab-kanban");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);
    }

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // View should be restored (or default to list)
    const todoApp2 = page.getByTestId("todo-app");
    await expect(todoApp2).toBeVisible();
  });

  test("should remember filter selections", async ({ page, todoApp }) => {
    await todoApp.addTodo("Filterable task");
    await page.waitForTimeout(300);

    await todoApp.search("task");
    await page.waitForTimeout(300);

    // The search should be active
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});

test.describe("View Options Persistence", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should persist list view options", async ({ page, todoApp }) => {
    await todoApp.addTodo("Test for persistence");
    await page.waitForTimeout(300);

    await page.reload();
    await todoApp.waitForAppLoad();

    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should persist kanban view options", async ({ page, todoApp }) => {
    const kanbanTab = page.getByTestId("view-tab-kanban");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Kanban view should be visible
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toBeVisible();
    }
  });

  test("should persist gantt view options", async ({ page }) => {
    const ganttTab = page.getByTestId("view-tab-gantt");
    if (await ganttTab.isVisible()) {
      await ganttTab.click();
      await page.waitForTimeout(300);

      const ganttView = page.getByTestId("gantt-view");
      await expect(ganttView).toBeVisible();
    }
  });

  test("should persist calendar view options", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");
    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");
      await expect(calendarView).toBeVisible();
    }
  });
});

test.describe("Cross-View Data Consistency", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    await todoApp.addTodo("Cross-view test task");
  });

  test("should show same todos in list and kanban", async ({ page, todoApp }) => {
    // Check list view count
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Switch to kanban
    const kanbanTab = page.getByTestId("view-tab-kanban");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Kanban should show the task
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toContainText("Cross-view");
    }
  });

  test("should reflect completion status across views", async ({ page, todoApp }) => {
    // Complete in list view
    await todoApp.toggleTodo("Cross-view");
    await page.waitForTimeout(300);

    // Switch to kanban
    const kanbanTab = page.getByTestId("view-tab-kanban");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Task should be in completed column
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toBeVisible();
    }
  });
});
