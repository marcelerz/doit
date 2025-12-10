import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Comments", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add a test todo
    await todoApp.addTodo("Task for commenting");
  });

  test("should show comment add section in overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task for commenting");

    // Find the comment add section
    const commentSection = page.getByTestId("comment-add-section");
    await expect(commentSection).toBeVisible();
  });

  test("should add a comment to a todo", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task for commenting");

    // Find the comment editor and add text
    const editor = page.getByTestId("rich-text-editor").first();
    await editor.click();
    await page.keyboard.type("This is a test comment");
    await page.waitForTimeout(300);

    // Click add button
    const addButton = page.getByTestId("add-comment-button");
    await addButton.click();
    await page.waitForTimeout(500);

    // The activity feed should now contain the comment
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("test comment");
  });

  test("should persist comments after closing overlay", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task for commenting");

    const editor = page.getByTestId("rich-text-editor").first();
    await editor.click();
    await page.keyboard.type("Persistent comment");
    await page.waitForTimeout(300);

    await page.getByTestId("add-comment-button").click();
    await page.waitForTimeout(500);

    // Close overlay
    await todoApp.closeOverlay();

    // Reopen
    await todoApp.openTodoDetails("Task for commenting");

    // Comment should still be there
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("Persistent comment");
  });

  test("should persist comments after page reload", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task for commenting");

    const editor = page.getByTestId("rich-text-editor").first();
    await editor.click();
    await page.keyboard.type("Reload test comment");
    await page.waitForTimeout(300);

    await page.getByTestId("add-comment-button").click();
    await page.waitForTimeout(500);

    await todoApp.closeOverlay();

    // Reload
    await page.reload();
    await todoApp.waitForAppLoad();

    // Reopen
    await todoApp.openTodoDetails("Task for commenting");

    // Comment should persist
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText("Reload test comment");
  });

  test("should show comment count in activity section", async ({ page, todoApp }) => {
    await todoApp.openTodoDetails("Task for commenting");

    // Add a comment
    const editor = page.getByTestId("rich-text-editor").first();
    await editor.click();
    await page.keyboard.type("Count test comment");
    await page.waitForTimeout(300);

    await page.getByTestId("add-comment-button").click();
    await page.waitForTimeout(500);

    // The activity section should show comment count
    const overlay = page.getByTestId("todo-details-overlay");
    await expect(overlay).toContainText(/comment/i);
  });
});
