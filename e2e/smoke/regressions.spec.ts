// Each test here pins one defect found by driving the app by hand, recorded in
// docs/manual-test-report-2026-08-29.md. They assert the PARSED METADATA out of
// storage rather than just the rendered text, because every one of these bugs
// was invisible on screen -- the todo looked fine, or silently never appeared.
//
// Isolated rather than worker-scoped: several need a clean profile, and the
// rename test would otherwise leave renamed entities behind.
import { isolatedTest as test, expect } from "../fixtures/todo-app.fixture";

/** Type into the add-todo overlay and submit. Returns whether the button was enabled. */
async function addTodo(page: import("@playwright/test").Page, text: string): Promise<boolean> {
  await page.getByTestId("add-todo-button").click();
  const input = page.getByTestId("smart-input");
  await input.waitFor({ state: "visible" });
  await input.click();
  await page.keyboard.type(text);
  await page.waitForTimeout(300);
  const submit = page.getByTestId("add-todo-submit");
  const enabled = await submit.isEnabled();
  if (enabled) {
    await submit.click();
    await page.waitForTimeout(400);
  }
  return enabled;
}

/** Create a person or project through its view, since markers only link existing entities. */
async function addEntity(
  page: import("@playwright/test").Page,
  todoApp: { switchView: (v: "people" | "projects") => Promise<void> },
  view: "people" | "projects",
  label: string,
  name: string,
): Promise<void> {
  await todoApp.switchView(view);
  await page.getByRole("button", { name: label, exact: true }).first().click();
  const dialog = page.locator("div.fixed.inset-0").last();
  await dialog.locator('input[type="text"]').first().fill(name);
  await dialog.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(500);
}

