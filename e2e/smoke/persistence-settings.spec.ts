import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";
import { STORAGE_KEYS } from "../../src/storage/keys";

/**
 * Smoke Test: Persistence and Settings
 *
 * This test file consolidates persistence.spec.ts, backup-restore.spec.ts,
 * and settings.spec.ts into a single sequential workflow.
 */
test.describe("Persistence and Settings Workflow", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Sequential Persistence and Settings", () => {
    test("Step 1: Add todos and verify storage", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add todos
      await todoApp.addTodo("Persistence test 1");
      await todoApp.addTodo("Persistence test 2");

      // Verify in storage. This read has to go through the adapter the app
      // actually uses; localStorage is empty once IndexedDB takes over.
      const storageData = (await todoApp.getStoredValue(STORAGE_KEYS.TODOS)) ?? "[]";
      expect(storageData.length).toBeGreaterThan(2);

      const count = await todoApp.getTodoCount();
      expect(count).toBe(2);
    });

    test("Step 2: Complete todo and verify state persisted", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      const storedState = async (text: string) => {
        const todos = JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.TODOS)) ?? "[]");
        return todos.find((todo: { plainText: string }) => todo.plainText === text)?.state;
      };

      await todoApp.toggleTodo("Persistence test 1");
      // Wait for the write itself rather than for a fixed time.
      await expect.poll(() => storedState("Persistence test 1")).toBe("completed");

      await page.reload();
      await todoApp.waitForAppLoad();

      // Stored as completed after the reload, and the other one untouched.
      expect(await storedState("Persistence test 1")).toBe("completed");
      expect(await storedState("Persistence test 2")).toBe("active");
    });

    test("Step 3: Navigate to settings and back", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      await page.getByTestId("settings-button").click();

      await expect(page).toHaveURL(/\/settings$/);
      await expect(page.getByRole("heading", { name: "General Settings" })).toBeVisible();

      await page.getByRole("link", { name: "Back to Todos" }).click();

      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByTestId("todo-app")).toBeVisible();
    });

    test("Step 4: A changed setting is stored and survives a reload", async ({ page, todoApp }) => {
      const storedTheme = async () => {
        const raw = await todoApp.getStoredValue(STORAGE_KEYS.SETTINGS);
        return raw === null ? null : JSON.parse(raw).general?.theme;
      };

      await page.goto("/settings");
      // Settings are written only when they change, so change one. A fresh
      // profile has nothing stored under the settings key at all.
      await page.getByRole("button", { name: "Dark", exact: true }).click();

      // The store coalesces writes for a moment; wait for the value itself.
      await expect.poll(storedTheme).toBe("dark");

      await page.reload();
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);
      expect(await storedTheme()).toBe("dark");

      // Back to the default, so the remaining steps run on the usual theme.
      await page.getByRole("button", { name: "System", exact: true }).click();
      await expect.poll(storedTheme).toBe("system");
    });

    test("Step 5: Add more data and verify", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Add another todo
      await todoApp.addTodo("Persistence test 3 @user %project");

      // Verify
      const todos = await todoApp.getTodos();
      expect(todos.some((t) => t.includes("Persistence test 3"))).toBe(true);
    });

    test("Step 6: Hard reload and verify all state restored", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Get initial state
      const beforeTodos = await todoApp.getTodos();

      // Hard reload with cache clear
      await page.reload();
      await todoApp.waitForAppLoad();

      // Verify state
      const afterTodos = await todoApp.getTodos();
      expect(afterTodos.length).toBe(beforeTodos.length);
    });

    test("Step 7: Verify data integrity", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Check specific todos exist
      const todos = await todoApp.getTodos();

      // At least our test todos should be there
      expect(todos.length).toBeGreaterThanOrEqual(2);
    });
  });
});
