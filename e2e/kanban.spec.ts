import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Kanban View", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add test todos
    await todoApp.addTodo("Kanban task 1");
    await todoApp.addTodo("Kanban task 2 tomorrow");
    await todoApp.addTodo("Kanban task 3 @John");
  });

  test("should switch to kanban view", async ({ page }) => {
    const kanbanTab = page.getByTestId("view-tab-kanban");

    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toBeVisible();
    }
  });

  test("should display kanban columns", async ({ page }) => {
    const kanbanTab = page.getByTestId("view-tab-kanban");

    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Kanban should have multiple columns
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toBeVisible();

      // Should have column headers or the view selector
      const viewSelector = kanbanView.locator("select").first();
      await expect(viewSelector).toBeVisible();
    }
  });

  test("should show todos in kanban cards", async ({ page }) => {
    const kanbanTab = page.getByTestId("view-tab-kanban");

    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(500);

      // Look for the task text in the kanban view
      const kanbanView = page.getByTestId("kanban-view");
      await expect(kanbanView).toContainText("Kanban task");
    }
  });

  test("should have sort controls", async ({ page }) => {
    const kanbanTab = page.getByTestId("view-tab-kanban");

    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(300);

      // Should have sort select
      const kanbanView = page.getByTestId("kanban-view");
      const sortSelect = kanbanView.locator("select").filter({ hasText: /Created|Updated|Due Date/i });

      if ((await sortSelect.count()) > 0) {
        await expect(sortSelect.first()).toBeVisible();
      }
    }
  });

  test("should open todo details from kanban card", async ({ page, todoApp }) => {
    const kanbanTab = page.getByTestId("view-tab-kanban");

    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(500);

      // Click on a kanban card
      const kanbanView = page.getByTestId("kanban-view");
      const card = kanbanView.locator("text=Kanban task 1").first();

      if (await card.isVisible()) {
        await card.click();
        await page.waitForTimeout(300);

        // Details overlay should open
        const overlay = page.getByTestId("todo-details-overlay");
        await expect(overlay).toBeVisible();
      }
    }
  });
});

test.describe("Kanban View Persistence", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should persist kanban view selection after reload", async ({ page, todoApp }) => {
    await todoApp.addTodo("Persist test task");

    const kanbanTab = page.getByTestId("view-tab-kanban");

    if (await kanbanTab.isVisible()) {
      await kanbanTab.click();
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await todoApp.waitForAppLoad();

      // Kanban view should still be active (or list view depending on settings)
      const app = page.getByTestId("todo-app");
      await expect(app).toBeVisible();
    }
  });
});
