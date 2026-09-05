/**
 * @jest-environment jsdom
 */

/**
 * Tests for what Enter, Backspace and Tab do inside a rich text block.
 *
 * Each handler returns true when it consumed the key, so the editor tries them
 * in order and falls through to the browser otherwise. Getting a "false" wrong
 * is worse than getting the transformation wrong: the browser's default then
 * runs on top of a half-applied edit.
 */

import {
  synchronizeCheckboxState,
  handleListEnter,
  handleBlockquoteEnter,
  handleHeaderEnter,
  handleListBackspace,
  handleBlockquoteBackspace,
  handleHeaderBackspace,
  handleListIndent,
  toggleCheckbox,
  toggleCheckboxInHtml,
} from "../keyHandlers";
import { createCheckboxListItem } from "../blocks";

function editorWith(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.innerHTML = html;
  document.body.appendChild(editor);
  return editor;
}

/** Put the caret in the first text node under `selector`, at `offset`. */
function caretIn(editor: HTMLDivElement, selector: string, offset = 0): void {
  const element = editor.querySelector(selector)!;
  const target = element.firstChild ?? element;
  const range = document.createRange();
  range.setStart(target, offset);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("handlers decline what is not theirs", () => {
  it("all return false with no selection", () => {
    const editor = editorWith("<ul><li>a</li></ul>");

    expect(handleListEnter(editor)).toBe(false);
    expect(handleBlockquoteEnter(editor)).toBe(false);
    expect(handleHeaderEnter(editor)).toBe(false);
    expect(handleListBackspace(editor)).toBe(false);
    expect(handleBlockquoteBackspace(editor)).toBe(false);
    expect(handleHeaderBackspace(editor)).toBe(false);
    expect(handleListIndent(editor, true)).toBe(false);
  });

  it("the list handlers decline a caret in a plain paragraph", () => {
    const editor = editorWith("<div>plain</div>");
    caretIn(editor, "div", 0);

    expect(handleListEnter(editor)).toBe(false);
    expect(handleListBackspace(editor)).toBe(false);
    expect(handleListIndent(editor, true)).toBe(false);
  });

  it("the blockquote and header handlers decline a caret in a list", () => {
    const editor = editorWith("<ul><li>a</li></ul>");
    caretIn(editor, "li", 0);

    expect(handleBlockquoteEnter(editor)).toBe(false);
    expect(handleHeaderEnter(editor)).toBe(false);
  });
});

describe("handleListEnter", () => {
  it("adds a sibling item after a non-empty one", () => {
    const editor = editorWith("<ul><li>first</li></ul>");
    caretIn(editor, "li", 5);

    expect(handleListEnter(editor)).toBe(true);
    expect(editor.querySelectorAll("li")).toHaveLength(2);
  });

  it("leaves the list when the empty item is not the only one", () => {
    const editor = editorWith("<ul><li>first</li><li></li></ul>");
    caretIn(editor, "li:last-child", 0);

    expect(handleListEnter(editor)).toBe(true);
    expect(editor.querySelectorAll("li")).toHaveLength(1);
    expect(editor.querySelector("ul + div")).not.toBeNull();
  });

  it("keeps a one-item list alive rather than deleting it", () => {
    const editor = editorWith("<ul><li></li></ul>");
    caretIn(editor, "li", 0);

    // Enter on the only empty item adds a second one. Exiting here would
    // delete the list the user just created by typing "- ".
    expect(handleListEnter(editor)).toBe(true);
    expect(editor.querySelector("ul")).not.toBeNull();
    expect(editor.querySelectorAll("li")).toHaveLength(2);
  });

  it("carries the checkbox shape into the new item", () => {
    const editor = editorWith("<ul class='checklist'></ul>");
    editor.querySelector("ul")!.appendChild(createCheckboxListItem("task"));
    caretIn(editor, "li span", 4);

    expect(handleListEnter(editor)).toBe(true);
    const items = editor.querySelectorAll("li.checkbox-item");
    expect(items).toHaveLength(2);
    expect(items[1].getAttribute("data-checked")).toBe("false");
  });
});

describe("handleListBackspace", () => {
  it("does nothing when the caret is not at the start", () => {
    const editor = editorWith("<ul><li>item</li></ul>");
    caretIn(editor, "li", 2);

    expect(handleListBackspace(editor)).toBe(false);
  });

  it("unwraps a one-item list back to a paragraph, keeping the text", () => {
    const editor = editorWith("<ul><li>item</li></ul>");
    caretIn(editor, "li", 0);

    expect(handleListBackspace(editor)).toBe(true);
    expect(editor.querySelector("ul")).toBeNull();
    expect(editor.textContent).toBe("item");
  });

  it("lifts one item out and leaves the rest of the list", () => {
    const editor = editorWith("<ul><li>one</li><li>two</li></ul>");
    caretIn(editor, "li:last-child", 0);

    expect(handleListBackspace(editor)).toBe(true);
    expect(editor.querySelectorAll("li")).toHaveLength(1);
    expect(editor.textContent).toContain("two");
  });

  it("reads a checkbox item's span for the text it carries out", () => {
    const editor = editorWith("<ul class='checklist'></ul>");
    editor.querySelector("ul")!.appendChild(createCheckboxListItem("task"));
    caretIn(editor, "li span", 0);

    expect(handleListBackspace(editor)).toBe(true);
    // Not "task" plus whatever the input contributes.
    expect(editor.textContent).toBe("task");
  });
});

describe("handleBlockquoteEnter and handleBlockquoteBackspace", () => {
  it("leaves Enter mid-quote to the browser, so the quote keeps growing", () => {
    const editor = editorWith("<blockquote>quoted</blockquote>");
    caretIn(editor, "blockquote", 6);

    // Unlike a heading, a blockquote is meant to span lines -- only an empty
    // one means "I am done quoting".
    expect(handleBlockquoteEnter(editor)).toBe(false);
    expect(editor.querySelector("blockquote")).not.toBeNull();
  });

  it("Enter on an empty quote exits it", () => {
    const editor = editorWith("<blockquote>  </blockquote>");
    caretIn(editor, "blockquote", 0);

    expect(handleBlockquoteEnter(editor)).toBe(true);
    expect(editor.querySelector("blockquote")).toBeNull();
  });

  it("Backspace at the start unwraps the blockquote", () => {
    const editor = editorWith("<blockquote>quoted</blockquote>");
    caretIn(editor, "blockquote", 0);

    expect(handleBlockquoteBackspace(editor)).toBe(true);
    expect(editor.querySelector("blockquote")).toBeNull();
    expect(editor.textContent).toBe("quoted");
  });

  it("Backspace mid-line is left to the browser", () => {
    const editor = editorWith("<blockquote>quoted</blockquote>");
    caretIn(editor, "blockquote", 3);

    expect(handleBlockquoteBackspace(editor)).toBe(false);
    expect(editor.querySelector("blockquote")).not.toBeNull();
  });
});

describe("handleHeaderEnter and handleHeaderBackspace", () => {
  it("Enter after a heading starts a paragraph, not another heading", () => {
    const editor = editorWith("<h2>Title</h2>");
    caretIn(editor, "h2", 5);

    expect(handleHeaderEnter(editor)).toBe(true);
    expect(editor.querySelector("h2 + div")).not.toBeNull();
    expect(editor.querySelectorAll("h2")).toHaveLength(1);
  });

  it("Backspace at the start unwraps the heading, keeping the text", () => {
    const editor = editorWith("<h2>Title</h2>");
    caretIn(editor, "h2", 0);

    expect(handleHeaderBackspace(editor)).toBe(true);
    expect(editor.querySelector("h2")).toBeNull();
    expect(editor.textContent).toBe("Title");
  });

  it("Backspace mid-line is left to the browser", () => {
    const editor = editorWith("<h2>Title</h2>");
    caretIn(editor, "h2", 2);

    expect(handleHeaderBackspace(editor)).toBe(false);
  });
});

describe("handleListIndent", () => {
  it("refuses to indent the first item, but still consumes Tab", () => {
    const editor = editorWith("<ul><li>only</li></ul>");
    caretIn(editor, "li", 0);

    // There is nothing to nest under, but returning false would let Tab move
    // focus out of the editor entirely.
    expect(handleListIndent(editor, true)).toBe(true);
    expect(editor.querySelectorAll("ul")).toHaveLength(1);
  });

  it("nests an item under its previous sibling", () => {
    const editor = editorWith("<ul><li>one</li><li>two</li></ul>");
    caretIn(editor, "li:last-child", 0);

    expect(handleListIndent(editor, true)).toBe(true);
    expect(editor.querySelector("ul > li > ul > li")?.textContent).toBe("two");
  });

  it("stops nesting at three levels", () => {
    const editor = editorWith(
      "<ul><li>a<ul><li>b<ul><li>c</li><li id='deep'>d</li></ul></li></ul></li></ul>",
    );
    caretIn(editor, "#deep", 0);

    expect(handleListIndent(editor, true)).toBe(true);
    // Still where it was: a fourth level would be unreadable and the outdent
    // path has no way back from it.
    expect(editor.querySelector("#deep")?.parentElement?.parentElement?.id).toBe("");
    expect(editor.querySelectorAll("#deep ul")).toHaveLength(0);
  });

  it("outdents back out of a nested list", () => {
    const editor = editorWith("<ul><li>one<ul><li id='inner'>two</li></ul></li></ul>");
    caretIn(editor, "#inner", 0);

    expect(handleListIndent(editor, false)).toBe(true);
    expect(editor.querySelector("ul > ul")).toBeNull();
  });
});

describe("synchronizeCheckboxState", () => {
  it("sets the element, the input and the span together", () => {
    const li = createCheckboxListItem("task", false);
    const checkbox = li.querySelector("input")!;
    const span = li.querySelector("span")!;

    expect(synchronizeCheckboxState(true, checkbox, li, span)).toBe(true);
    expect(checkbox.checked).toBe(true);
    expect(checkbox.getAttribute("checked")).toBe("checked");
    expect(li.getAttribute("data-checked")).toBe("true");
    expect(span.classList.contains("checkbox-checked")).toBe(true);
  });

  it("clears the attribute rather than setting it false", () => {
    const li = createCheckboxListItem("task", true);
    const checkbox = li.querySelector("input")!;

    synchronizeCheckboxState(false, checkbox, li, li.querySelector("span"));

    // checked="false" is still checked in HTML, so the attribute has to go.
    expect(checkbox.hasAttribute("checked")).toBe(false);
  });

  it("tolerates a missing span", () => {
    const li = createCheckboxListItem("task");
    expect(synchronizeCheckboxState(true, li.querySelector("input")!, li, null)).toBe(true);
  });
});

describe("toggleCheckbox", () => {
  it("flips the item and reports the new html", () => {
    const editor = editorWith("<ul class='checklist'></ul>");
    editor.querySelector("ul")!.appendChild(createCheckboxListItem("task", false));
    const checkbox = editor.querySelector("input")!;
    const onChange = jest.fn();

    toggleCheckbox(checkbox, onChange, undefined, editor);

    expect(editor.querySelector("li")?.getAttribute("data-checked")).toBe("true");
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('data-checked="true"'));
  });

  it("also calls onBlur, so the change commits rather than waiting for focus loss", () => {
    const editor = editorWith("<ul class='checklist'></ul>");
    editor.querySelector("ul")!.appendChild(createCheckboxListItem("task", false));
    const onBlur = jest.fn();

    toggleCheckbox(editor.querySelector("input")!, jest.fn(), onBlur, editor);

    expect(onBlur).toHaveBeenCalled();
  });

  it("still flips a checkbox with no enclosing list item", () => {
    const editor = editorWith("<input type='checkbox'>");
    const checkbox = editor.querySelector("input")!;

    toggleCheckbox(checkbox, jest.fn(), undefined, editor);

    expect(checkbox.checked).toBe(true);
  });

  it("reports nothing when there is no container to read html from", () => {
    const li = createCheckboxListItem("task");
    const onChange = jest.fn();

    toggleCheckbox(li.querySelector("input")!, onChange, undefined, null);

    expect(onChange).not.toHaveBeenCalled();
  });
});

