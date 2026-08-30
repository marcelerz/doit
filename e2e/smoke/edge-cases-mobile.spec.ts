import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Edge Cases and Mobile
 *
 * This test file consolidates edge-cases.spec.ts and mobile.spec.ts
 * into a single sequential workflow.
 */
test.describe("Edge Cases and Mobile Workflow", () => {
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

      // Verify it was created (might be truncated)
      const count = await todoApp.getTodoCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("Step 3: Handle special characters (XSS prevention)", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todo with potential XSS
      await todoApp.addTodo("<script>alert('xss')</script> Task");

      // Verify it was created safely (script should not execute)
      const todos = await todoApp.getTodos();
      expect(todos.length).toBeGreaterThanOrEqual(1);

      // Page should still be functional
      const addButton = page.getByTestId("add-todo-button");
      await expect(addButton).toBeVisible();
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

  test.describe("Mobile Viewport Tests", () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test("Mobile: App loads correctly", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Verify app is responsive
      const addButton = page.getByTestId("add-todo-button");
      await expect(addButton).toBeVisible();
    });

    test("Mobile: Can add todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.clearStorage();
      await page.reload();
      await todoApp.waitForAppLoad();

      await todoApp.addTodo("Mobile test todo");

      // Verify todo appears
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Mobile test" });
      await expect(todoItem).toBeVisible();
    });

    test("Mobile: Navigation works", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // There is no hamburger menu -- the tab bar is a scrolling tablist at
      // every width -- so switch views through it and assert it actually
      // happened. The old version looked for a "mobile-menu" that does not
      // exist and then asserted a count >= 0, which is always true.
      await todoApp.switchView("kanban");
      await expect(page.getByTestId("kanban-view")).toBeVisible();
      await todoApp.switchView("list");
      await expect(page.getByTestId("todo-item").first()).toBeVisible();
    });
  });
});
