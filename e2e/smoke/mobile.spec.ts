import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";

/**
 * Smoke Test: Mobile
 *
 * These use the isolated fixture on purpose. The worker-shared page is created
 * once, with the project's defaults, before any `test.use` in a spec can apply
 * -- which is how this block spent its life running at 1280x720 while being
 * called "Mobile Viewport Tests". An isolated test gets its own context, and
 * that one does take the viewport set here.
 *
 * The file runs in two projects: `smoke-tests` (a narrow desktop Chrome) and
 * `smoke-mobile` (a phone profile, with touch and a mobile user agent).
 */
const PHONE = { width: 375, height: 667 }; // iPhone SE size

test.use({ viewport: PHONE });

test.describe("Mobile viewport", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
  });

  test("the app runs at phone width and lays itself out for it", async ({ page }) => {
    expect(page.viewportSize()).toEqual(PHONE);

    await expect(page.getByTestId("add-todo-button")).toBeVisible();
    // The sort and group controls leave the toolbar below the small breakpoint.
    // They are in the DOM either way, so this is the app reacting to the width.
    await expect(page.getByTestId("sort-button")).toBeHidden();
  });

  test("a todo can be added", async ({ page, todoApp }) => {
    await todoApp.addTodo("Mobile test todo");

    const rows = page.getByTestId("todo-item");
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("Mobile test todo");
  });

  test("views can be switched", async ({ page, todoApp }) => {
    // There is no hamburger menu -- the tab bar is a scrolling tablist at
    // every width -- so switch views through it.
    await todoApp.addTodo("Mobile navigation todo");

    await todoApp.switchView("kanban");
    await expect(page.getByTestId("kanban-view")).toBeVisible();
    await expect(page.getByTestId("kanban-view").getByTestId("todo-item")).toContainText("Mobile navigation todo");

    await todoApp.switchView("list");
    await expect(page.getByTestId("todo-item")).toContainText("Mobile navigation todo");
  });
});
