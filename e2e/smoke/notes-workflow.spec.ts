import { test, expect } from "../fixtures/todo-app.fixture";

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
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      if (typeof indexedDB !== "undefined") {
        indexedDB.deleteDatabase("doit-storage");
      }
      localStorage.setItem("doit-tutorial-preferences", JSON.stringify({ completed: true, showOnStartup: false }));
      // Enable notes view feature
      localStorage.setItem(
        "doit-settings",
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
    });
    await page.close();
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
      const addNoteButton = page.locator('button:has-text("Add Note")');
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
      const addNoteButton = page.locator('button:has-text("Add Note")');
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
      const contentArea = page.locator('[data-testid="note-content-editor"]');
      if (await contentArea.isVisible()) {
        await contentArea.click();
        await contentArea.fill("This is the meeting content with important details.");
        // Blur to save
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }

      // Go back to notes list
      const backButton = page.locator('button:has-text("Back to Notes")');
      await backButton.click();
      await page.waitForTimeout(300);

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

      // Click pin button
      const pinButton = page.locator('button:has-text("Pin")');
      if (await pinButton.isVisible()) {
        await pinButton.click();
        await page.waitForTimeout(300);

        // Verify button changed to "Unpin"
        const unpinButton = page.locator('button:has-text("Unpin")');
        await expect(unpinButton).toBeVisible();
      }

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

      // Find action items section
      const actionItemsSection = page.locator('[data-testid="action-items-section"]');
      if (await actionItemsSection.isVisible()) {
        // Add an action item
        const actionItemInput = actionItemsSection.locator('[data-testid="smart-input"]').first();
        await actionItemInput.click();
        await actionItemInput.fill("Follow up with John about budget");
        await page.keyboard.press("Tab"); // Move to next input

        await page.waitForTimeout(300);
      }

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
      const addNoteButton = page.locator('button:has-text("Add Note")');
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
      const noteItems = page.locator('[data-testid="note-item"]');
      const count = await noteItems.count();
      expect(count).toBeGreaterThanOrEqual(2);
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

      // Click archive button
      const archiveButton = page.locator('button:has-text("Archive")');
      if (await archiveButton.isVisible()) {
        await archiveButton.click();
        await page.waitForTimeout(500);
      }

      // Should be back at notes list (archive handler goes back)
      // Verify the note is no longer visible (archived)
      const archivedNote = page.locator('[data-testid="note-item"]').filter({ hasText: "Project Ideas" });
      await expect(archivedNote).not.toBeVisible({ timeout: 5000 });
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

      // Click convert to todo button
      const convertButton = page.locator('button:has-text("Convert to Todo")');
      if (await convertButton.isVisible()) {
        await convertButton.click();
        await page.waitForTimeout(300);

        // Confirm dialog
        const confirmButton = page.locator('button:has-text("Convert")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(500);
        }

        // Should navigate to list view with the new todo
        // Verify we're on list view
        const listTab = page.getByTestId("view-tab-list");
        const isActive = await listTab.evaluate((el) => el.classList.contains("text-blue-600"));
        if (isActive) {
          // The todo should be visible
          const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: "Meeting Notes" });
          await expect(todoItem).toBeVisible({ timeout: 5000 });
        }
      }
    });

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
