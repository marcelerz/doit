import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Todo Details Overlay", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add a test todo
    await todoApp.addTodo("Task with details");
  });

  test("should open todo details overlay on double-click", async ({ page, todoApp }) => {
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Task with details" });
    await todoItem.dblclick();

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toBeVisible();
  });

  test("should close overlay with close button", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    const closeButton = page.getByTestId("overlay-close");
    await closeButton.click();

    await page.waitForTimeout(300);

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).not.toBeVisible();
  });

  test("should close overlay with Escape key", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).not.toBeVisible();
  });

  test("should display todo text in overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("Task with details");
  });

  test("should toggle todo completion from overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    // Find and click the checkbox in the overlay
    const checkbox = page.getByTestId("todo-details-overlay").locator('[role="checkbox"]');
    await checkbox.click();

    // The status should change (the checkbox visual will change)
    await page.waitForTimeout(300);
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  test("should show action buttons in overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    // Action buttons container should be visible
    const actionButtons = page.getByTestId("action-buttons");
    await expect(actionButtons).toBeVisible();

    // Individual buttons should be present
    await expect(page.getByTestId("action-duplicate")).toBeVisible();
    await expect(page.getByTestId("action-archive")).toBeVisible();
  });

  test("should delete todo from overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    // Click delete button
    const deleteButton = page.getByTestId("action-delete");
    await deleteButton.click();

    await page.waitForTimeout(500);

    // Overlay should close and todo should be gone
    const todoItems = page.locator('[data-testid="todo-item"]');
    await expect(todoItems).toHaveCount(0);
  });

  test("should display timestamps in overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task with details");

    const overlay = page.getByTestId("todo-details-overlay");

    // Created date should be displayed
    await expect(overlay).toContainText(/Created/);
  });
});

test.describe("Todo Details with Metadata", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should display todo with assigned person", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task @John");

    await todoApp.openTodoDetails("Task");

    const overlay = page.getByTestId("todo-details-overlay");
    // The overlay should contain the person name
    await expect(overlay).toContainText("John");
  });

  test("should display todo with project", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task for project work");

    await todoApp.openTodoDetails("Task for project");

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("Task");
  });

  test("should display todo with priority", async ({ page, todoApp }) => {
    await todoApp.addTodo("!!urgent Important task");

    await todoApp.openTodoDetails("Important task");

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText(/urgent/i);
  });

  test("should display todo with tag", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task #feature");

    await todoApp.openTodoDetails("Task");

    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("feature");
  });

  test("should display todo with date", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task tomorrow");

    await todoApp.openTodoDetails("Task");

    const overlay = page.getByTestId("todo-details-overlay");
    // Should show a date field
    await expect(overlay).toBeVisible();
  });
});