/**
 * The view-mode path. It cannot read the DOM the user clicked, because view
 * mode renders link patterns as anchors first -- saving that back would write
 * generated markup into the note permanently.
 */
describe("toggleCheckboxInHtml", () => {
  const CHECKLIST =
    '<ul class="checklist">' +
    '<li class="checkbox-item" data-checked="false"><input type="checkbox"><span>first</span></li>' +
    '<li class="checkbox-item" data-checked="false"><input type="checkbox"><span>second</span></li>' +
    "</ul>";

  it("checks the item at the given index and leaves the rest alone", () => {
    const result = toggleCheckboxInHtml(CHECKLIST, 1)!;

    const container = document.createElement("div");
    container.innerHTML = result;
    const items = container.querySelectorAll("li");
    expect(items[0].getAttribute("data-checked")).toBe("false");
    expect(items[1].getAttribute("data-checked")).toBe("true");
    expect(items[1].querySelector("input")!.hasAttribute("checked")).toBe(true);
    expect(items[1].querySelector("span")!.className).toContain("checkbox-checked");
  });

  it("unchecks one that was checked", () => {
    const checked = toggleCheckboxInHtml(CHECKLIST, 0)!;
    const result = toggleCheckboxInHtml(checked, 0)!;

    const container = document.createElement("div");
    container.innerHTML = result;
    expect(container.querySelector("li")!.getAttribute("data-checked")).toBe("false");
    expect(container.querySelector("input")!.hasAttribute("checked")).toBe(false);
  });

  it("adds no link markup, which is the whole point", () => {
    const result = toggleCheckboxInHtml(CHECKLIST, 0)!;
    expect(result).not.toContain("<a");
  });

  it("returns null when there is no checkbox at that index", () => {
    expect(toggleCheckboxInHtml(CHECKLIST, 5)).toBeNull();
    expect(toggleCheckboxInHtml("<p>no checkboxes</p>", 0)).toBeNull();
  });

  it("handles a checkbox outside a list item", () => {
    const result = toggleCheckboxInHtml('<p><input type="checkbox"> loose</p>', 0)!;
    expect(result).toContain('checked="checked"');
  });
});
