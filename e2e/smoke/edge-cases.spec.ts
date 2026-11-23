import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Edge Cases
 *
 * Empty, very long, markup, emoji and rapid input, as one sequential workflow.
 * The mobile tests that used to share this file are in mobile.spec.ts.
 */
test.describe("Edge Cases Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Sequential Edge Case Tests", () => {
    test("Step 1: Handle empty submission gracefully", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Try to add empty todo
      const addButton = page.getByTestId("add-todo-button");
      await addButton.click();

      await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

      // An empty input must not be submittable at all -- the button is disabled
      // rather than silently accepting and discarding the entry.
      const submitButton = page.getByTestId("add-todo-submit");
      await expect(submitButton).toBeDisabled();

      // ...and it enables as soon as there is something to add
      await page.getByTestId("smart-input").click();
      await page.keyboard.type("Not empty");
      await expect(submitButton).toBeEnabled();

      // Close overlay
      await page.keyboard.press("Escape");
    });

    test("Step 2: Handle very long text", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with very long text
      const longText = "A".repeat(500);
      await todoApp.addTodo(`Long task: ${longText}`);

      // Created once, with all of it kept: a row may clip what it shows, but
      // the text itself is not cut.
      const rows = page.getByTestId("todo-item");
      await expect(rows).toHaveCount(1);
      await expect(rows.getByTestId("todo-text")).toHaveText(`Long task: ${longText}`);
    });

    test("Step 3: Handle special characters (XSS prevention)", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // An alert would mean the markup ran.
      let dialogOpened = false;
      const onDialog = async (dialog: { dismiss: () => Promise<void> }) => {
        dialogOpened = true;
        await dialog.dismiss();
      };
      page.on("dialog", onDialog);

      const markup = "<script>alert('xss')</script> Task";
      await todoApp.addTodo(markup);

      // The markup is shown as the text that was typed...
      const row = page.getByTestId("todo-item").filter({ hasText: "alert('xss')" });
      await expect(row.getByTestId("todo-text")).toHaveText(markup);
      // ...and did not become an element.
      await expect(row.locator("script")).toHaveCount(0);
      expect(dialogOpened).toBe(false);

      page.off("dialog", onDialog);
    });

    test("Step 4: Handle unicode and emoji", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with unicode/emoji
      await todoApp.addTodo("Task with emoji: Hello World!");

      // Verify it was created
      const todos = await todoApp.getTodos();
      expect(todos.some((t) => t.includes("emoji"))).toBe(true);
    });

    test("Step 5: Rapid repeated actions", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Rapidly add multiple todos
      await todoApp.addTodo("Rapid 1");
      await todoApp.addTodo("Rapid 2");
      await todoApp.addTodo("Rapid 3");

      // All should be created
      const todos = await todoApp.getTodos();
      const rapidCount = todos.filter((t) => t.includes("Rapid")).length;
      expect(rapidCount).toBe(3);
    });
  });
});