/** Rename an entity through its details overlay, which auto-saves on a debounce. */
async function renamePerson(
  page: import("@playwright/test").Page,
  todoApp: { switchView: (v: "people" | "projects") => Promise<void> },
  from: string,
  to: string,
): Promise<void> {
  await todoApp.switchView("people");
  await page.getByText(from, { exact: true }).first().click();
  const dialog = page.locator("div.fixed.inset-0").last();
  await dialog.locator('input[type="text"]').first().fill(to);
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

const storedTodos = async (todoApp: { getStoredValue: (k: string) => Promise<string | null> }) =>
  JSON.parse((await todoApp.getStoredValue("doit-todos")) ?? "[]");

test.describe("Regressions from the manual sweep", () => {
  test.beforeEach(async ({ page, todoApp }) => {
    await page.goto("/");
    await todoApp.waitForAppLoad();
    await todoApp.clearStorage();
    await page.goto("/");
    await todoApp.waitForAppLoad();
  });

  test("a title the parsers consume entirely is kept, not silently discarded", async ({ page, todoApp }) => {
    // "Payday" and "Someday" are date shorthands and "Monday" is a weekday, so
    // all three parsed down to an empty title. The todo was then dropped while
    // the overlay closed as if it had been added.
    for (const title of ["Payday", "Someday", "Monday"]) {
      expect(await addTodo(page, title)).toBe(true);
    }
    const todos = await storedTodos(todoApp);
    expect(todos.map((t: { plainText: string }) => t.plainText).sort()).toEqual(["Monday", "Payday", "Someday"]);
    // ...and the detected date is still applied
    expect(todos.every((t: { dueDate?: number }) => typeof t.dueDate === "number")).toBe(true);
  });

  test("an empty input cannot be submitted", async ({ page }) => {
    await page.getByTestId("add-todo-button").click();
    await page.getByTestId("smart-input").waitFor({ state: "visible" });
    await expect(page.getByTestId("add-todo-submit")).toBeDisabled();
  });

  test("cancelling the add overlay does not leave text behind", async ({ page, todoApp }) => {
    await page.getByTestId("add-todo-button").click();
    const input = page.getByTestId("smart-input");
    await input.waitFor({ state: "visible" });
    await input.click();
    await page.keyboard.type("Ghost task");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);

    await page.getByTestId("add-todo-button").click();
    await input.waitFor({ state: "visible" });
    await expect(page.getByTestId("add-todo-submit")).toBeDisabled();
    expect(await storedTodos(todoApp)).toHaveLength(0);
  });

  test("a bare priority word sets the priority and stays in the text", async ({ page, todoApp }) => {
    // "urgent"/"asap" were date shorthands, so the date parser claimed the word,
    // stripped it, and the priority was never applied.
    await addTodo(page, "This task is urgent");
    const [todo] = await storedTodos(todoApp);
    expect(todo.plainText).toBe("This task is urgent");
    expect(todo.priority).toBe("1");
  });

  test("'from <person>' records a source, not a mention", async ({ page, todoApp }) => {
    await addEntity(page, todoApp, "people", "Add Person", "Marcel");
    await todoApp.switchView("list");
    await addTodo(page, "Email from Marcel about the deadline");

    const [todo] = await storedTodos(todoApp);
    expect(todo.sourcePeople).toEqual(["Marcel"]);
    expect(todo.mentionedPeople).toEqual([]);
  });

  test("a bare name is still recorded as a mention", async ({ page, todoApp }) => {
    await addEntity(page, todoApp, "people", "Add Person", "Marcel");
    await todoApp.switchView("list");
    await addTodo(page, "Marcel needs to review this");

    const [todo] = await storedTodos(todoApp);
    expect(todo.mentionedPeople).toEqual(["Marcel"]);
    expect(todo.sourcePeople).toEqual([]);
  });

  test("a multi-weekday recurrence keeps its title and both days", async ({ page, todoApp }) => {
    // Only "every monday" was consumed; chrono then ate "wednesday" separately
    // and the stray "and" survived into the title as "Sync and".
    await addTodo(page, "Sync every monday and wednesday");
    const [todo] = await storedTodos(todoApp);
    expect(todo.plainText).toBe("Sync");
    expect(todo.recurring).toBe("every monday and wednesday");
  });

  test("renaming a person keeps the todos that reference them", async ({ page, todoApp }) => {
    await addEntity(page, todoApp, "people", "Add Person", "Marcel");
    await todoApp.switchView("list");
    await addTodo(page, "Task one @Marcel");

    await todoApp.switchView("people");
    await page.getByText("Marcel", { exact: true }).first().click();
    const dialog = page.locator("div.fixed.inset-0").last();
    await dialog.locator('input[type="text"]').first().fill("Marcel Erz");
    await page.waitForTimeout(1200); // the overlay auto-saves on a debounce
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    const todos = await storedTodos(todoApp);
    expect(todos[0].assignedPeople).toEqual(["Marcel Erz"]);
    expect(todos[0].text).toContain("@Marcel Erz");
    // the People row still counts the todo
    await todoApp.switchView("people");
    await expect(page.getByText(/1\s*\/\s*0/)).toBeVisible();
  });

  test("a rename does not reserve the old name or relabel the entity", async ({ page, todoApp }) => {
    // The rename used to keep the old name as an alternative. That made
    // isNameTaken reserve it forever, so no other entity could be renamed to
    // it, and it left the entity permanently displayed as "Marc (Marcel)".
    await addEntity(page, todoApp, "people", "Add Person", "Marcel");
    await addEntity(page, todoApp, "people", "Add Person", "Someone Else");

    await renamePerson(page, todoApp, "Marcel", "Marc");

    const people = JSON.parse((await todoApp.getStoredValue("doit-people")) ?? "[]");
    const marc = people.find((p: { name: string }) => p.name === "Marc");
    expect(marc.alternatives).toEqual([]);

    // the People list shows the plain name, not "Marc (Marcel)"
    await todoApp.switchView("people");
    await expect(page.getByText("Marc (Marcel)")).toHaveCount(0);

    // ...and the freed name can now be taken by a different person
    await renamePerson(page, todoApp, "Someone Else", "Marcel");
    const after = JSON.parse((await todoApp.getStoredValue("doit-people")) ?? "[]");
    expect(after.map((p: { name: string }) => p.name).sort()).toEqual(["Marc", "Marcel"]);
  });

  test("renaming onto an existing name is refused", async ({ page, todoApp }) => {
    await addEntity(page, todoApp, "people", "Add Person", "Marcel");
    await addEntity(page, todoApp, "people", "Add Person", "John Doe");

    await todoApp.switchView("people");
    await page.getByText("Marcel", { exact: true }).first().click();
    const dialog = page.locator("div.fixed.inset-0").last();
    await dialog.locator('input[type="text"]').first().fill("John Doe");
    await page.waitForTimeout(1200);

    await expect(dialog.getByRole("alert")).toContainText("already exists");
    const people = JSON.parse((await todoApp.getStoredValue("doit-people")) ?? "[]");
    expect(people.map((p: { name: string }) => p.name).sort()).toEqual(["John Doe", "Marcel"]);
  });

  test("a saved preset follows a rename, even after the list is mutated", async ({ page, todoApp }) => {
    // Pins the storage rewrite end-to-end, including that a later preset save
    // does not resurrect the old name.
    //
    // Note this does NOT exercise the in-memory remap in
    // useEntityRenamePresetSync: renaming is only reachable from the People
    // tab, which unmounts ListView and its preset state, so the presets are
    // always re-read from storage afterwards. That hook is defence for a rename
    // path that does not exist yet; it is covered by its own unit tests.
    await addEntity(page, todoApp, "people", "Add Person", "Marcel");
    await todoApp.switchView("list");
    await addTodo(page, "Task one @Marcel");

    // filter by the person, so the preset captures their name
    await page.getByTestId("filter-button").click();
    await page.getByRole("button", { name: "@Marcel", exact: true }).click();
    await page.waitForTimeout(300);

    const savePreset = async (name: string) => {
      await page.getByRole("button", { name: /save current view|save view/i }).first().click();
      const dialog = page.locator("div.fixed.inset-0").last();
      await dialog.locator('input[type="text"]').first().fill(name);
      await dialog.getByRole("button", { name: /^(save|create|add)/i }).last().click();
      await page.waitForTimeout(600);
    };
    await savePreset("Mine");

    const before = JSON.parse((await todoApp.getStoredValue("doit-view-presets")) ?? "[]");
    expect(before[0].filters.assignedPeople).toEqual(["Marcel"]);

    await renamePerson(page, todoApp, "Marcel", "Marc");
    await todoApp.switchView("list");

    // mutate the preset list, which is what triggers the stale write-back
    await savePreset("Second");

    const after = JSON.parse((await todoApp.getStoredValue("doit-view-presets")) ?? "[]");
    const mine = after.find((p: { name: string }) => p.name === "Mine");
    expect(mine.filters.assignedPeople).toEqual(["Marc"]);
  });

  test("Escape dismisses the tutorial for good", async ({ page }) => {
    // beforeEach dismisses the tour (waitForAppLoad clicks Skip, and
    // clearStorage writes a completed flag), so put it back: the preference is
    // read through the storage adapter, i.e. IndexedDB.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          localStorage.removeItem("doit-tutorial-preferences");
          const open = indexedDB.open("doit-db");
          open.onsuccess = () => {
            const db = open.result;
            if (!db.objectStoreNames.contains("keyvalue")) {
              db.close();
              return resolve();
            }
            const tx = db.transaction("keyvalue", "readwrite");
            tx.objectStore("keyvalue").delete("doit-tutorial-preferences");
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              resolve();
            };
          };
          open.onerror = () => resolve();
          setTimeout(resolve, 3000);
        }),
    );
    await page.goto("/");
    await page.waitForSelector('[data-testid="todo-app"]');
    const skip = page.getByRole("button", { name: "Skip tutorial" });
    await skip.waitFor({ state: "visible", timeout: 6000 });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await page.reload();
    await page.waitForSelector('[data-testid="todo-app"]');
    await page.waitForTimeout(1200); // the tour opens ~500ms after load

    await expect(skip).toBeHidden();
  });

  test("Shift+N opens the note dialog the button advertises", async ({ page }) => {
    await expect(page.getByTestId("add-note-button")).toHaveAttribute("title", /Shift\+N/);
    await page.locator("main").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Shift+N");
    await expect(page.getByTestId("note-create-submit")).toBeVisible();
  });
});
