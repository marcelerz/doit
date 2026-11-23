import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";
import { STORAGE_KEYS } from "../../src/storage/keys";

/**
 * Smoke Test: Time tracking and the time report
 *
 * One manual time entry, followed from the task it is logged on into the
 * report.
 *
 * The clock is fixed at a Wednesday morning. A manual entry is dated back from
 * "now", and the report's ranges are relative to today, so without a fixed
 * clock the entry could fall into yesterday or last week depending on when the
 * test runs.
 */
const WEDNESDAY_MORNING = new Date("2026-08-26T10:00:00-07:00");

test.describe("Time tracking and reports", () => {
  test("a manual time entry shows on the task and in the report for its period", async ({ page, todoApp }) => {
    await page.clock.setFixedTime(WEDNESDAY_MORNING);
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Write the report");

    await todoApp.openTodoDetails("Write the report");
    const details = page.getByRole("dialog", { name: "Task details" });
    await expect(details.getByText("Total: 0m")).toBeVisible();

    await details.getByRole("button", { name: "+ Manual" }).click();
    const manualForm = details.locator("div").filter({ has: page.getByPlaceholder("Note (optional)") }).last();
    await manualForm.getByPlaceholder("Hours").fill("1");
    await manualForm.getByPlaceholder("Min").fill("30");
    await manualForm.getByRole("button", { name: "Add", exact: true }).click();

    // The task totals it...
    await expect(details.getByText("Total: 1h 30m")).toBeVisible();
    await expect
      .poll(async () => JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.TODOS)) ?? "[]")[0]?.timeTracking?.totalMinutes)
      .toBe(90);
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();

    // ...and the report shows it in the current week, which is the default range.
    await todoApp.switchView("timereports");
    await expect(page.getByRole("heading", { name: "Time Reports" })).toBeVisible();
    // One group, holding the one entry, under the breakdown heading.
    const breakdown = page.getByRole("heading", { name: /Detailed Breakdown/ }).locator("xpath=../..");
    const groups = breakdown.locator("details");
    await expect(groups).toHaveCount(1);
    await expect(groups).toContainText("1 entry");
    await expect(groups).toContainText("1h 30m");

    // It is in today's range too, and not in last week's.
    const range = page.getByRole("combobox").filter({ has: page.getByRole("option", { name: "Last Week" }) });
    await range.selectOption({ label: "Today" });
    await expect(groups).toContainText("1h 30m");
    await range.selectOption({ label: "Last Week" });
    await expect(page.getByText("No time entries found")).toBeVisible();
    await expect(page.getByText("1h 30m")).toHaveCount(0);
  });
});
