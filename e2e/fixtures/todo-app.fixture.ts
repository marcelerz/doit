import { test as base, expect, type Page } from "@playwright/test";
import { DB_NAME, STORE_NAME } from "../../src/storage/keys";
import type { ViewTab } from "../../src/types/viewRegistry";
import { clearAppStorage } from "./smoke-helpers";

/**
 * Custom fixture for Todo app E2E tests
 * Provides helper methods for common operations
 */
export interface TodoAppFixture {
  /** Clear all localStorage data to start with a clean state */
  clearStorage: () => Promise<void>;

  /** Wait for the app to be fully loaded */
  waitForAppLoad: () => Promise<void>;

  /** Add a new todo with the given text */
  addTodo: (text: string) => Promise<void>;

  /** Get all visible todo items */
  getTodos: () => Promise<string[]>;

  /** Toggle completion status of a todo by its text */
  toggleTodo: (text: string) => Promise<void>;

  /** Delete a todo by its text */
  deleteTodo: (text: string) => Promise<void>;

  /** Open a todo's detail overlay */
  openTodoDetails: (text: string) => Promise<void>;

  /** Close the currently open overlay */
  closeOverlay: () => Promise<void>;

  /** Switch to a different view tab */
  switchView: (view: ViewTab) => Promise<void>;

  /** Search for todos */
  search: (text: string) => Promise<void>;

  /** Clear search */
  clearSearch: () => Promise<void>;

  /** Add a subtask to a todo (must have details overlay open) */
  addSubtask: (text: string) => Promise<void>;

  /** Archive a todo via the details overlay */
  archiveTodo: (text: string) => Promise<void>;

  /** Duplicate a todo via the details overlay */
  duplicateTodo: (text: string) => Promise<void>;

  /** Get the count of todos */
  getTodoCount: () => Promise<number>;

  /** Read a raw stored value from whichever backend the app is using */
  getStoredValue: (key: string) => Promise<string | null>;
}

/**
 * Every spec here is `describe.serial` and builds on state left by the previous
 * step -- Step 2 adds todos, Step 3 completes them. Playwright gives each test a
 * fresh BrowserContext, so that state was always discarded and every step after
 * the first opened an empty app.
 *
 * One context per worker fixes it: `page.goto("/")` then preserves localStorage
 * and IndexedDB across the steps of a file. Overriding the built-in `page`
 * fixture keeps all existing `({ page, todoApp })` signatures working.
 *
 * Files are still isolated from one another: each spec's `beforeAll` clears
 * storage on `workerPage`, and files run sequentially within a worker.
 */
/**
 * Builds the helper surface against a given page.
 */
