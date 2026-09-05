import { test, expect } from "../fixtures/todo-app.fixture";
import { resetAppStorage } from "../fixtures/smoke-helpers";

/**
 * Smoke Test: Rich Text Editor
 *
 * The editor had no e2e coverage worth the name: the one test that touched it
 * used contentArea.fill(), which sets the content wholesale and exercises none
 * of the key handling, then asserted only that the note still existed.
 *
 * Everything here needs a real browser -- a real caret, real key events, real
 * selection. jsdom has none of those, and jsdom is where the unit tests stop.
 * Each case is one of the defects found by driving the app by hand: the comment
 * box that would not empty, the paste that was stored unsanitised, the toolbar
 * buttons that stranded the line's text, the backspace that ate formatting.
 */

/** The editor inside the task details overlay's comment composer. */
const editorIn = (page: import("@playwright/test").Page) =>
  page.getByTestId("rich-text-editor").last();

async function openTaskDetails(
  page: import("@playwright/test").Page,
  todoApp: { waitForAppLoad: () => Promise<void>; addTodo: (t: string) => Promise<void> },
  text: string,
) {
  await page.goto("/");
  await todoApp.waitForAppLoad();

  const existing = page.getByText(text, { exact: false }).first();
  if (!(await existing.isVisible().catch(() => false))) {
    await todoApp.addTodo(text);
  }
  await page.getByText(text, { exact: false }).first().click();
  await expect(editorIn(page)).toBeVisible();
}

/** Empty the editor by driving it, then confirm it really is empty. */
async function clearEditor(page: import("@playwright/test").Page) {
  const editor = editorIn(page);
  await editor.click();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
  }
  await expect(editor).toHaveText("");
}

