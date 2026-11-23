import { isolatedTest as test, expect, type TodoAppFixture } from "../fixtures/todo-app.fixture";
import { STORAGE_KEYS } from "../../src/storage/keys";
import type { Page } from "@playwright/test";

/**
 * Smoke Test: Sprints
 *
 * A sprint from planning to completed, and which sprints can be deleted. Each
 * test starts from an empty app and creates what it needs.
 *
 * Two things are left out on purpose, because both are open defects: the dates
 * a sprint is given when it starts and ends (U0589), and what happens to a
 * sprint's todos when it is deleted (U0574).
 */
interface StoredSprint {
  name: string;
  status: string;
  state: string;
}

async function storedSprints(todoApp: TodoAppFixture): Promise<StoredSprint[]> {
  return JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.SPRINTS)) ?? "[]");
}

async function addSprint(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "Add Sprint" }).first().click();
  const form = page.locator("form").filter({ has: page.locator('input[name="name"]') });
  await form.locator('input[name="name"]').fill(name);
  await form.getByRole("button", { name: "Add Sprint" }).click();
  await expect(form).toHaveCount(0);
}

test.describe("Sprints", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.switchView("sprints");
  });

  test("a sprint is created in planning, started and completed", async ({ page, todoApp }) => {
    const emptyState = page.getByRole("heading", { name: "No Sprints" });
    await expect(emptyState).toBeVisible();

    await addSprint(page, "Alpha sprint");

    const row = page.getByTestId("sprint-item");
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Alpha sprint");
    await expect(row).toContainText("Planning");
    await expect(emptyState).toHaveCount(0);

    await row.click();
    const details = page.getByRole("dialog", { name: "Sprint details" });
    await expect(details).toBeVisible();

    // Planning offers Start, and not yet Complete.
    await expect(details.getByRole("button", { name: /Complete Sprint/ })).toHaveCount(0);
    await details.getByRole("button", { name: /Start Sprint/ }).click();
    await expect.poll(async () => (await storedSprints(todoApp))[0]?.status).toBe("active");

    // A running sprint offers Complete, and Start is gone.
    await expect(details.getByRole("button", { name: /Start Sprint/ })).toHaveCount(0);
    await details.getByRole("button", { name: /Complete Sprint/ }).click();
    await expect.poll(async () => (await storedSprints(todoApp))[0]?.status).toBe("completed");

    // A finished sprint offers neither, and can be archived.
    await expect(details.getByRole("button", { name: /(Start|Complete|Cancel) Sprint/ })).toHaveCount(0);
    await expect(details.getByTestId("action-archive")).toBeVisible();

    await details.getByRole("button", { name: "Close" }).click();
    await expect(details).toBeHidden();
    await expect(row).toContainText("Completed");
  });

  test("a sprint can be deleted while it is in planning, and not once it has started", async ({ page, todoApp }) => {
    await addSprint(page, "Running sprint");
    await addSprint(page, "Shelved sprint");
    const rows = page.getByTestId("sprint-item");
    await expect(rows).toHaveCount(2);
    const details = page.getByRole("dialog", { name: "Sprint details" });

    // Started: no delete on offer.
    await rows.filter({ hasText: "Running sprint" }).click();
    await details.getByRole("button", { name: /Start Sprint/ }).click();
    await expect(details.getByRole("button", { name: /Complete Sprint/ })).toBeVisible();
    await expect(details.getByTestId("action-delete")).toHaveCount(0);
    await details.getByRole("button", { name: "Close" }).click();
    await expect(details).toBeHidden();

    // Still in planning: delete is offered, and removes that sprint only.
    await rows.filter({ hasText: "Shelved sprint" }).click();
    await details.getByTestId("action-delete").click();
    await expect(details).toBeHidden();

    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("Running sprint");
    await expect
      .poll(async () => (await storedSprints(todoApp)).filter((sprint) => sprint.state !== "deleted").map((sprint) => sprint.name))
      .toEqual(["Running sprint"]);
  });
});