function createTodoApp(page: Page): TodoAppFixture {
  const fixture: TodoAppFixture = {
    clearStorage: () => clearAppStorage(page),

    waitForAppLoad: async () => {
      // Wait for the main app container to be visible
      await page.waitForSelector('[data-testid="todo-app"]', {
        timeout: 10000,
      });
      // Wait a bit for React hydration
      await page.waitForTimeout(500);

      // Dismiss the tutorial if it appeared. Seeding storage cannot suppress it:
      // the fixture writes localStorage, but the app reads tutorial preferences
      // through the storage adapter, which is IndexedDB whenever it is available.
      // The overlay is `fixed inset-0 z-[9999]` and swallows every click behind it.
      const skipTutorial = page.getByRole("button", { name: "Skip tutorial" });
      if (await skipTutorial.isVisible().catch(() => false)) {
        await skipTutorial.click();
        await page.waitForTimeout(300);
      }
    },

    addTodo: async (text: string) => {
      // Click the Add button to open the overlay
      const addButton = page.getByTestId("add-todo-button");
      await addButton.click();

      // Wait for the overlay and SmartInput to appear
      await page.waitForSelector('[data-testid="smart-input"]', {
        timeout: 5000,
      });

      const input = page.getByTestId("smart-input");
      await input.click();
      await input.fill(text);

      // Click the "Add Todo" button in the overlay
      const submitButton = page.getByTestId("add-todo-submit");
      await submitButton.click();

      // Wait for the overlay to close and todo to appear
      await page.waitForTimeout(500);
    },

    getTodos: async () => {
      const todoItems = page.locator('[data-testid="todo-item"]');
      const count = await todoItems.count();
      const texts: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await todoItems
          .nth(i)
          .locator('[data-testid="todo-text"]')
          .textContent();
        if (text) texts.push(text.trim());
      }
      return texts;
    },

    toggleTodo: async (text: string) => {
      const todoItem = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: text });
      await todoItem.locator('[data-testid="todo-checkbox"]').click();
    },

    deleteTodo: async (text: string) => {
      const todoItem = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: text });
      // Row actions are revealed on hover (opacity-0 group-hover:opacity-100).
      // The previous approach clicked the row to "expand" it, but inline
      // expansion is dead code -- clicking a row opens the details overlay,
      // and clicking it a second time reopened that overlay on top of the
      // very button this then tried to press.
      await todoItem.hover();
      await todoItem.locator('[data-testid="todo-delete"]').click();
    },

    getStoredValue: async (key: string) => {
      // The app writes through its storage adapter, which is IndexedDB
      // whenever it is available. Reading localStorage directly returns
      // nothing on those installs, so check both.
      return await page.evaluate(
        async ({ storageKey, dbName, storeName }) => {
          const local = localStorage.getItem(storageKey);
          if (local !== null) return local;
          return await new Promise<string | null>((resolve) => {
            const request = indexedDB.open(dbName);
            request.onerror = () => resolve(null);
            request.onsuccess = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains(storeName)) return resolve(null);
              const read = db.transaction(storeName, "readonly").objectStore(storeName).get(storageKey);
              read.onerror = () => resolve(null);
              read.onsuccess = () => resolve(typeof read.result === "string" ? read.result : null);
            };
          });
        },
        { storageKey: key, dbName: DB_NAME, storeName: STORE_NAME },
      );
    },

    openTodoDetails: async (text: string) => {
      const todoItem = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: text });
      // List rows open the overlay on double-click; Kanban cards open it on a
      // single click. Try one click first and only escalate if nothing opened,
      // so this works whichever view the previous step left active.
      const overlay = page.locator('[data-testid="todo-details-overlay"]');
      await todoItem.first().click();
      if (!(await overlay.isVisible().catch(() => false))) {
        await todoItem.first().dblclick();
      }
      await page.waitForSelector('[data-testid="todo-details-overlay"]', {
        timeout: 5000,
      });
    },

    closeOverlay: async () => {
      // Click the backdrop or close button
      const closeButton = page.locator('[data-testid="overlay-close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Press Escape
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(300);
    },

    switchView: async (view: ViewTab) => {
      // Previously this silently did nothing when the tab was not visible, so a
      // test could go on asserting against whatever view happened to be open --
      // including filing a screenshot of the list view as another view's
      // baseline. Failing here is the point.
      const tab = page.getByTestId(`view-tab-${view}`);
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await page.waitForTimeout(300);
    },

    search: async (text: string) => {
      const searchInput = page.getByTestId("search-input");
      await searchInput.fill(text);
      await page.waitForTimeout(300);
    },

    clearSearch: async () => {
      const searchInput = page.getByTestId("search-input");
      await searchInput.clear();
      await page.waitForTimeout(300);
    },

    addSubtask: async (text: string) => {
      const subtaskInput = page.getByTestId("subtask-input");
      await subtaskInput.fill(text);
      const addButton = page.getByTestId("subtask-add-button");
      await addButton.click();
      await page.waitForTimeout(300);
    },

    archiveTodo: async (text: string) => {
      const todoItem = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: text });
      await todoItem.dblclick();
      await page.waitForSelector('[data-testid="todo-details-overlay"]', {
        timeout: 5000,
      });
      const archiveButton = page.getByTestId("action-archive");
      await archiveButton.click();
      await page.waitForTimeout(500);
    },

    duplicateTodo: async (text: string) => {
      const todoItem = page
        .locator('[data-testid="todo-item"]')
        .filter({ hasText: text });
      await todoItem.dblclick();
      await page.waitForSelector('[data-testid="todo-details-overlay"]', {
        timeout: 5000,
      });
      const duplicateButton = page.getByTestId("action-duplicate");
      await duplicateButton.click();
      await page.waitForTimeout(500);
      // Close the overlay
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    },

    getTodoCount: async () => {
      const todoItems = page.locator('[data-testid="todo-item"]');
      return await todoItems.count();
    },

  };

  return fixture;
}

/**
 * Per-test isolated page, Playwright's default.
 *
 * Use this for specs whose tests are independent and for any spec that sets
 * its own context options -- `test.use({ viewport })` cannot apply to a
 * context the worker fixture below already created.
 */
export const isolatedTest = base.extend<{ todoApp: TodoAppFixture }>({
  todoApp: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createTodoApp(page));
  },
});

export const test = base.extend<
  { todoApp: TodoAppFixture },
  { workerPage: Page }
>({
  workerPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],

  page: async ({ workerPage }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(workerPage);
  },

  todoApp: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(createTodoApp(page));
  },
});

export { expect };
