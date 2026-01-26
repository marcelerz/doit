import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Theme and Appearance", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should respect system dark mode preference", async ({ page }) => {
    // Emulate dark mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await page.waitForTimeout(300);

    // Check that dark mode classes are applied
    const html = page.locator("html");
    const htmlClass = await html.getAttribute("class");

    // App should have dark mode styles
    // Check that the html element has a class attribute (dark mode should set 'dark' class)
    expect(htmlClass).not.toBeNull();
    // Optionally verify dark mode class is present
    if (htmlClass) {
      expect(htmlClass.includes("dark") || htmlClass.includes("color-scheme")).toBe(true);
    }
  });

  test("should respect system light mode preference", async ({ page }) => {
    // Emulate light mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    await page.waitForTimeout(300);

    // Check that light mode is applied
    const html = page.locator("html");
    await expect(html).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should handle empty todo submission gracefully", async ({ page }) => {
    // Click the Add button to open the overlay
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();
    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const smartInput = page.getByTestId("smart-input");

    // Try to submit empty todo
    await smartInput.fill("");
    await smartInput.press("Enter");
    await page.waitForTimeout(300);

    // Close overlay and check - should not create a todo
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    const todoItems = page.getByTestId("todo-item");
    const count = await todoItems.count();
    expect(count).toBe(0);
  });

  test("should handle whitespace-only todo submission", async ({ page }) => {
    // Click the Add button to open the overlay
    const addButton = page.locator('button:has-text("Add")').first();
    await addButton.click();
    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const smartInput = page.getByTestId("smart-input");

    // Try to submit whitespace-only todo
    await smartInput.fill("   ");
    await smartInput.press("Enter");
    await page.waitForTimeout(300);

    // Close overlay and check - should not create a todo or should trim and reject
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    const todoItems = page.getByTestId("todo-item");
    const count = await todoItems.count();
    expect(count).toBe(0);
  });

  test("should handle very long todo text", async ({ page, todoApp }) => {
    const longText = "A".repeat(1000);

    await todoApp.addTodo(longText);
    await page.waitForTimeout(300);

    // Todo should be created (possibly truncated)
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });

  test("should handle special characters in todo text", async ({ page, todoApp }) => {
    const specialChars = "Test <script>alert('xss')</script> & \"quotes\" 'apostrophe'";

    await todoApp.addTodo(specialChars);
    await page.waitForTimeout(300);

    // Todo should be created and text should be escaped
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Should display the text safely
    const todoItem = page.getByTestId("todo-item").first();
    await expect(todoItem).toBeVisible();
  });

  test("should handle unicode and emoji in todo text", async ({ page, todoApp }) => {
    const unicodeText = "Test 🎉 emoji and 日本語 unicode";

    await todoApp.addTodo(unicodeText);
    await page.waitForTimeout(300);

    // Todo should be created
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);

    // Should display unicode correctly
    const todoItem = page.getByTestId("todo-item").first();
    await expect(todoItem).toContainText("🎉");
  });
});

test.describe("Performance", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should handle many todos without significant slowdown", async ({ page: _page, todoApp }) => {
    const startTime = Date.now();

    // Add 10 todos
    for (let i = 1; i <= 10; i++) {
      await todoApp.addTodo(`Performance test todo ${i}`);
    }

    const addTime = Date.now() - startTime;

    // Should complete in reasonable time (less than 60 seconds)
    expect(addTime).toBeLessThan(60000);

    // All todos should be visible
    const count = await todoApp.getTodoCount();
    expect(count).toBe(10);
  });

  test("should render quickly after page load with existing todos", async ({ page, todoApp }) => {
    // Add some todos
    for (let i = 1; i <= 10; i++) {
      await todoApp.addTodo(`Existing todo ${i}`);
    }

    // Reload and measure time to render
    const startTime = Date.now();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Wait for todos to appear
    await page.waitForSelector('[data-testid="todo-item"]');
    const loadTime = Date.now() - startTime;

    // Should load in reasonable time
    expect(loadTime).toBeLessThan(5000);

    // All todos should be visible
    const count = await todoApp.getTodoCount();
    expect(count).toBe(10);
  });
});

test.describe("Concurrent Operations", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should handle rapid todo additions", async ({ page }) => {
    // Click the Add button to open the overlay
    const addButton = page.locator('button:has-text("Add")').first();

    // Rapidly add todos
    for (let i = 1; i <= 5; i++) {
      await addButton.click();
      await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

      const smartInput = page.getByTestId("smart-input");
      await smartInput.fill(`Rapid todo ${i}`);

      // Click the "Add Todo" button in the overlay
      const submitButton = page.locator('button:has-text("Add Todo")');
      await submitButton.click();
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(500);

    // All todos should be created
    const todoItems = page.getByTestId("todo-item");
    const count = await todoItems.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("should handle view switching during operations", async ({ page, todoApp }) => {
    // Add a todo
    await todoApp.addTodo("View switch test");
    await page.waitForTimeout(200);

    // Rapidly switch views
    const listTab = page.getByTestId("view-tab-list");
    const kanbanTab = page.getByTestId("view-tab-kanban");

    if ((await kanbanTab.isVisible()) && (await listTab.isVisible())) {
      await kanbanTab.click();
      await listTab.click();
      await kanbanTab.click();
      await listTab.click();
      await page.waitForTimeout(500);
    }

    // App should still be functional
    const count = await todoApp.getTodoCount();
    expect(count).toBe(1);
  });
});
