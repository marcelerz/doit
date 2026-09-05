/**
 * @jest-environment jsdom
 */

/**
 * Tests for the rich text editor's caret helpers.
 *
 * These lived inside RichTextEditor.tsx, where nothing could reach them
 * without mounting a contenteditable. Every one of them has a "the selection
 * is gone" path, which is the path that actually runs in a real editor when
 * the user clicks away mid-operation, and none of it had ever been exercised.
 */

import {
  getValidatedSelection,
  isRangeValid,
  ensureEditable,
  getCurrentBlock,
  getLineTextBeforeCursor,
  isCursorAtBlockStart,
  getTextAfterTrigger,
  clearCurrentLine,
  getCaretOffset,
  setCaretOffset,
  placeCaretAtEnd,
  insertHtmlAtCaret,
  insertTextAtCaret,
} from "../selection";

/** Put the caret inside `node` at `offset` and return the live range. */
function placeCaret(node: Node, offset: number): Range {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
}

function editorWith(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.innerHTML = html;
  document.body.appendChild(editor);
  return editor;
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("getValidatedSelection", () => {
  it("returns null when nothing is selected", () => {
    expect(getValidatedSelection()).toBeNull();
  });

  it("returns the selection and range when the caret is in the document", () => {
    const editor = editorWith("<div>hello</div>");
    placeCaret(editor.firstChild!.firstChild!, 2);

    const validated = getValidatedSelection();
    expect(validated).not.toBeNull();
    expect(validated!.range.startOffset).toBe(2);
  });

  it("returns null when the range points outside the document", () => {
    const detached = document.createElement("div");
    detached.textContent = "orphan";
    const range = document.createRange();
    range.setStart(detached.firstChild!, 1);
    range.collapse(true);

    const real = window.getSelection;
    window.getSelection = () => ({ rangeCount: 1, getRangeAt: () => range }) as unknown as Selection;
    try {
      // Acting on this range would write into a subtree nobody can see, so the
      // connectivity check is the only thing standing between the editor and a
      // silent no-op the user reads as lost input.
      expect(getValidatedSelection()).toBeNull();
    } finally {
      window.getSelection = real;
    }
  });

  it("returns null when getRangeAt throws", () => {
    const real = window.getSelection;
    window.getSelection = () =>
      ({
        rangeCount: 1,
        getRangeAt: () => {
          throw new Error("no range");
        },
      }) as unknown as Selection;
    try {
      expect(getValidatedSelection()).toBeNull();
    } finally {
      window.getSelection = real;
    }
  });
});

describe("isRangeValid", () => {
  it("rejects a null range", () => {
    expect(isRangeValid(null)).toBe(false);
  });

  it("accepts a range whose ends are in the document", () => {
    const editor = editorWith("<div>hello</div>");
    expect(isRangeValid(placeCaret(editor.firstChild!.firstChild!, 1))).toBe(true);
  });

  it("rejects a range over a detached subtree", () => {
    const detached = document.createElement("div");
    detached.textContent = "orphan";
    const range = document.createRange();
    range.setStart(detached.firstChild!, 1);
    range.collapse(true);

    expect(isRangeValid(range)).toBe(false);
  });
});

describe("ensureEditable", () => {
  it("gives an empty element a br so the caret has somewhere to sit", () => {
    const element = document.createElement("div");
    ensureEditable(element);

    expect(element.firstChild?.nodeName).toBe("BR");
  });

  it("leaves an element that already has content alone", () => {
    const element = editorWith("<span>x</span>");
    ensureEditable(element);

    expect(element.childNodes).toHaveLength(1);
    expect(element.firstChild?.nodeName).toBe("SPAN");
  });
});

describe("getCurrentBlock", () => {
  it("returns null with no selection", () => {
    expect(getCurrentBlock(editorWith("<div>x</div>"))).toBeNull();
  });

  it("walks up from a text node to its list item", () => {
    const editor = editorWith("<ul><li>item</li></ul>");
    const li = editor.querySelector("li")!;
    placeCaret(li.firstChild!, 1);

    expect(getCurrentBlock(editor)).toBe(li);
  });

  it("stops at the editor rather than escaping it", () => {
    const editor = editorWith("text");
    placeCaret(editor.firstChild!, 1);

    // The caret's only ancestor inside the editor is the editor itself, which
    // the walk must not return -- callers replace what they get back.
    expect(getCurrentBlock(editor)).toBeNull();
  });
});

describe("getLineTextBeforeCursor", () => {
  it("returns an empty string with no selection", () => {
    expect(getLineTextBeforeCursor()).toBe("");
  });

  it("returns only the text to the left of the caret", () => {
    const editor = editorWith("<div>hello world</div>");
    placeCaret(editor.firstChild!.firstChild!, 5);

    expect(getLineTextBeforeCursor()).toBe("hello");
  });

  it("returns an empty string when the caret is on an element, not text", () => {
    const editor = editorWith("<div><br></div>");
    placeCaret(editor.firstChild!, 0);

    expect(getLineTextBeforeCursor()).toBe("");
  });
});

describe("isCursorAtBlockStart", () => {
  it("is false with no selection", () => {
    expect(isCursorAtBlockStart(editorWith("<div>x</div>"))).toBe(false);
  });

  it("is true at offset zero of the first text node", () => {
    const editor = editorWith("<div>hello</div>");
    placeCaret(editor.firstChild!.firstChild!, 0);

    expect(isCursorAtBlockStart(editor)).toBe(true);
  });

  it("is false anywhere past the start", () => {
    const editor = editorWith("<div>hello</div>");
    placeCaret(editor.firstChild!.firstChild!, 1);

    expect(isCursorAtBlockStart(editor)).toBe(false);
  });

  it("is false when non-empty content precedes the caret's node", () => {
    const editor = editorWith("<div><span>lead</span>tail</div>");
    placeCaret(editor.firstChild!.lastChild!, 0);

    // Offset zero is not the start of the block when a sibling holds text.
    expect(isCursorAtBlockStart(editor)).toBe(false);
  });
});

describe("getTextAfterTrigger", () => {
  it("returns empty values with no selection", () => {
    expect(getTextAfterTrigger(2)).toEqual({ remainingText: "", textNode: null, block: null });
  });

  it("drops the trigger and keeps the rest of the line", () => {
    const editor = editorWith("<div>- item</div>");
    const text = editor.firstChild!.firstChild! as Text;
    placeCaret(text, 2); // just past "- "

    const result = getTextAfterTrigger(2);
    expect(result.remainingText).toBe("item");
    expect(result.textNode).toBe(text);
  });

  it("keeps text on both sides of the caret", () => {
    const editor = editorWith("<div>ab# cd</div>");
    placeCaret(editor.firstChild!.firstChild!, 4); // just past "# "

    expect(getTextAfterTrigger(2).remainingText).toBe("abcd");
  });
});

describe("clearCurrentLine", () => {
  it("empties the given text node", () => {
    const editor = editorWith("<div>content</div>");
    const text = editor.firstChild!.firstChild! as Text;

    clearCurrentLine(text);
    expect(text.textContent).toBe("");
  });

  it("does nothing when handed null", () => {
    expect(() => clearCurrentLine(null)).not.toThrow();
  });
});

/**
 * The offset pair exists so the editor can replace its content without
 * throwing the user's place away. A saved Range points at nodes; the moment
 * the editor writes new HTML those nodes are gone, and every guard the
 * component grew around that is a symptom of storing the wrong thing.
 */
describe("getCaretOffset / setCaretOffset", () => {
  it("counts characters, not nodes", () => {
    const editor = editorWith("<div>abc<b>def</b>ghi</div>");
    const bold = editor.querySelector("b")!;
    placeCaret(bold.firstChild!, 2); // between "de" and "f"

    expect(getCaretOffset(editor)).toBe(5);
  });

  it("counts across blocks, since block boundaries carry no character", () => {
    const editor = editorWith("<div>one</div><div>two</div>");
    placeCaret(editor.lastChild!.firstChild!, 3);

    expect(getCaretOffset(editor)).toBe(6);
  });

  it("survives the content being rebuilt, which a saved Range does not", () => {
    const editor = editorWith("<div>hello world</div>");
    placeCaret(editor.firstChild!.firstChild!, 5);
    const offset = getCaretOffset(editor)!;

    // What the editor does when a new value arrives.
    editor.innerHTML = "<div>hello world</div>";
    setCaretOffset(editor, offset);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe("hello world");
    expect(range.startOffset).toBe(5);
    expect(range.collapsed).toBe(true);
  });

  it("lands in the right node when the offset spans several", () => {
    const editor = editorWith("<div>abc</div><div>defgh</div>");

    setCaretOffset(editor, 5);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe("defgh");
    expect(range.startOffset).toBe(2);
  });

  it("clamps to the end when the content shrank under it", () => {
    const editor = editorWith("<div>short</div>");

    setCaretOffset(editor, 999);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe("short");
    expect(range.startOffset).toBe(5);
  });

  it("falls back to the editor itself when there is no text to land in", () => {
    const editor = editorWith("<div><br></div>");

    setCaretOffset(editor, 3);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(editor);
    expect(range.startOffset).toBe(0);
  });

  it("reads null when the caret is in a different editor", () => {
    const editor = editorWith("<div>mine</div>");
    const other = editorWith("<div>theirs</div>");
    placeCaret(other.firstChild!.firstChild!, 2);

    expect(getCaretOffset(editor)).toBeNull();
  });

  it("reads null with no selection at all", () => {
    const editor = editorWith("<div>text</div>");
    window.getSelection()!.removeAllRanges();

    expect(getCaretOffset(editor)).toBeNull();
  });
});

describe("placeCaretAtEnd", () => {
  it("puts the caret after the text, so typing continues the line", () => {
    const editor = editorWith("<h1>existing</h1>");
    const header = editor.querySelector("h1")!;

    placeCaretAtEnd(header);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(header.firstChild);
    expect(range.startOffset).toBe(8);
  });

  it("uses the last child, not the first, when the block has several", () => {
    const editor = editorWith("<li><b>Bold</b> tail</li>");
    const li = editor.querySelector("li")!;

    placeCaretAtEnd(li);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe(" tail");
    expect(range.startOffset).toBe(5);
  });

  it("sits before a placeholder br rather than after it", () => {
    // A block holding only <br> is empty; a caret after the br would show up
    // on a second line the user never made.
    const editor = editorWith("<blockquote><br></blockquote>");
    const quote = editor.querySelector("blockquote")!;

    placeCaretAtEnd(quote);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(quote);
    expect(range.startOffset).toBe(0);
  });

  it("sits at the end of an element with no children", () => {
    const editor = editorWith("<div></div>");
    const block = editor.querySelector("div")!;

    placeCaretAtEnd(block);

    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(block);
    expect(range.startOffset).toBe(0);
  });
});

/**
 * These replace document.execCommand("insertHTML"), which is deprecated and
 * normalises whatever it is handed. Sanitising happens in the caller, so what
 * arrives here is inserted as given.
 */
describe("insertHtmlAtCaret", () => {
  it("inserts at the caret and leaves the caret after it", () => {
    const editor = editorWith("<div>abcdef</div>");
    placeCaret(editor.firstChild!.firstChild!, 3);

    expect(insertHtmlAtCaret(editor, "<b>X</b>")).toBe(true);

    expect(editor.innerHTML).toBe("<div>abc<b>X</b>def</div>");
    // Typing continues after the insert, not inside it and not before it.
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.collapsed).toBe(true);
    const block = editor.firstChild!;
    expect(range.startContainer).toBe(block);
    expect(block.childNodes[range.startOffset].textContent).toBe("def");
  });

  it("replaces the selection rather than inserting beside it", () => {
    const editor = editorWith("<div>abcdef</div>");
    const text = editor.firstChild!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 1);
    range.setEnd(text, 4);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    insertHtmlAtCaret(editor, "<i>Z</i>");

    expect(editor.innerHTML).toBe("<div>a<i>Z</i>ef</div>");
  });

  it("refuses when the caret is somewhere else entirely", () => {
    const editor = editorWith("<div>mine</div>");
    const other = editorWith("<div>theirs</div>");
    placeCaret(other.firstChild!.firstChild!, 2);

    expect(insertHtmlAtCaret(editor, "<b>X</b>")).toBe(false);
    expect(editor.innerHTML).toBe("<div>mine</div>");
  });

  it("refuses with no selection", () => {
    const editor = editorWith("<div>text</div>");
    window.getSelection()!.removeAllRanges();

    expect(insertHtmlAtCaret(editor, "<b>X</b>")).toBe(false);
  });
});

describe("insertTextAtCaret", () => {
  it("inserts text without interpreting it as markup", () => {
    // Terminal output is full of angle brackets that mean nothing.
    const editor = editorWith("<div>x</div>");
    placeCaret(editor.firstChild!.firstChild!, 1);

    insertTextAtCaret(editor, "a < b && c > d");

    expect(editor.textContent).toBe("xa < b && c > d");
    expect(editor.querySelectorAll("*").length).toBe(1); // still just the div
  });

  it("keeps line breaks as line breaks", () => {
    const editor = editorWith("<div>x</div>");
    placeCaret(editor.firstChild!.firstChild!, 1);

    insertTextAtCaret(editor, "one\ntwo\r\nthree");

    expect(editor.querySelectorAll("br").length).toBe(2);
    expect(editor.textContent).toBe("xonetwothree");
  });
});
