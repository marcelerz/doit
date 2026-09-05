/**
 * @jest-environment jsdom
 */

/**
 * Tests for the rich text editor's markdown-shortcut conversions.
 *
 * Typing "- ", "1. ", "[] ", "> " or "## " turns the caret's line into that
 * block. Each conversion has two paths -- replace an existing block, or insert
 * next to a bare text node -- and every one of them leaves the caret somewhere
 * specific afterwards, which is what makes the shortcut feel like typing
 * rather than like a command.
 */

import {
  isListItemEmpty,
  getListNestingLevel,
  createBulletListItem,
  createCheckboxListItem,
  convertToBulletList,
  convertToOrderedList,
  convertToCheckboxList,
  convertToBlockquote,
  convertToHeader,
} from "../blocks";

function editorWith(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.innerHTML = html;
  document.body.appendChild(editor);
  return editor;
}

function placeCaret(node: Node, offset: number): void {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("isListItemEmpty", () => {
  it("treats whitespace as empty", () => {
    const li = document.createElement("li");
    li.textContent = "   ";
    expect(isListItemEmpty(li)).toBe(true);
  });

  it("treats text as not empty", () => {
    const li = document.createElement("li");
    li.textContent = "item";
    expect(isListItemEmpty(li)).toBe(false);
  });

  it("reads a checkbox item's span, not its whole text", () => {
    // The <input> contributes no text, but a naive textContent read on a
    // checkbox item would still have to skip it -- so the branch exists.
    const li = createCheckboxListItem("", false);
    expect(isListItemEmpty(li)).toBe(true);

    const filled = createCheckboxListItem("task", false);
    expect(isListItemEmpty(filled)).toBe(false);
  });

  it("treats a checkbox item with no span as empty", () => {
    const li = document.createElement("li");
    li.className = "checkbox-item";
    expect(isListItemEmpty(li)).toBe(true);
  });
});

describe("getListNestingLevel", () => {
  it("returns 0 for an item in a top-level list", () => {
    const editor = editorWith("<ul><li>a</li></ul>");
    expect(getListNestingLevel(editor.querySelector("li")!)).toBe(0);
  });

  it("counts one level per enclosing list", () => {
    const editor = editorWith("<ul><li>a<ul><li id='inner'>b</li></ul></li></ul>");
    expect(getListNestingLevel(editor.querySelector("#inner")!)).toBe(1);
  });

  it("returns 0 rather than -1 for an element in no list", () => {
    const editor = editorWith("<div id='x'>a</div>");
    expect(getListNestingLevel(editor.querySelector("#x")!)).toBe(0);
  });
});

describe("createCheckboxListItem", () => {
  it("builds an unchecked item", () => {
    const li = createCheckboxListItem("task");

    expect(li.className).toBe("checkbox-item");
    expect(li.getAttribute("data-checked")).toBe("false");
    expect(li.querySelector("input")!.checked).toBe(false);
    expect(li.querySelector("span")!.textContent).toBe("task");
  });

  it("marks a checked item on the element, the input and the span", () => {
    const li = createCheckboxListItem("done", true);

    // All three have to agree: data-checked survives a round trip through
    // stored HTML, the input drives the rendered control, and the span class
    // drives the strikethrough.
    expect(li.getAttribute("data-checked")).toBe("true");
    expect(li.querySelector("input")!.checked).toBe(true);
    expect(li.querySelector("span")!.className).toBe("checkbox-checked");
  });
});

describe("createBulletListItem", () => {
  it("carries its text", () => {
    expect(createBulletListItem("x").textContent).toBe("x");
  });

  it("defaults to empty", () => {
    expect(createBulletListItem().textContent).toBe("");
  });
});

describe("conversions with no selection", () => {
  it("each leave the editor untouched", () => {
    const editor = editorWith("<div>text</div>");
    const before = editor.innerHTML;

    convertToBulletList(editor);
    convertToOrderedList(editor);
    convertToCheckboxList(editor);
    convertToBlockquote(editor);
    convertToHeader(editor, 2);

    expect(editor.innerHTML).toBe(before);
  });
});

describe("convertToBulletList", () => {
  it("replaces the caret's block with a ul", () => {
    const editor = editorWith("<div>hello</div>");
    placeCaret(editor.firstChild!.firstChild!, 5);

    convertToBulletList(editor, "hello");

    expect(editor.querySelector("ul li")?.textContent).toBe("hello");
    expect(editor.querySelector("div")).toBeNull();
  });

  it("drops the trigger characters when given a trigger length", () => {
    const editor = editorWith("<div>- item</div>");
    placeCaret(editor.firstChild!.firstChild!, 2);

    convertToBulletList(editor, "", 2);

    expect(editor.querySelector("ul li")?.textContent).toBe("item");
  });

  it("leaves the caret at the end of the new item", () => {
    const editor = editorWith("<div>hello</div>");
    placeCaret(editor.firstChild!.firstChild!, 5);

    convertToBulletList(editor, "hello");

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startOffset).toBe(5);
  });
});

