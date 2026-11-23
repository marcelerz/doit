import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";

/**
 * Smoke Test: Calendar view modes
 *
 * Month, Week and Agenda each show a task that is due today, and exactly one
 * of the three is marked as the current mode.
 *
 * Only the mode switch is covered. Moving between periods and picking days
 * from the keyboard are being reworked (U0336) and get their specs with that
 * unit.
 */
test.describe("Calendar view modes", () => {
  test("Month, Week and Agenda each show today's task, with one mode marked current", async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Dentist today");
    await todoApp.switchView("calendar");

    const calendar = page.getByTestId("calendar-view");
    const modes = page.getByRole("group", { name: "View mode" });
    const mode = (name: string) => modes.getByRole("button", { name, exact: true });
    const pressed = () =>
      modes.getByRole("button").evaluateAll((buttons) =>
        buttons.filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent?.trim()),
      );

    // Month is where the calendar starts: a grid of six weeks.
    expect(await pressed()).toEqual(["Month"]);
    await expect(calendar.getByRole("grid")).toHaveCount(1);
    await expect(calendar.getByRole("gridcell")).toHaveCount(42);
    await expect(calendar.getByText("Dentist").first()).toBeVisible();

    // Week replaces the month grid and still shows the task.
    await mode("Week").click();
    await expect(mode("Week")).toHaveAttribute("aria-pressed", "true");
    expect(await pressed()).toEqual(["Week"]);
    await expect(calendar.getByRole("grid")).toHaveCount(0);
    await expect(calendar.getByText("Dentist").first()).toBeVisible();

    // Agenda lists the task under its day, with a count.
    await mode("Agenda").click();
    await expect(mode("Agenda")).toHaveAttribute("aria-pressed", "true");
    expect(await pressed()).toEqual(["Agenda"]);
    await expect(calendar.getByText("1 task", { exact: true })).toBeVisible();
    await expect(calendar.getByText("Dentist").first()).toBeVisible();

    // And back.
    await mode("Month").click();
    expect(await pressed()).toEqual(["Month"]);
    await expect(calendar.getByRole("gridcell")).toHaveCount(42);
  });
});
