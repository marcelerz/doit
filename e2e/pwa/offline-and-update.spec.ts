import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";
import type { BrowserContext, Page } from "@playwright/test";

/**
 * The installed app: reloading offline, and the update prompt.
 *
 * Runs against the static export under /doit/ with its service worker; see
 * playwright.pwa.config.ts. Every test has a browser context of its own, so
 * each starts with no worker registered and nothing cached.
 *
 * Pages are opened with "./", not "/": the base URL ends in /doit/, and "/"
 * would leave it.
 */

/** Resolves once the service worker controls the page. */
async function waitForWorkerControl(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

const cacheNames = (page: Page) => page.evaluate(() => caches.keys());

const hasWaitingWorker = (page: Page) =>
  page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));

/**
 * Cuts the connection, for the page and for the worker.
 *
 * `setOffline` makes the browser report that it is offline, but it does not
 * reach the requests a service worker makes. So the server is told to drop
 * every connection as well; see serve-export.mjs.
 */
async function goOffline(page: Page, context: BrowserContext): Promise<void> {
  await page.request.post("/__pwa-test/offline");
  await context.setOffline(true);
}

/** Has the server hand out a changed worker, and has the page look for it. */
async function deployNewWorker(page: Page): Promise<void> {
  await page.request.post("/__pwa-test/next-worker");
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())?.update();
  });
}

test.describe("Installed app", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("./");
    await todoApp.waitForAppLoad();
    await waitForWorkerControl(page);
  });

  test.afterEach(async ({ request }) => {
    // The server is shared by every test, so it must not be left offline.
    await request.post("/__pwa-test/online");
  });

  test("the app reloads offline, with its data, once it has been opened twice", async ({ page, context, todoApp }) => {
    await todoApp.addTodo("Works offline");

    // A second visit, still online. Only now does the worker see the page ask
    // for its own files, and keep them.
    await page.reload();
    await todoApp.waitForAppLoad();

    await goOffline(page, context);
    await page.reload();
    await todoApp.waitForAppLoad();

    await expect(page.getByTestId("todo-item")).toContainText("Works offline");
    await expect(page.getByTitle("You're offline - app is working in offline mode")).toBeVisible();
  });

  // The first visit loads its scripts before the worker is in control, so they
  // are not kept. A reload without a connection brings back the page itself,
  // which then stays on "Loading...".
  test.fixme("the app reloads offline straight after the first visit (U0051)", async () => {});

  test("an update that arrives during a session is offered, and accepting it switches workers", async ({
    page,
    todoApp,
  }) => {
    const cachesBefore = await cacheNames(page);
    expect(cachesBefore.length).toBeGreaterThan(0);
    const toast = page.getByRole("alert").filter({ hasText: "Update available" });
    await expect(toast).toHaveCount(0);

    await deployNewWorker(page);

    // The new worker installs and waits; nothing changes under the user.
    await expect(toast).toBeVisible();
    expect(await hasWaitingWorker(page)).toBe(true);
    expect(await cacheNames(page)).toEqual(expect.arrayContaining(cachesBefore));

    // Accepting activates it and reloads the page.
    const reloaded = page.waitForEvent("load");
    await toast.getByRole("button", { name: "Update" }).click();
    await reloaded;
    await todoApp.waitForAppLoad();

    await expect(toast).toHaveCount(0);
    expect(await hasWaitingWorker(page)).toBe(false);
    // The new worker has its own caches and has removed the old version's.
    const cachesAfter = await cacheNames(page);
    expect(cachesAfter.length).toBeGreaterThan(0);
    expect(cachesAfter.filter((name) => cachesBefore.includes(name))).toEqual([]);
  });

  test("choosing Later dismisses the offer and stays on the current worker", async ({ page }) => {
    const cachesBefore = await cacheNames(page);
    const toast = page.getByRole("alert").filter({ hasText: "Update available" });

    await deployNewWorker(page);
    await expect(toast).toBeVisible();

    await toast.getByRole("button", { name: "Later" }).click();

    await expect(toast).toHaveCount(0);
    expect(await hasWaitingWorker(page)).toBe(true);
    expect(await cacheNames(page)).toEqual(expect.arrayContaining(cachesBefore));
  });

  // An update that finished installing before the page loaded is never
  // offered: the prompt only reacts to one that arrives while the page is open.
  test.fixme("an update already waiting when the app starts is offered (U0049)", async () => {});
});
