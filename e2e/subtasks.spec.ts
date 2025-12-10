import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Subtasks", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add a test todo
    await todoApp.addTodo("Main task with subtasks");
  });

  test("should add a subtask to a todo", async ({ page, todoApp }) => {
    // Open todo details
    await todoApp.openTodoDetails("Main task with subtasks");

    // Add a subtask
    await todoApp.addSubtask("First subtask");

    // Verify subtask is visible
    const subtaskItem = page.locator('[data-testid="subtask-item"]').filter({ hasText: "First subtask" });
    await expect(subtaskItem).toBeVisible();
  });

  test("should add multiple subtasks", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Main task with subtasks");

    await todoApp.addSubtask("Subtask 1");
    await todoApp.addSubtask("Subtask 2");
    await todoApp.addSubtask("Subtask 3");

    const subtasks = page.locator('[data-testid="subtask-item"]');
    await expect(subtasks).toHaveCount(3);
  });

  test("should toggle subtask completion", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Main task with subtasks");
    await todoApp.addSubtask("Toggleable subtask");

    // Toggle the subtask
    const checkbox = page.locator('[data-testid="subtask-checkbox"]').first();
    await checkbox.click();

    // The subtask text should have a line-through style (completed)
    const subtaskText = page.locator('[data-testid="subtask-text"]').first();
    await expect(subtaskText).toHaveClass(/line-through/);
  });

  test("should show progress bar with subtasks", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Main task with subtasks");

    await todoApp.addSubtask("Subtask A");
    await todoApp.addSubtask("Subtask B");

    // Progress bar should show 0/2
    const progress = page.getByTestId("subtasks-progress");
    await expect(progress).toContainText("0/2");

    // Complete one subtask
    const checkbox = page.locator('[data-testid="subtask-checkbox"]').first();
    await checkbox.click();

    // Progress should update to 1/2
    await expect(progress).toContainText("1/2");
  });

  test("should delete a subtask", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Main task with subtasks");
    await todoApp.addSubtask("Subtask to delete");

    // Verify it exists
    let subtasks = page.locator('[data-testid="subtask-item"]');
    await expect(subtasks).toHaveCount(1);

    // Hover over the subtask to show delete button
    const subtaskItem = page.locator('[data-testid="subtask-item"]').first();
    await subtaskItem.hover();

    // Click delete
    const deleteButton = page.locator('[data-testid="subtask-delete"]').first();
    await deleteButton.click({ force: true });

    await page.waitForTimeout(300);

    // Verify it's gone
    subtasks = page.locator('[data-testid="subtask-item"]');
    await expect(subtasks).toHaveCount(0);
  });

  test("should persist subtasks after closing and reopening overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Main task with subtasks");
    await todoApp.addSubtask("Persistent subtask");

    // Close overlay
    await todoApp.closeOverlay();

    // Reopen
    await todoApp.openTodoDetails("Main task with subtasks");

    // Verify subtask is still there
    const subtaskItem = page.locator('[data-testid="subtask-item"]').filter({ hasText: "Persistent subtask" });
    await expect(subtaskItem).toBeVisible();
  });

  test("should persist subtasks after page reload", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Main task with subtasks");
    await todoApp.addSubtask("Reload test subtask");
    await todoApp.closeOverlay();

    // Reload page
    await page.reload();
    await todoApp.waitForAppLoad();

    // Reopen overlay
    await todoApp.openTodoDetails("Main task with subtasks");

    // Verify subtask persists
    const subtaskItem = page.locator('[data-testid="subtask-item"]').filter({ hasText: "Reload test subtask" });
    await expect(subtaskItem).toBeVisible();
  });
});
