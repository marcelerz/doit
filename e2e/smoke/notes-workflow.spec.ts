import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";
import { STORAGE_KEYS } from "../../src/storage/keys";
import type { TodoAppFixture } from "../fixtures/todo-app.fixture";

interface StoredNote {
  plainText: string;
  state: string;
  pinned?: boolean;
  actionItems?: Array<{ plainText: string }>;
}

/** The stored note whose title contains `title`, or undefined. */
async function storedNote(todoApp: TodoAppFixture, title: string): Promise<StoredNote | undefined> {
  const notes: StoredNote[] = JSON.parse((await todoApp.getStoredValue(STORAGE_KEYS.NOTES)) ?? "[]");
  return notes.find((note) => note.plainText.includes(title));
}

/**
 * Smoke Test: Notes Workflow
 *
 * This test file covers the notes feature:
 * - Creating notes
 * - Editing notes (title and content)
 * - Pinning/unpinning notes
 * - Archiving notes
 * - Converting notes to todos
 * - Action items in notes
 */
test.describe("Notes Workflow", () => {
  // Only clear storage once at the beginning
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
    // Notes needs its feature flag on, which the shared reset does not set.
    await workerPage.evaluate((settingsKey) => {
      // Enable notes view feature
      localStorage.setItem(
        settingsKey,
        JSON.stringify({
          features: {
            notesView: true,
            kanbanView: true,
            ganttView: true,
            calendarView: true,
            sprintsView: true,
            statsView: true,
            focusMode: true,
            templates: true,
            batchProcessing: true,
            reordering: true,
            exports: true,
            timeTracking: true,
          },
        })
      );
    }, STORAGE_KEYS.SETTINGS);
  });

  test.describe.serial("Sequential Notes Operations", () => {
    test("Step 1: Navigate to Notes view", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Click on the Notes tab
      const notesTab = page.getByTestId("view-tab-notes");
      await expect(notesTab).toBeVisible();
      await notesTab.click();

      // Wait for the notes view to be active
      await page.waitForTimeout(500);

      // Verify the Notes view is displayed (check for "Add Note" button)
      const addNoteButton = page.getByTestId("add-note-button");
      await expect(addNoteButton).toBeVisible();
    });

    test("Step 2: Create a new note", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Click Add Note button
      const addNoteButton = page.getByTestId("add-note-button");
      await addNoteButton.click();

      // Wait for the modal to appear
      await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

      // Enter note title
      const titleInput = page.getByTestId("smart-input");
      await titleInput.click();
      await titleInput.fill("Meeting Notes @john %ProjectA");

      // Click Create Note button
      const createButton = page.locator('button:has-text("Create Note")');
      await createButton.click();

      // Wait for the note to be created and detail view to open
      await page.waitForTimeout(500);

      // Verify the note detail view is showing
      const backButton = page.locator('button:has-text("Back to Notes")');
      await expect(backButton).toBeVisible();
    });

    test("Step 3: Edit note content", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Click on the note to open detail view
      const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: "Meeting Notes" });
      await noteItem.click();
      await page.waitForTimeout(500);

      // Find and edit the content area
      // The testid sits on a wrapper div; the editable surface is the
      // contenteditable RichTextEditor inside it.
      const contentArea = page.locator('[data-testid="note-content-editor"] [contenteditable="true"]');
      // Asserted rather than guarded: a missing editor is a failure, not a step to skip.
      await expect(contentArea).toBeVisible();
      await contentArea.click();
      await contentArea.fill("This is the meeting content with important details.");
      // Blur to save
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);

      // Go back to notes list. Escape above may already have done it:
      // NoteDetailView binds Escape to onBack, so it navigates rather than
      // just blurring. Only click the button if we are still on the detail view.
      const backButton = page.locator('button:has-text("Back to Notes")');
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();
        await page.waitForTimeout(300);
      }

      // Verify note still exists
      const noteInList = page.locator('[data-testid="note-item"]').filter({ hasText: "Meeting Notes" });
      await expect(noteInList).toBeVisible();
    });

    test("Step 4: Pin a note", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Open the note detail
      const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: "Meeting Notes" });
      await noteItem.click();
      await page.waitForTimeout(500);

      // "Pin" exactly: a substring match would also find "Unpin".
      await page.getByRole("button", { name: "Pin", exact: true }).click();

      // The button now offers the opposite, and the note is stored as pinned.
      await expect(page.getByRole("button", { name: "Unpin", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Pin", exact: true })).toHaveCount(0);
      await expect.poll(async () => (await storedNote(todoApp, "Meeting Notes"))?.pinned).toBe(true);

      // Go back to notes list
      const backButton = page.locator('button:has-text("Back to Notes")');
      await backButton.click();
    });

    test("Step 5: Add action items to note", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Open the note detail
      const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: "Meeting Notes" });
      await noteItem.click();
      await page.waitForTimeout(500);

      const actionItemsSection = page.getByTestId("action-items-section");
      await expect(actionItemsSection).toBeVisible();
      // Nothing to convert yet, so no button offers it.
      await expect(actionItemsSection.getByRole("button", { name: /^Create \d+ Todo/ })).toHaveCount(0);

      const actionItemInput = actionItemsSection.getByTestId("smart-input").first();
      await actionItemInput.click();
      await actionItemInput.fill("Follow up with John about budget");
      // Enter is what commits a new item. The step that stood here pressed Tab,
      // which saves nothing, so no item was ever added.
      await page.keyboard.press("Enter");

      // One pending item: the section counts it and offers to turn it into a todo.
      await expect(actionItemsSection.getByRole("button", { name: "Create 1 Todo" })).toBeVisible();
      await expect(page.getByText("(1 pending)")).toBeVisible();
      await expect
        .poll(async () => (await storedNote(todoApp, "Meeting Notes"))?.actionItems?.map((item) => item.plainText))
        .toEqual(["Follow up with John about budget"]);

      // Go back
      const backButton = page.locator('button:has-text("Back to Notes")');
      await backButton.click();
    });

    test("Step 6: Create another note and verify list", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Add another note
      const addNoteButton = page.getByTestId("add-note-button");
      await addNoteButton.click();
      await page.waitForSelector('[data-testid="smart-input"]', { timeout: 5000 });

      const titleInput = page.getByTestId("smart-input");
      await titleInput.fill("Project Ideas #brainstorm");

      const createButton = page.locator('button:has-text("Create Note")');
      await createButton.click();
      await page.waitForTimeout(500);

      // Go back to list
      const backButton = page.locator('button:has-text("Back to Notes")');
      await backButton.click();
      await page.waitForTimeout(300);

      // Verify both notes are in the list
      const noteItems = page.getByTestId("note-item");
      await expect(noteItems).toHaveCount(2);
      await expect(noteItems.filter({ hasText: "Project Ideas" })).toBeVisible();
      await expect(noteItems.filter({ hasText: "Meeting Notes" })).toBeVisible();
    });

    test("Step 7: Archive a note", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Open the second note (Project Ideas)
      const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: "Project Ideas" });
      await noteItem.click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: "Archive", exact: true }).click();

      // Archiving returns to the list. The other note is there, which is what
      // shows the list is on screen -- "not visible" alone would also be true
      // on the detail view, where no note rows exist at all.
      const noteItems = page.getByTestId("note-item");
      await expect(noteItems.filter({ hasText: "Meeting Notes" })).toBeVisible();
      await expect(noteItems.filter({ hasText: "Project Ideas" })).toHaveCount(0);
      await expect.poll(async () => (await storedNote(todoApp, "Project Ideas"))?.state).toBe("archived");
    });

    test("Step 8: Convert note to todo", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Open the Meeting Notes note
      const noteItem = page.locator('[data-testid="note-item"]').filter({ hasText: "Meeting Notes" });
      await noteItem.click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: "Convert to Todo", exact: true }).click();
      // The confirmation's own button is "Convert" exactly.
      await page.getByRole("button", { name: "Convert", exact: true }).click();

      // The app switches to the list, and the note is there as a todo.
      await expect(page.getByTestId("view-tab-list")).toHaveAttribute("aria-selected", "true");
      await expect(page.getByTestId("todo-item").filter({ hasText: "Meeting Notes" })).toBeVisible();
    });

    // Converting should also open the new todo's details. It looks the todo up
    // in a list that does not contain it yet, so nothing opens.
    test.fixme("Step 8b: Converting a note opens the new todo (U0460)", async () => {});


    test("Step 9: Persistence - reload and verify notes", async ({ page, todoApp }) => {
      await page.goto("/");
      await todoApp.waitForAppLoad();

      // Navigate to Notes view
      const notesTab = page.getByTestId("view-tab-notes");
      await notesTab.click();
      await page.waitForTimeout(500);

      // Get current count
      const noteItems = page.locator('[data-testid="note-item"]');
      const initialCount = await noteItems.count();

      // Hard reload
      await page.reload();
      await todoApp.waitForAppLoad();

      // Navigate to Notes view again
      await notesTab.click();
      await page.waitForTimeout(500);

      // Verify count is the same
      const afterReloadCount = await noteItems.count();
      expect(afterReloadCount).toBe(initialCount);
    });
  });
});
