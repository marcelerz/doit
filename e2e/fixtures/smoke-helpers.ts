import type { Page } from "@playwright/test";

/**
 * Reset storage before a spec file's steps run.
 *
 * Pasted identically into all nine smoke specs. It must run on the worker's
 * shared page, not a fresh one: the steps below it use that same context, and
 * a page opened with browser.newPage() gets a context of its own whose storage
 * no test would ever read -- which is what the original did.
 *
 * Since files run sequentially within a worker, this is also what isolates one
 * spec file from the next.
 */
export async function resetAppStorage(workerPage: Page): Promise<void> {
  await workerPage.goto("/");
  await workerPage.evaluate(() => {
    localStorage.clear();
    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("doit-db");
    }
    localStorage.setItem("doit-tutorial-preferences", JSON.stringify({ completed: true, showOnStartup: false }));
  });
}
