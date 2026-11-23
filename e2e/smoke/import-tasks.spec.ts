import { writeFile } from "node:fs/promises";
import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";
import type { Page, TestInfo } from "@playwright/test";

/**
 * Smoke Test: Importing tasks
 *
 * A file in the generic JSON format goes through the preview and into the
 * list. The file is written by the test, with titles and a completed flag
 * only.
 *
 * The app's own export is not used as the input on purpose: exporting and
 * importing back does not round-trip today, and that spec belongs to the unit
 * that fixes it (U0099).
 */
const TASKS = [{ title: "Imported one" }, { title: "Imported two", completed: true }, { title: "Imported three" }];

async function chooseImportFile(page: Page, testInfo: TestInfo): Promise<void> {
  const file = testInfo.outputPath("tasks.json");
  await writeFile(file, JSON.stringify(TASKS));

  await page.getByTestId("settings-button").click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Import Tasks" })).toBeVisible();
  await page.locator('input[type="file"][accept=".json,.csv"]').setInputFiles(file);
}

test.describe("Importing tasks", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Already here");
  });

  test("a JSON file is previewed, imported and added to the list", async ({ page, todoApp }, testInfo) => {
    await chooseImportFile(page, testInfo);

    // The preview says what it found before anything is written.
    await expect(page.getByText("Found 3 tasks in JSON format")).toBeVisible();
    await expect(page.getByText("3 of 3 selected")).toBeVisible();
    for (const task of TASKS) {
      await expect(page.getByText(task.title, { exact: true })).toBeVisible();
    }

    await page.getByRole("button", { name: "Import 3 Tasks" }).click();
    await expect(page.getByText("Import Complete!")).toBeVisible();
    await expect(page.getByText("Successfully imported 3 tasks.")).toBeVisible();

    // The imported tasks are added to what was there, completed flag included.
    await page.getByRole("link", { name: "Back to Todos" }).click();
    await todoApp.waitForAppLoad();
    const row = (text: string) => page.getByTestId("todo-item").filter({ hasText: text });
    await expect(page.getByTestId("todo-item")).toHaveCount(4);
    await expect(row("Already here")).toHaveAttribute("data-completed", "false");
    await expect(row("Imported one")).toHaveAttribute("data-completed", "false");
    await expect(row("Imported two")).toHaveAttribute("data-completed", "true");
    await expect(row("Imported three")).toHaveAttribute("data-completed", "false");
  });

  test("cancelling the preview imports nothing", async ({ page, todoApp }, testInfo) => {
    await chooseImportFile(page, testInfo);
    await expect(page.getByText("Found 3 tasks in JSON format")).toBeVisible();

    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByText("Found 3 tasks in JSON format")).toHaveCount(0);

    await page.getByRole("link", { name: "Back to Todos" }).click();
    await todoApp.waitForAppLoad();
    await expect(page.getByTestId("todo-item")).toHaveCount(1);
    await expect(page.getByTestId("todo-item")).toContainText("Already here");
  });
});
