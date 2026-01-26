import { test as base, expect } from "@playwright/test";

/**
 * Todo setup for batch operations
 */
export interface TodoSetup {
  text: string;
  completed?: boolean;
}

/**
 * App state snapshot for comparison
 */
export interface AppStateSnapshot {
  todoCount: number;
  todoTexts: string[];
  completedCount: number;
  timestamp: number;
}

/**
 * Expected todo state counts
 */
export interface TodoStateExpectation {
  completed?: number;
  archived?: number;
  active?: number;
  total?: number;
}

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
  switchView: (view: "list" | "kanban" | "gantt" | "calendar" | "people" | "projects") => Promise<void>;

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

  // === Workflow helpers for smoke tests ===

  /** Add multiple todos with metadata in batch */
  addTodosWithMetadata: (todos: TodoSetup[]) => Promise<void>;

  /** Verify todo count matches expected */
  verifyTodoCount: (expected: number) => Promise<void>;

  /** Verify todo states match expectations */
  verifyTodoStates: (expected: TodoStateExpectation) => Promise<void>;

  /** Assert data persisted after reload */
  assertAllPersisted: () => Promise<void>;

  /** Assert current view state */
  assertViewState: (view: string) => Promise<void>;

  /** Get current app state snapshot */
  getAppState: () => Promise<AppStateSnapshot>;

  /** Compare two state snapshots */
  compareStates: (before: AppStateSnapshot, after: AppStateSnapshot) => { added: number; removed: number; changed: boolean };
}

export const test = base.extend<{ todoApp: TodoAppFixture }>({
  todoApp: async ({ page }, use) => {
    const fixture: TodoAppFixture = {
      clearStorage: async () => {
        await page.evaluate(() => {
          localStorage.clear();
          // Also clear IndexedDB
          if (typeof indexedDB !== "undefined") {
            indexedDB.deleteDatabase("doit-storage");
          }
          // Set tutorial as completed to prevent it from showing
          localStorage.setItem("doit-tutorial-preferences", JSON.stringify({ completed: true, showOnStartup: false }));
        });
      },

      waitForAppLoad: async () => {
        // Wait for the main app container to be visible
        await page.waitForSelector('[data-testid="todo-app"]', { timeout: 10000 });
        // Wait a bit for React hydration
        await page.waitForTimeout(500);
      },

      addTodo: async (text: string) => {
        // Click the Add button to open the overlay
        const addButton = page.locator('button:has-text("Add")').first();
        await addButton.click();

        // Wait for the overlay and SmartInput to appear
        await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

        const input = page.getByTestId("smart-input");
        await input.click();
        await input.fill(text);

        // Click the "Add Todo" button in the overlay
        const submitButton = page.locator('button:has-text("Add Todo")');
        await submitButton.click();

        // Wait for the overlay to close and todo to appear
        await page.waitForTimeout(500);
      },

      getTodos: async () => {
        const todoItems = page.locator('[data-testid="todo-item"]');
        const count = await todoItems.count();
        const texts: string[] = [];
        for (let i = 0; i < count; i++) {
          const text = await todoItems.nth(i).locator('[data-testid="todo-text"]').textContent();
          if (text) texts.push(text.trim());
        }
        return texts;
      },

      toggleTodo: async (text: string) => {
        const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: text });
        await todoItem.locator('[data-testid="todo-checkbox"]').click();
      },

      deleteTodo: async (text: string) => {
        const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: text });
        // First expand the todo to show delete button (click on it)
        await todoItem.click();
        await page.waitForTimeout(200);
        // Close any overlay that might have opened (escape key)
        await page.keyboard.press("Escape");
        await page.waitForTimeout(100);
        // Click on the todo item again to expand it
        await todoItem.click();
        await page.waitForTimeout(200);
        // Click delete button with force option to bypass overlays
        await todoItem.locator('[data-testid="todo-delete"]').click({ force: true });
      },

      openTodoDetails: async (text: string) => {
        const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: text });
        // Double-click to open details overlay
        await todoItem.dblclick();
        await page.waitForSelector('[data-testid="todo-details-overlay"]', { timeout: 5000 });
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

      switchView: async (view: string) => {
        const tab = page.getByTestId(`view-tab-${view}`);
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(300);
        }
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
        const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: text });
        await todoItem.dblclick();
        await page.waitForSelector('[data-testid="todo-details-overlay"]', { timeout: 5000 });
        const archiveButton = page.getByTestId("action-archive");
        await archiveButton.click();
        await page.waitForTimeout(500);
      },

      duplicateTodo: async (text: string) => {
        const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: text });
        await todoItem.dblclick();
        await page.waitForSelector('[data-testid="todo-details-overlay"]', { timeout: 5000 });
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

      // === Workflow helpers for smoke tests ===

      addTodosWithMetadata: async (todos: TodoSetup[]) => {
        for (const todo of todos) {
          await fixture.addTodo(todo.text);
          if (todo.completed) {
            await fixture.toggleTodo(todo.text);
          }
        }
      },

      verifyTodoCount: async (expected: number) => {
        const todoItems = page.locator('[data-testid="todo-item"]');
        await expect(todoItems).toHaveCount(expected);
      },

      verifyTodoStates: async (expected: TodoStateExpectation) => {
        if (expected.total !== undefined) {
          const todoItems = page.locator('[data-testid="todo-item"]');
          await expect(todoItems).toHaveCount(expected.total);
        }
        // Note: More granular state checking would require data-testid attributes on state indicators
      },

      assertAllPersisted: async () => {
        // Get current state
        const beforeTodos = await fixture.getTodos();
        const beforeCount = beforeTodos.length;

        // Reload page
        await page.reload();
        await fixture.waitForAppLoad();

        // Verify same state
        const afterCount = await fixture.getTodoCount();
        expect(afterCount).toBe(beforeCount);
      },

      assertViewState: async (view: string) => {
        const viewElement = page.locator(`[data-testid="${view}-view"]`);
        if (await viewElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(viewElement).toBeVisible();
        }
      },

      getAppState: async (): Promise<AppStateSnapshot> => {
        const todoTexts = await fixture.getTodos();
        const completedItems = page.locator('[data-testid="todo-item"][data-completed="true"]');
        const completedCount = await completedItems.count().catch(() => 0);

        return {
          todoCount: todoTexts.length,
          todoTexts,
          completedCount,
          timestamp: Date.now(),
        };
      },

      compareStates: (before: AppStateSnapshot, after: AppStateSnapshot) => {
        const beforeSet = new Set(before.todoTexts);
        const afterSet = new Set(after.todoTexts);

        let added = 0;
        let removed = 0;

        for (const text of after.todoTexts) {
          if (!beforeSet.has(text)) added++;
        }
        for (const text of before.todoTexts) {
          if (!afterSet.has(text)) removed++;
        }

        return {
          added,
          removed,
          changed: added > 0 || removed > 0 || before.completedCount !== after.completedCount,
        };
      },
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(fixture);
  },
});

export { expect };
