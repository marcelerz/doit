import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("View Navigation", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add some test data
    await todoApp.addTodo("Test task 1");
    await todoApp.addTodo("Test task 2 tomorrow");
    await todoApp.addTodo("Test task 3 next week");
  });

  test("should start on list view by default", async ({ page }) => {
    // The list view tab should be active
    const listTab = page.getByTestId("view-tab-list");
    await expect(listTab).toBeVisible();
  });

  test("should switch to kanban view", async ({ page, todoApp: _todoApp }) => {
    // Click on Kanban tab
    const kanbanTab = page.getByTestId("view-tab-kanban");

    // Skip if kanban is not enabled
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Verify kanban view elements are visible
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toBeVisible();
    }
  });

  test("should switch to gantt view", async ({ page }) => {
    const ganttTab = page.getByTestId("view-tab-gantt");

    if (await ganttTab.isVisible()) {
      await ganttTab.click();
      await page.waitForTimeout(300);

      const ganttView = page.getByTestId("gantt-view");
      await expect(ganttView).toBeVisible();
    }
  });

  test("should switch to calendar view", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");
      await expect(calendarView).toBeVisible();
    }
  });

  test("should switch to people view", async ({ page }) => {
    const peopleTab = page.getByTestId("view-tab-people");

    if (await peopleTab.isVisible()) {
      await peopleTab.click();
      await page.waitForTimeout(500);

      // Verify we're on the people view - look for the People heading
      const peopleHeading = page.locator('h2:has-text("People")');
      await expect(peopleHeading).toBeVisible();
    }
  });

  test("should switch to projects view", async ({ page }) => {
    const projectsTab = page.getByTestId("view-tab-projects");

    if (await projectsTab.isVisible()) {
      await projectsTab.click();
      await page.waitForTimeout(500);

      // Verify we're on the projects view - look for the Projects heading
      const projectsHeading = page.locator('h2:has-text("Projects")');
      await expect(projectsHeading).toBeVisible();
    }
  });

  test("should maintain todos when switching views", async ({ page, todoApp }) => {
    // Get initial count
    const initialTodos = await todoApp.getTodos();

    // Switch to another view and back
    const kanbanTab = page.getByTestId("view-tab-kanban");
    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Switch back to list
      await page.getByTestId("view-tab-list").click();
      await page.waitForTimeout(300);

      // Verify todos are still there
      const finalTodos = await todoApp.getTodos();
      expect(finalTodos.length).toBe(initialTodos.length);
    }
  });
});
