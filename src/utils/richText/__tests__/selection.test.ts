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