test.describe("Rich Text Editor", () => {
  test.beforeAll(async ({ workerPage }) => {
    await resetAppStorage(workerPage);
  });

  test.describe.serial("Typing and the caret", () => {
    test("Step 1: every character lands, fast or slow", async ({ page, todoApp }) => {
      await openTaskDetails(page, todoApp, "RTE task");
      await clearEditor(page);

      await page.keyboard.type("Hello world", { delay: 10 });
      await expect(editorIn(page)).toHaveText("Hello world");

      await clearEditor(page);
      await page.keyboard.type("Hello world", { delay: 80 });
      await expect(editorIn(page)).toHaveText("Hello world");
    });

    test("Step 2: typing mid-text lands at the caret", async ({ page, todoApp }) => {
      await openTaskDetails(page, todoApp, "RTE task");
      await clearEditor(page);
      await page.keyboard.type("ABCDEF", { delay: 20 });

      await editorIn(page).evaluate((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode()!;
        const range = document.createRange();
        range.setStart(node, 3);
        range.collapse(true);
        const selection = getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
      });
      await page.keyboard.type("XYZ", { delay: 40 });

      await expect(editorIn(page)).toHaveText("ABCXYZDEF");
    });
  });

  test.describe.serial("Submitting a comment", () => {
    test("Step 1: Enter posts it and empties the box", async ({ page, todoApp }) => {
      // It used to stay put, because the effect that writes `value` back was
      // skipped whenever the editor had focus -- and after Enter it does.
      await openTaskDetails(page, todoApp, "RTE comments");
      await clearEditor(page);

      await page.keyboard.type("First comment", { delay: 20 });
      await page.keyboard.press("Enter");

      await expect(editorIn(page)).toHaveText("");
      await expect(page.getByText("First comment").first()).toBeVisible();
    });

    test("Step 2: a second Enter posts nothing, rather than a duplicate", async ({ page, todoApp }) => {
      await openTaskDetails(page, todoApp, "RTE comments");
      const before = await page.getByText("First comment").count();

      await editorIn(page).click();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(600);

      await expect(page.getByText("First comment")).toHaveCount(before);
    });

    test("Step 3: an empty box cannot post", async ({ page, todoApp }) => {
      // An empty editor serialises to "<br>", which is truthy -- so the old
      // html.trim() gate let a comment through containing nothing.
      await openTaskDetails(page, todoApp, "RTE comments");
      await clearEditor(page);
      await page.keyboard.type("x", { delay: 20 });
      await page.keyboard.press("Backspace");

      await expect(page.getByTestId("add-comment-button")).toBeDisabled();
    });
  });

  test.describe.serial("Paste", () => {
    test("Step 1: pasted HTML is sanitised on the way in", async ({ page, todoApp }) => {
      // No paste handler existed, so the clipboard went into the document raw
      // and was stored verbatim. <font> and <img> are not in the allow-list, so
      // what the user saw vanished the next time it was rendered.
      //
      // Dispatched rather than driven through the OS clipboard, which needs a
      // permission this project does not grant. The handler calls
      // preventDefault and does the insertion itself, so a real DataTransfer on
      // a real paste event exercises every line of it.
      await openTaskDetails(page, todoApp, "RTE paste");
      await clearEditor(page);

      await editorIn(page).evaluate((el) => {
        const data = new DataTransfer();
        data.setData("text/html", '<b>bold</b> <font color="red">red</font><img src="x.png">');
        data.setData("text/plain", "bold red");
        el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
      });

      const html = await editorIn(page).innerHTML();
      expect(html).toContain("<b>bold</b>");
      expect(html).not.toContain("<font");
      expect(html).not.toContain("<img");
      await expect(editorIn(page)).toHaveText("bold red");
    });

    test("Step 2: plain text keeps its line breaks and its angle brackets", async ({ page, todoApp }) => {
      await openTaskDetails(page, todoApp, "RTE paste");
      await clearEditor(page);

      await editorIn(page).evaluate((el) => {
        const data = new DataTransfer();
        data.setData("text/plain", "a < b\nc && d");
        el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
      });

      const html = await editorIn(page).innerHTML();
      expect(html).toContain("<br>");
      await expect(editorIn(page)).toHaveText("a < bc && d");
    });
  });

  test.describe.serial("Block conversions", () => {
    test("Step 1: the toolbar converts the line the caret is on", async ({ page, todoApp }) => {
      // With a collapsed caret these appended an empty block and left the
      // line's text outside it. With a selection they were always fine, which
      // is why it survived.
      await openTaskDetails(page, todoApp, "RTE blocks");

      for (const [title, selector] of [
        ["Bullet List (type - )", "ul li"],
        ["Numbered List (type 1. )", "ol li"],
        ["Blockquote (type > )", "blockquote"],
        ["Heading 2 (type ## )", "h2"],
      ] as const) {
        await clearEditor(page);
        await page.keyboard.type("keep this text", { delay: 15 });

        await page.getByTitle(title).last().click();

        await expect(editorIn(page).locator(selector)).toHaveText("keep this text");
      }
    });

    test("Step 2: markdown triggers convert as you type", async ({ page, todoApp }) => {
      await openTaskDetails(page, todoApp, "RTE blocks");

      await clearEditor(page);
      await page.keyboard.type("- item", { delay: 25 });
      await expect(editorIn(page).locator("ul li")).toHaveText("item");

      await clearEditor(page);
      await page.keyboard.type("## Heading", { delay: 25 });
      await expect(editorIn(page).locator("h2")).toHaveText("Heading");
    });

    test("Step 3: '# ' in front of existing text keeps the caret after it", async ({ page, todoApp }) => {
      // The heading conversion used to drop the caret at offset 0, so the next
      // character landed in front of the line rather than continuing it.
      await openTaskDetails(page, todoApp, "RTE blocks");
      await clearEditor(page);

      await page.keyboard.type("# Title", { delay: 25 });
      await page.keyboard.type("!", { delay: 25 });

      await expect(editorIn(page).locator("h1")).toHaveText("Title!");
    });
  });

  test.describe.serial("Backspace out of a block", () => {
    test("Step 1: unwrapping keeps inline formatting", async ({ page, todoApp }) => {
      // These rebuilt the block from textContent, which keeps the characters
      // and discards every element around them.
      await openTaskDetails(page, todoApp, "RTE unwrap");
      await clearEditor(page);

      await page.keyboard.type("- item", { delay: 25 });
      await editorIn(page).evaluate((el) => {
        const li = el.querySelector("li")!;
        li.innerHTML = "<b>Bold</b> tail";
        const range = document.createRange();
        range.setStart(li.querySelector("b")!.firstChild!, 0);
        range.collapse(true);
        const selection = getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
      });

      await page.keyboard.press("Backspace");

      await expect(editorIn(page).locator("b")).toHaveText("Bold");
      await expect(editorIn(page).locator("ul")).toHaveCount(0);
    });
  });

  test.describe.serial("Persistence", () => {
    test("Step 1: a comment survives a reload", async ({ page, todoApp }) => {
      await openTaskDetails(page, todoApp, "RTE persist");
      await clearEditor(page);

      await page.keyboard.type("Durable comment", { delay: 20 });
      await page.keyboard.press("Enter");
      await expect(page.getByText("Durable comment").first()).toBeVisible();
      await page.waitForTimeout(700);

      await page.reload();
      await todoApp.waitForAppLoad();
      await page.getByText("RTE persist", { exact: false }).first().click();

      await expect(page.getByText("Durable comment").first()).toBeVisible();
    });
  });
});
