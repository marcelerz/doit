import { test, expect } from "./fixtures/todo-app.fixture";

/**
 * Visual regression tests for the Todo app
 *
 * These tests capture screenshots and compare them against baseline images.
 *
 * First run: Creates baseline screenshots in e2e/visual.spec.ts-snapshots/
 * Subsequent runs: Compares against baselines, fails if different
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test visual.spec.ts --update-snapshots
 *
 * Screenshot diff threshold can be adjusted with maxDiffPixelRatio
 */

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    // Clear storage to start fresh
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("empty state - list view", async ({ page }) => {
    await expect(page).toHaveScreenshot("empty-list-view.png", {
      maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
    });
  });

  test("list view with todos", async ({ page, todoApp }) => {
    // Add some sample todos
    await todoApp.addTodo("Buy groceries @John #shopping");
    await todoApp.addTodo("Call dentist !!high");
    await todoApp.addTodo("Review project proposal");

    await page.waitForTimeout(500); // Wait for animations

    await expect(page).toHaveScreenshot("list-view-with-todos.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("todo item - expanded details", async ({ page, todoApp }) => {
    // Add a todo
    await todoApp.addTodo("Test todo item with details");

    // Click to open details
    await todoApp.openTodoDetails("Test todo item with details");
    await page.waitForTimeout(300); // Wait for overlay animation

    await expect(page).toHaveScreenshot("todo-details-overlay.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("completed todo styling", async ({ page, todoApp }) => {
    await todoApp.addTodo("Task to complete");

    // Toggle the todo to complete it
    await todoApp.toggleTodo("Task to complete");
    await page.waitForTimeout(300);

    // Screenshot showing completed todo
    await expect(page).toHaveScreenshot("completed-todo-list.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("kanban view", async ({ page, todoApp }) => {
    // Add some todos first
    await todoApp.addTodo("Kanban task 1");
    await todoApp.addTodo("Kanban task 2");
    await todoApp.addTodo("Kanban task 3");

    // Switch to Kanban view
    await todoApp.switchView("kanban");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("kanban-view.png", {
      maxDiffPixelRatio: 0.02, // Allow slightly more for dynamic columns
    });
  });

  test("gantt view", async ({ page, todoApp }) => {
    // Add todos with due dates
    await todoApp.addTodo("Gantt task tomorrow");
    await todoApp.addTodo("Gantt task next week");

    // Switch to Gantt view
    await todoApp.switchView("gantt");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("gantt-view.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("calendar view", async ({ page, todoApp }) => {
    // Add todos with due dates
    await todoApp.addTodo("Calendar task today");

    // Switch to Calendar view
    await todoApp.switchView("calendar");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("calendar-view.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("people view", async ({ page, todoApp }) => {
    // Add todos with people
    await todoApp.addTodo("Task @John");
    await todoApp.addTodo("Task @Jane");

    // Switch to People view
    await todoApp.switchView("people");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("people-view.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("projects view", async ({ page, todoApp }) => {
    // Add todos with projects
    await todoApp.addTodo("Task for Website project");
    await todoApp.addTodo("Task for Marketing project");

    // Switch to Projects view
    await todoApp.switchView("projects");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("projects-view.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("dark mode appearance", async ({ page, todoApp }) => {
    // Enable dark mode via system preference emulation
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await todoApp.waitForAppLoad();

    await todoApp.addTodo("Dark mode todo");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("dark-mode.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("search results", async ({ page, todoApp }) => {
    // Add various todos
    await todoApp.addTodo("Buy groceries");
    await todoApp.addTodo("Call dentist");
    await todoApp.addTodo("Buy milk");
    await todoApp.addTodo("Meeting notes");

    // Search
    await todoApp.search("buy");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("search-results.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("todo with subtasks", async ({ page, todoApp }) => {
    // Add a todo with subtasks
    await todoApp.addTodo("Main task with subtasks");
    await todoApp.openTodoDetails("Main task with subtasks");

    // Add subtasks
    await todoApp.addSubtask("Subtask 1");
    await todoApp.addSubtask("Subtask 2");
    await todoApp.addSubtask("Subtask 3");

    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("todo-with-subtasks.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Component Visual Tests", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("smart input with tokens", async ({ page }) => {
    // Click Add to open overlay with SmartInput
    const addButton = page.getByTestId("add-todo-button");
    await addButton.click();

    await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

    const input = page.getByTestId("smart-input");
    await input.click();
    await input.fill("Meeting @John tomorrow !!high #project");

    await page.waitForTimeout(300);

    // Screenshot the overlay with smart input tokens
    await expect(page).toHaveScreenshot("smart-input-tokens.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("todo details with metadata", async ({ page, todoApp }) => {
    // Add todo with various metadata
    await todoApp.addTodo("Task @John !!high #tag");

    // Open details
    await todoApp.openTodoDetails("Task");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("todo-details-metadata.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Mobile Visual Tests", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("mobile list view", async ({ page, todoApp }) => {
    await todoApp.addTodo("Mobile task 1");
    await todoApp.addTodo("Mobile task 2");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("mobile-list-view.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("mobile todo details", async ({ page, todoApp }) => {
    await todoApp.addTodo("Mobile task");
    await todoApp.openTodoDetails("Mobile task");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("mobile-todo-details.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
