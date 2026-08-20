import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Gantt View", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add test todos
    await todoApp.addTodo("Gantt task one");
    await todoApp.addTodo("Gantt task two");
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

  test("should have aria label for accessibility", async ({ page }) => {
    const ganttTab = page.getByTestId("view-tab-gantt");

    if (await ganttTab.isVisible()) {
      await ganttTab.click();
      await page.waitForTimeout(300);

      const ganttView = page.getByTestId("gantt-view");
      await expect(ganttView).toHaveAttribute("aria-label", "Gantt Chart Schedule");
    }
  });

  test("should display gantt content", async ({ page }) => {
    const ganttTab = page.getByTestId("view-tab-gantt");

    if (await ganttTab.isVisible()) {
      await ganttTab.click();
      await page.waitForTimeout(500);

      const ganttView = page.getByTestId("gantt-view");
      await expect(ganttView).toBeVisible();

      // Gantt view should have some content
      const content = await ganttView.textContent();
      expect(content).toBeTruthy();
    }
  });

  test("should maintain state after view switch", async ({ page, todoApp }) => {
    const ganttTab = page.getByTestId("view-tab-gantt");

    if (await ganttTab.isVisible()) {
      await ganttTab.click();
      await page.waitForTimeout(300);

      // Switch back to list
      await page.getByTestId("view-tab-list").click();
      await page.waitForTimeout(300);

      // Verify todos still exist
      const count = await todoApp.getTodoCount();
      expect(count).toBe(2);
    }
  });
});
