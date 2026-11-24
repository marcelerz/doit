import { readFile } from "node:fs/promises";
import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";
import type { Page } from "@playwright/test";

/**
 * Smoke Test: Exporting from the list
 *
 * The export menu says what it is about to write: "Exports all todos", or
 * "Exports filtered todos" once a search or filter is active. Both are checked
 * against the file that is downloaded.
 *
 * The export button is in the toolbar from the `lg` breakpoint up, which the
 * desktop project is.
 */
interface ExportedTodo {
  fullText: string;
  state: string;
}

/**
 * Opens the export menu, checks what it says it will write, picks JSON and
 * returns the downloaded file.
 */
async function exportAsJson(page: Page, footnote: string): Promise<{ filename: string; todos: ExportedTodo[] }> {
  await page.getByTitle("Export", { exact: true }).click();
  await expect(page.getByText(footnote, { exact: true })).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON (.json)" }).click();
  const download = await downloading;
  const file = JSON.parse(await readFile(await download.path(), "utf8"));
  return { filename: download.suggestedFilename(), todos: file.todos };
}

const texts = (todos: ExportedTodo[]) => todos.map((todo) => todo.fullText).sort();

test.describe("Exporting from the list", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Buy milk");
    await todoApp.addTodo("Buy bread");
    await todoApp.addTodo("Call the plumber");
    await todoApp.toggleTodo("Buy bread");
    await expect(page.getByTestId("todo-item").filter({ hasText: "Buy bread" })).toHaveAttribute(
      "data-completed",
      "true",
    );
  });

  test("without a filter the export holds every todo, completed ones included", async ({ page }) => {
    const { filename, todos } = await exportAsJson(page, "Exports all todos");

    expect(filename).toMatch(/^todos-\d{4}-\d{2}-\d{2}\.json$/);
    expect(texts(todos)).toEqual(["Buy bread", "Buy milk", "Call the plumber"]);
    expect(todos.find((todo) => todo.fullText === "Buy bread")?.state).toBe("completed");
  });

  test("with a search active the export holds only what the list shows", async ({ page, todoApp }) => {
    await todoApp.search("Buy");
    await expect(page.getByTestId("todo-item")).toHaveCount(2);

    const { todos } = await exportAsJson(page, "Exports filtered todos");

    expect(texts(todos)).toEqual(["Buy bread", "Buy milk"]);
  });
});
