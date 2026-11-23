import { isolatedTest as test, expect, type TodoAppFixture } from "../fixtures/todo-app.fixture";
import { STORAGE_KEYS } from "../../src/storage/keys";
import type { Page } from "@playwright/test";

/**
 * Smoke Test: Moving Kanban cards from the keyboard
 *
 * The arrow keys are the only way to move a card without a pointer. They go
 * through the same transition rules as dragging, and say what happened in a
 * live region.
 *
 * The refusal tested here is the workflow rule Done -> Rejected. Two other
 * refusals are left to the units that fix them: a column at its limit, whose
 * counts are wrong today (U0149), and a task blocked by a dependency (U0223).
 */
async function workflowState(todoApp: TodoAppFixture): Promise<string | undefined> {
  return JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.TODOS)) ?? "[]")[0]?.workflowState;
}

const column = (page: Page, id: string) => page.getByTestId(`kanban-column-${id}`).getByTestId("todo-item");

test.describe("Kanban keyboard moves", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Ship the release");
  });

  test("arrow keys move a card one column at a time and announce each move", async ({ page, todoApp }) => {
    await todoApp.switchView("kanban");
    const card = page.getByRole("button", { name: /^Ship the release\./ });
    const announcement = page.getByTestId("kanban-view").getByRole("status");
    await expect(column(page, "backlog")).toHaveCount(1);

    // The card is focused again before every key. It should not need to be:
    // see the fixme below.
    await card.focus();
    await page.keyboard.press("ArrowRight");
    await expect(announcement).toHaveText("Moved to To Do");
    await expect(column(page, "todo")).toHaveCount(1);
    await expect(column(page, "backlog")).toHaveCount(0);

    await card.focus();
    await page.keyboard.press("ArrowRight");
    await expect(announcement).toHaveText("Moved to In Progress");
    await expect(column(page, "in-progress")).toHaveCount(1);
    await expect.poll(() => workflowState(todoApp)).toBe("in-progress");

    await card.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(announcement).toHaveText("Moved to To Do");
    await expect(column(page, "todo")).toHaveCount(1);
    await expect(column(page, "in-progress")).toHaveCount(0);
    await expect.poll(() => workflowState(todoApp)).toBe("todo");
  });

  test("a move the workflow does not allow is refused and says why", async ({ page, todoApp }) => {
    await todoApp.switchView("kanban");
    const card = page.getByRole("button", { name: /^Ship the release\./ });
    const announcement = page.getByTestId("kanban-view").getByRole("status");

    // Four allowed moves take the card from Backlog to Done.
    for (const name of ["To Do", "In Progress", "Review", "Done"]) {
      await card.focus();
      await page.keyboard.press("ArrowRight");
      await expect(announcement).toHaveText(`Moved to ${name}`);
    }
    await expect(column(page, "completed")).toHaveCount(1);
    await expect.poll(() => workflowState(todoApp)).toBe("completed");

    // Done to Rejected is not in the workflow.
    await card.focus();
    await page.keyboard.press("ArrowRight");

    await expect(announcement).toHaveText("Cannot move to Rejected: that transition is not allowed");
    await expect(column(page, "completed")).toHaveCount(1);
    await expect(column(page, "rejected")).toHaveCount(0);
    expect(await workflowState(todoApp)).toBe("completed");
  });

  // A card ticked done in the list is shown in Done, but its moves are worked
  // out from the column it was in before -- Backlog, for a new task -- so the
  // same arrow key sends it to To Do instead of being refused.
  test.fixme("a card completed in the list is refused the same move (U0219)", async () => {});

  // After a move the card is mounted again in its new column and focus falls
  // back to the page, so a second arrow press does nothing until the card is
  // found again with Tab.
  test.fixme("a card keeps keyboard focus after it moves (new finding)", async () => {});
});
