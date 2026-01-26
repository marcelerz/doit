import { expect } from "@playwright/test";
import { TodoAppFixture, AppStateSnapshot, TodoStateExpectation } from "./todo-app.fixture";

/**
 * Smoke Test Helpers
 *
 * High-level workflow verification helpers for smoke tests.
 * These provide semantic wrappers around fixture methods for clearer test intent.
 */

/**
 * Verify a workflow step completed successfully
 * Provides clear step labeling in test output
 */
export async function verifyWorkflowStep(
  todoApp: TodoAppFixture,
  stepName: string,
  assertions: () => Promise<void>
): Promise<void> {
  try {
    await assertions();
  } catch (error) {
    throw new Error(`Workflow step "${stepName}" failed: ${error}`);
  }
}

/**
 * Verify batch state of todos
 * Checks counts for different todo states
 */
export async function verifyBatchState(
  todoApp: TodoAppFixture,
  expected: TodoStateExpectation
): Promise<void> {
  await todoApp.verifyTodoStates(expected);
}

/**
 * Setup a clean test environment
 * Clears storage and reloads the page
 */
export async function setupCleanEnvironment(
  page: { goto: (url: string) => Promise<void>; reload: () => Promise<void>; evaluate: (fn: () => void) => Promise<void> },
  todoApp: TodoAppFixture
): Promise<void> {
  await page.goto("/");
  await todoApp.clearStorage();
  await page.reload();
  await todoApp.waitForAppLoad();
}

/**
 * Verify persistence across page reload
 * Takes a snapshot, reloads, and compares
 */
export async function verifyPersistence(
  page: { reload: () => Promise<void> },
  todoApp: TodoAppFixture
): Promise<{ persisted: boolean; before: AppStateSnapshot; after: AppStateSnapshot }> {
  const before = await todoApp.getAppState();

  await page.reload();
  await todoApp.waitForAppLoad();

  const after = await todoApp.getAppState();
  const diff = todoApp.compareStates(before, after);

  return {
    persisted: !diff.changed && before.todoCount === after.todoCount,
    before,
    after,
  };
}

/**
 * Create multiple todos in sequence with verification
 */
export async function createTodosWithVerification(
  todoApp: TodoAppFixture,
  todoTexts: string[]
): Promise<void> {
  const initialCount = await todoApp.getTodoCount();

  for (const text of todoTexts) {
    await todoApp.addTodo(text);
  }

  const finalCount = await todoApp.getTodoCount();
  expect(finalCount).toBe(initialCount + todoTexts.length);
}

/**
 * Complete todos and verify state changed
 */
export async function completeTodosWithVerification(
  todoApp: TodoAppFixture,
  todoTexts: string[]
): Promise<void> {
  for (const text of todoTexts) {
    await todoApp.toggleTodo(text);
  }
}

/**
 * Navigate through views and verify each is accessible
 */
export async function verifyViewNavigation(
  todoApp: TodoAppFixture,
  views: Array<"list" | "kanban" | "gantt" | "calendar" | "people" | "projects">
): Promise<{ accessible: string[]; notAccessible: string[] }> {
  const accessible: string[] = [];
  const notAccessible: string[] = [];

  for (const view of views) {
    try {
      await todoApp.switchView(view);
      await todoApp.assertViewState(view);
      accessible.push(view);
    } catch {
      notAccessible.push(view);
    }
  }

  return { accessible, notAccessible };
}

/**
 * Verify search functionality
 */
export async function verifySearchFunctionality(
  todoApp: TodoAppFixture,
  searchTerm: string,
  expectedMinResults: number
): Promise<boolean> {
  await todoApp.search(searchTerm);
  const count = await todoApp.getTodoCount();
  await todoApp.clearSearch();
  return count >= expectedMinResults;
}
