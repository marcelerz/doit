import { isolatedTest as test, expect, type TodoAppFixture } from "../fixtures/todo-app.fixture";
import { STORAGE_KEYS } from "../../src/storage/keys";
import type { Page } from "@playwright/test";

/**
 * Smoke Test: Reviews
 *
 * A review's life from draft to archive. Each test starts from an empty app and
 * creates what it needs.
 *
 * The periods on offer depend on today's date, so nothing here names one: a
 * test takes whichever period is offered first and reads its label from the
 * button. The summary field is left alone on purpose -- it is being reworked
 * (U0709).
 */
interface StoredReview {
  title: string;
  state: string;
  periodLabel: string;
  completedAt?: number;
  archivedAt?: number;
}

async function storedReviews(todoApp: TodoAppFixture): Promise<StoredReview[]> {
  return JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.REVIEWS)) ?? "[]");
}

/** Starts a review for the first period on offer, titles it and returns to the list. */
async function draftReview(page: Page, title: string): Promise<string> {
  const add = page.getByRole("button", { name: /^Add / }).first();
  const period = ((await add.textContent()) ?? "").replace(/^Add /, "").trim();
  await add.click();
  await page.getByPlaceholder("Review title...").fill(title);
  await page.getByRole("button", { name: "Back to reviews" }).click();
  return period;
}

test.describe("Reviews", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.switchView("reviews");
  });

  test("a review is drafted for a period, titled and listed as a draft", async ({ page, todoApp }) => {
    await expect(page.getByTestId("review-item")).toHaveCount(0);

    const add = page.getByRole("button", { name: /^Add / }).first();
    const period = ((await add.textContent()) ?? "").replace(/^Add /, "").trim();
    expect(period).not.toBe("");
    await add.click();

    // The editor opens on a draft that is titled after its period.
    const title = page.getByPlaceholder("Review title...");
    await expect(title).toHaveValue(period);
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await title.fill("A good stretch");
    await page.getByRole("button", { name: "Back to reviews" }).click();

    const items = page.getByTestId("review-item");
    await expect(items).toHaveCount(1);
    await expect(items).toContainText("A good stretch");
    await expect(items).toContainText("Draft");
    // The period has its review now, so it is no longer offered.
    await expect(page.getByRole("button", { name: `Add ${period}`, exact: true })).toHaveCount(0);

    await expect
      .poll(() => storedReviews(todoApp))
      .toMatchObject([{ title: "A good stretch", state: "pending", periodLabel: period }]);
  });

  test("completing a review takes it out of the drafts and closes it to editing", async ({ page, todoApp }) => {
    await draftReview(page, "Done and dusted");
    const item = page.getByTestId("review-item");
    await expect(item).toContainText("Draft");

    await page.getByRole("button", { name: "Complete review" }).click();

    await expect(item).toContainText("Complete");
    await expect(item).not.toContainText("Draft");
    await expect(page.getByRole("button", { name: "Complete review" })).toHaveCount(0);
    await expect.poll(async () => (await storedReviews(todoApp))[0]?.state).toBe("completed");
    expect((await storedReviews(todoApp))[0].completedAt).toEqual(expect.any(Number));

    // A completed review opens read-only: there is no title field to type in.
    await item.click();
    await expect(page.getByText("Done and dusted")).toBeVisible();
    await expect(page.getByPlaceholder("Review title...")).toHaveCount(0);
  });

  test("archiving a completed review marks it archived, offers an undo and survives a reload", async ({
    page,
    todoApp,
  }) => {
    await draftReview(page, "For the archive");
    await page.getByRole("button", { name: "Complete review" }).click();
    const item = page.getByTestId("review-item");
    await expect(item).toContainText("Complete");

    await page.getByRole("button", { name: "Archive", exact: true }).click();

    await expect(item).toContainText("Archived");
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect.poll(async () => (await storedReviews(todoApp))[0]?.state).toBe("archived");

    await page.reload();
    await todoApp.waitForAppLoad();
    await todoApp.switchView("reviews");
    await expect(page.getByTestId("review-item")).toHaveCount(1);
    await expect(page.getByTestId("review-item")).toContainText("For the archive");
    await expect(page.getByTestId("review-item")).toContainText("Archived");
  });
});
