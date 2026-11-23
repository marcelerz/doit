import type { Page } from "@playwright/test";
import { DB_NAME, STORAGE_KEYS } from "../../src/storage/keys";

/**
 * Empties the app's storage and marks the tutorial as seen.
 *
 * The page must already be on the app's origin. This is the one place that
 * knows how to reset the app: the worker-scoped reset below and the fixture's
 * `clearStorage` both call it.
 *
 * The names come from the app's own key registry and travel into the page as
 * arguments, because the function passed to `evaluate` runs in the browser and
 * cannot see this module's imports.
 */
export async function clearAppStorage(page: Page): Promise<void> {
  await page.evaluate(
    ({ dbName, tutorialKey }) => {
      localStorage.clear();
      if (typeof indexedDB !== "undefined") {
        indexedDB.deleteDatabase(dbName);
      }
      localStorage.setItem(tutorialKey, JSON.stringify({ completed: true, showOnStartup: false }));
    },
    { dbName: DB_NAME, tutorialKey: STORAGE_KEYS.TUTORIAL_PREFERENCES },
  );
}

/**
 * Reset storage before a spec file's steps run.
 *
 * It must run on the worker's shared page, not a fresh one: the steps below it
 * use that same context, and a page opened with browser.newPage() gets a
 * context of its own whose storage no test would ever read -- which is what
 * the original did.
 *
 * Since files run sequentially within a worker, this is also what isolates one
 * spec file from the next.
 */
export async function resetAppStorage(workerPage: Page): Promise<void> {
  await workerPage.goto("/");
  await clearAppStorage(workerPage);
}
