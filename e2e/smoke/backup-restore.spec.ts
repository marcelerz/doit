import { readFile } from "node:fs/promises";
import { isolatedTest as test, expect, type TodoAppFixture } from "../fixtures/todo-app.fixture";
import { STORAGE_KEYS } from "../../src/storage/keys";
import type { Page } from "@playwright/test";

/**
 * Smoke Test: Backup and restore
 *
 * The one path that can replace everything a user has stored, so it is tested
 * end to end: take a backup, change the data, restore, and see the earlier
 * data come back.
 *
 * Counts of backups are not asserted. The app may add an automatic backup of
 * its own on the first visit of a day, so the tests look for the manual one
 * they made.
 */
async function openBackupSettings(page: Page): Promise<void> {
  await page.getByTestId("settings-button").click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole("button", { name: "Backup", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Backup & Restore" })).toBeVisible();
}

async function backToTodos(page: Page, todoApp: TodoAppFixture): Promise<void> {
  await page.getByRole("link", { name: "Back to Todos" }).click();
  await todoApp.waitForAppLoad();
}

/** The rows of the backup list that were made by hand. */
function manualBackups(page: Page) {
  return page
    .locator("div")
    .filter({ hasText: "Manual" })
    .filter({ has: page.getByRole("button", { name: "Restore" }) })
    .filter({ hasNot: page.getByRole("button", { name: "Create Backup Now" }) });
}

test.describe("Backup and restore", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Before the backup");
  });

  test("restoring a backup brings back the data it was taken from", async ({ page, todoApp }) => {
    await openBackupSettings(page);
    await expect(manualBackups(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Create Backup Now" }).click();
    await expect(manualBackups(page).last()).toBeVisible();

    // Change the data after the backup was taken.
    await backToTodos(page, todoApp);
    await todoApp.addTodo("After the backup");
    await expect(page.getByTestId("todo-item")).toHaveCount(2);

    await openBackupSettings(page);
    await manualBackups(page).last().getByRole("button", { name: "Restore" }).click();

    // Restoring replaces everything, so it asks first.
    await expect(page.getByRole("heading", { name: "Restore Backup" })).toBeVisible();
    const reloaded = page.waitForEvent("load");
    await page.getByRole("button").filter({ hasText: /^Restore$/ }).click();
    // The app reloads itself once the restore has been written.
    await reloaded;

    await backToTodos(page, todoApp);
    const rows = page.getByTestId("todo-item");
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("Before the backup");
  });

  test("cancelling the confirmation restores nothing", async ({ page, todoApp }) => {
    await openBackupSettings(page);
    await page.getByRole("button", { name: "Create Backup Now" }).click();
    await expect(manualBackups(page).last()).toBeVisible();
    await backToTodos(page, todoApp);
    await todoApp.addTodo("After the backup");

    await openBackupSettings(page);
    await manualBackups(page).last().getByRole("button", { name: "Restore" }).click();
    const confirmation = page.getByRole("heading", { name: "Restore Backup" });
    await expect(confirmation).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(confirmation).toHaveCount(0);

    await backToTodos(page, todoApp);
    await expect(page.getByTestId("todo-item")).toHaveCount(2);
  });

  test("exporting the current data downloads a backup file that holds it", async ({ page }) => {
    await openBackupSettings(page);

    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Current Data" }).click();
    const download = await downloading;

    expect(download.suggestedFilename()).toMatch(/^doit-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(backup.timestamp).toEqual(expect.any(Number));
    // Each stored key is kept as the string the app wrote.
    const todos = JSON.parse(backup.keys[STORAGE_KEYS.TODOS]);
    expect(todos.map((todo: { text: string }) => todo.text)).toEqual(["Before the backup"]);
  });
});
