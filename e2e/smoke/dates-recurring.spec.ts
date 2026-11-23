import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";
import { STORAGE_KEYS } from "../../src/storage/keys";
import type { TodoAppFixture } from "../fixtures/todo-app.fixture";
import type { Page } from "@playwright/test";

interface StoredTodo {
  /** As typed, markers and date words included. */
  text: string;
  /** What is left as the title once the parsers have taken their tokens. */
  plainText: string;
  dueDate?: number;
  recurring?: string;
}

/** The stored todo that was typed with `text` in it. */
async function storedTodo(todoApp: TodoAppFixture, text: string): Promise<StoredTodo> {
  const todos: StoredTodo[] = JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.TODOS)) ?? "[]");
  const match = todos.find((todo) => todo.text.includes(text));
  if (!match) throw new Error(`No stored todo containing "${text}"`);
  return match;
}

/**
 * How many calendar days from today a timestamp falls on.
 *
 * Worked out in the page, so "today" is the browser's today in the browser's
 * time zone -- the same one the app used when it resolved the date.
 */
async function daysFromToday(page: Page, timestamp: number): Promise<number> {
  return page.evaluate((value) => {
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return Math.round((startOfDay(new Date(value)) - startOfDay(new Date())) / 86_400_000);
  }, timestamp);
}

/**
 * Smoke Test: Dates and Recurring Tasks
 *
 * This test file consolidates due-dates.spec.ts, recurring.spec.ts,
 * and sorting-grouping.spec.ts into a single sequential workflow.
 */
test.describe("Dates and Recurring Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Sequential Date and Recurring Operations", () => {
    test("Step 1: Add todos with various date expressions", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todos with natural language dates
      await todoApp.addTodo("Morning standup today");
      await todoApp.addTodo("Code review tomorrow #backend");
      await todoApp.addTodo("Sprint planning next week");

      const count = await todoApp.getTodoCount();
      expect(count).toBe(3);
    });

    test("Step 2: Add recurring task", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add recurring task
      await todoApp.addTodo("Weekly sync every monday");

      // Verify it was created
      const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Weekly sync" });
      await expect(todoItem).toBeVisible();

      const count = await todoApp.getTodoCount();
      expect(count).toBe(4);
    });

    test("Step 3: Verify dates detected correctly", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // "today" and "tomorrow" became due dates on those days, in storage...
      const standup = await storedTodo(todoApp, "Morning standup");
      const review = await storedTodo(todoApp, "Code review");
      expect(typeof standup.dueDate).toBe("number");
      expect(typeof review.dueDate).toBe("number");
      expect(await daysFromToday(page, standup.dueDate as number)).toBe(0);
      expect(await daysFromToday(page, review.dueDate as number)).toBe(1);

      // ...and on screen: the details show today's date in the Due field.
      await todoApp.openTodoDetails("Morning standup");
      const today = await page.evaluate(() => {
        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, "0");
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      });
      await expect(page.getByTestId("todo-details-overlay").locator('input[type="date"]')).toHaveValue(today);

      await todoApp.closeOverlay();
    });

    test("Step 4: Check for recurring indicator", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // The rule was stored as the recurrence...
      const sync = await storedTodo(todoApp, "Weekly sync");
      expect(sync.recurring).toBe("every monday");

      // ...and the details show it.
      await todoApp.openTodoDetails("Weekly sync");
      await expect(page.getByTestId("todo-details-overlay")).toContainText("every monday");

      await todoApp.closeOverlay();
    });

    test("Step 5: Verify sorting/grouping works", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // The list is sectioned by due date and sorts inside each section, so the
      // order is compared among three todos that are all due tomorrow.
      await todoApp.addTodo("Alpha report tomorrow");
      await todoApp.addTodo("Zeta report tomorrow");
      const dueTomorrow = async () =>
        (await todoApp.getTodos())
          .filter((text) => /^(Alpha report|Code review|Zeta report)/.test(text))
          .map((text) => text.split(" ")[0]);
      expect(await dueTomorrow()).not.toEqual(["Alpha", "Code", "Zeta"]);

      const sortBy = page.getByTestId("sort-button");
      const direction = page.getByTitle(/^(Ascending|Descending)$/);

      await sortBy.selectOption("title");
      await expect(sortBy).toHaveValue("title");
      await expect.poll(dueTomorrow).toEqual(["Alpha", "Code", "Zeta"]);

      // The direction toggle reverses them.
      await direction.click();
      await expect.poll(dueTomorrow).toEqual(["Zeta", "Code", "Alpha"]);

      // Grouping keeps every todo on screen.
      const groupBy = page.getByTitle("Group by");
      await groupBy.selectOption("dueDate");
      await expect(groupBy).toHaveValue("dueDate");
      await expect(page.getByTestId("todo-item")).toHaveCount(6);

      // Back to the defaults for the steps that follow.
      await groupBy.selectOption("none");
      await direction.click();
      await sortBy.selectOption("manual");
    });

    test("Step 6: Apply a filter and clear it", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      const filterButton = page.getByTestId("filter-button");
      await expect(filterButton).toHaveAttribute("title", "Show filters");
      await filterButton.click();
      await expect(filterButton).toHaveAttribute("title", "Hide filters");

      // Only one todo carries the tag.
      const tag = page.getByRole("button", { name: "#backend", exact: true });
      await tag.click();
      await expect(page.getByTestId("todo-item")).toHaveCount(1);
      await expect(page.getByTestId("todo-item")).toContainText("Code review");

      await tag.click();
      await expect(page.getByTestId("todo-item")).toHaveCount(6);
      await filterButton.click();
    });

    test("Step 7: Persistence - reload and verify dates preserved", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // Verify todos still exist: four from the first steps, two from the sort step
      const count = await todoApp.getTodoCount();
      expect(count).toBe(6);

      // Verify specific todos
      const todos = await todoApp.getTodos();
      expect(todos.some((t) => t.includes("Morning standup"))).toBe(true);
      expect(todos.some((t) => t.includes("Weekly sync"))).toBe(true);
    });
  });
});