describe("convertToOrderedList", () => {
  it("produces an ol, not a ul", () => {
    const editor = editorWith("<div>first</div>");
    placeCaret(editor.firstChild!.firstChild!, 5);

    convertToOrderedList(editor, "first");

    expect(editor.querySelector("ol li")?.textContent).toBe("first");
    expect(editor.querySelector("ul")).toBeNull();
  });
});

describe("convertToCheckboxList", () => {
  it("produces a checkbox item carrying the line text", () => {
    const editor = editorWith("<div>task</div>");
    placeCaret(editor.firstChild!.firstChild!, 4);

    convertToCheckboxList(editor, false, "task");

    const li = editor.querySelector("li.checkbox-item")!;
    expect(li.querySelector("span")?.textContent).toBe("task");
    expect(li.getAttribute("data-checked")).toBe("false");
  });

  it("honours the checked flag, for the [x] shortcut", () => {
    const editor = editorWith("<div>done</div>");
    placeCaret(editor.firstChild!.firstChild!, 4);

    convertToCheckboxList(editor, true, "done");

    expect(editor.querySelector("li.checkbox-item")?.getAttribute("data-checked")).toBe("true");
  });
});

describe("convertToBlockquote", () => {
  it("replaces the block with a blockquote carrying the text", () => {
    const editor = editorWith("<div>quoted</div>");
    placeCaret(editor.firstChild!.firstChild!, 6);

    convertToBlockquote(editor, "quoted");

    expect(editor.querySelector("blockquote")?.textContent).toBe("quoted");
  });

  it("leaves the caret after the text, not in front of it", () => {
    // "> " typed ahead of an existing line used to drop the caret at offset 0
    // of the blockquote, so the next character landed before the line.
    const editor = editorWith("<div>&gt; existing</div>");
    placeCaret(editor.firstChild!.firstChild!, 2); // just past "> "

    convertToBlockquote(editor, "", 2);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe("existing");
    expect(range.startOffset).toBe(8);
  });

  it("gives an empty blockquote a br so it does not collapse", () => {
    const editor = editorWith("<div>x</div>");
    placeCaret(editor.firstChild!.firstChild!, 1);

    convertToBlockquote(editor, "");

    // Without this the blockquote has zero height and the caret has nowhere
    // to sit, so the user sees the line vanish.
    expect(editor.querySelector("blockquote br")).not.toBeNull();
  });
});

describe("convertToHeader", () => {
  it.each([1, 2, 3])("produces an h%i", (level) => {
    const editor = editorWith("<div>title</div>");
    placeCaret(editor.firstChild!.firstChild!, 5);

    convertToHeader(editor, level, "title");

    expect(editor.querySelector(`h${level}`)?.textContent).toBe("title");
  });

  it("leaves the caret after the text, like the list conversions do", () => {
    const editor = editorWith("<div># existing</div>");
    placeCaret(editor.firstChild!.firstChild!, 2); // just past "# "

    convertToHeader(editor, 1, "", 2);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe("existing");
    expect(range.startOffset).toBe(8);
  });

  it("drops the trigger characters", () => {
    const editor = editorWith("<div>## Heading</div>");
    placeCaret(editor.firstChild!.firstChild!, 3);

    convertToHeader(editor, 2, "", 3);

    expect(editor.querySelector("h2")?.textContent).toBe("Heading");
  });
});
