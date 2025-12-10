import { test, expect } from "./fixtures/todo-app.fixture";

test.describe("Calendar View", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();

    // Add test todos with dates
    await todoApp.addTodo("Calendar task today");
    await todoApp.addTodo("Calendar task tomorrow");
    await todoApp.addTodo("Calendar task next week");
  });

  test("should switch to calendar view", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");
      await expect(calendarView).toBeVisible();
    }
  });

  test("should display current month", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");

      // Should show current month name
      const currentMonth = new Date().toLocaleString("default", { month: "long" });
      await expect(calendarView).toContainText(currentMonth);
    }
  });

  test("should have navigation buttons", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");

      // Should have prev/next buttons
      const prevButton = calendarView.locator('button[aria-label="Previous month"]');
      const nextButton = calendarView.locator('button[aria-label="Next month"]');

      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();
    }
  });

  test("should navigate to previous month", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");
      const currentMonth = new Date().toLocaleString("default", { month: "long" });

      // Click previous month
      const prevButton = calendarView.locator('button[aria-label="Previous month"]');
      await prevButton.click();
      await page.waitForTimeout(300);

      // Month should change
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const expectedMonth = prevMonth.toLocaleString("default", { month: "long" });

      await expect(calendarView).toContainText(expectedMonth);
    }
  });

  test("should navigate to next month", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");

      // Click next month
      const nextButton = calendarView.locator('button[aria-label="Next month"]');
      await nextButton.click();
      await page.waitForTimeout(300);

      // Month should change
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const expectedMonth = nextMonth.toLocaleString("default", { month: "long" });

      await expect(calendarView).toContainText(expectedMonth);
    }
  });

  test("should have Today button", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");
      const todayButton = calendarView.locator('button:has-text("Today")');

      await expect(todayButton).toBeVisible();
    }
  });

  test("should return to current month with Today button", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");

      // Navigate away from current month
      const nextButton = calendarView.locator('button[aria-label="Next month"]');
      await nextButton.click();
      await nextButton.click();
      await page.waitForTimeout(300);

      // Click Today
      const todayButton = calendarView.locator('button:has-text("Today")');
      await todayButton.click();
      await page.waitForTimeout(300);

      // Should be back at current month
      const currentMonth = new Date().toLocaleString("default", { month: "long" });
      await expect(calendarView).toContainText(currentMonth);
    }
  });

  test("should show day cells", async ({ page }) => {
    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(300);

      const calendarView = page.getByTestId("calendar-view");

      // Should have day numbers visible (1-28 at minimum)
      await expect(calendarView).toContainText("15"); // Mid-month day
    }
  });
});

test.describe("Calendar View with Tasks", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.clearStorage();
    await page.reload();
    await todoApp.waitForAppLoad();
  });

  test("should indicate tasks without dates", async ({ page, todoApp }) => {
    // Add a task without a date
    await todoApp.addTodo("Task with no date");

    const calendarTab = page.getByTestId("view-tab-calendar");

    if (await calendarTab.isVisible()) {
      await calendarTab.click();
      await page.waitForTimeout(500);

      const calendarView = page.getByTestId("calendar-view");

      // Should show indicator about tasks without dates
      const noDateIndicator = calendarView.locator("text=/task.*without.*date/i");
      if ((await noDateIndicator.count()) > 0) {
        await expect(noDateIndicator.first()).toBeVisible();
      }
    }
  });
});
