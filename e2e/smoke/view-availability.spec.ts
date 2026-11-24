import { isolatedTest as test, expect, type TodoAppFixture } from "../fixtures/todo-app.fixture";
import { DB_NAME, STORAGE_KEYS, STORE_NAME } from "../../src/storage/keys";
import type { Page } from "@playwright/test";

/**
 * Smoke Test: Which view the app shows when the stored or current one is not
 * available
 *
 * Two ways to end up on a view that cannot be shown: its feature was switched
 * off, or the stored tab is not a view at all. Both fall back to the list.
 */

/** The tab the app last stored as the one to come back to. */
async function storedTab(todoApp: TodoAppFixture): Promise<string | undefined> {
  return JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.UI_OPTIONS)) ?? "{}").activeTab;
}

/** Writes a raw value where the app's storage adapter keeps it. */
async function writeStoredValue(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ storageKey, storedValue, dbName, storeName }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction(storeName, "readwrite");
          transaction.objectStore(storeName).put(storedValue, storageKey);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    { storageKey: key, storedValue: value, dbName: DB_NAME, storeName: STORE_NAME },
  );
}

test.describe("View availability", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.addTodo("Still here");
  });

  test("a view switched off in Settings is not reopened: the app falls back to the list", async ({ page, todoApp }) => {
    // Kanban is the view to come back to...
    await todoApp.switchView("kanban");
    await expect.poll(() => storedTab(todoApp)).toBe("kanban");

    // ...and is then switched off.
    await page.getByTestId("settings-button").click();
    await expect(page).toHaveURL(/\/settings$/);
    await page.getByRole("checkbox", { name: /^Kanban Board/ }).uncheck();
    await page.getByRole("link", { name: "Back to Todos" }).click();
    await todoApp.waitForAppLoad();

    // The list is also what the app shows before it has read the stored tab,
    // so the stored tab changing to "list" is what shows the fallback happened.
    await expect.poll(() => storedTab(todoApp)).toBe("list");
    await expect(page.getByTestId("view-tab-list")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("view-tab-kanban")).toHaveCount(0);
    await expect(page.getByTestId("kanban-view")).toHaveCount(0);
    await expect(page.getByTestId("todo-item")).toContainText("Still here");
    expect(await storedTab(todoApp)).toBe("list");
  });

  // The same fallback while the view is open, with the switch flipped in a
  // second tab. It cannot pass yet: a tab only starts listening for other
  // tabs' settings once it has saved settings itself, so the first tab never
  // hears about the change. The body is the reproducer for that fix.
  test.fixme("a view switched off in another tab falls back to the list (U0072)", async ({ page, context, todoApp }) => {
    await todoApp.switchView("kanban");
    await expect(page.getByTestId("kanban-view")).toBeVisible();

    const settings = await context.newPage();
    await settings.goto("/settings");
    await settings.getByRole("checkbox", { name: /^Kanban Board/ }).uncheck();

    await expect(page.getByTestId("kanban-view")).toHaveCount(0);
    await expect(page.getByTestId("view-tab-kanban")).toHaveCount(0);
    await expect(page.getByTestId("view-tab-list")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("todo-item")).toContainText("Still here");
  });

  test("a stored tab that is not a view opens on the list", async ({ page, todoApp }) => {
    await writeStoredValue(page, STORAGE_KEYS.UI_OPTIONS, JSON.stringify({ activeTab: "no-such-view" }));
    await page.reload();
    await todoApp.waitForAppLoad();

    // The app writes the tab it settled on back once it has read its options,
    // so this also shows the stored value was read and not just never loaded.
    await expect.poll(() => storedTab(todoApp)).toBe("list");
    await expect(page.getByTestId("view-tab-list")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("todo-item")).toContainText("Still here");
  });
});
