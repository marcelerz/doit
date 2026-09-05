/**
 * @jest-environment jsdom
 */

/**
 * The first tests this component has ever had.
 *
 * 867 lines of contenteditable state handling, excluded from the coverage
 * ratchet, patched six times ("Bug fixes", "Various fixes", "More fixes") and
 * never pinned. Every case here is one of the defects found by driving the real
 * app in a browser, written as the rule it broke.
 *
 * What is deliberately not tested: anything that needs real caret movement,
 * selection ranges spanning nodes, or document.execCommand -- jsdom has no
 * layout, no editing host and no execCommand, so a test of those would assert
 * the mock rather than the behaviour. Those live in the e2e suite.
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import RichTextEditor from "../RichTextEditor";
import { getLinkPatternId } from "@/types/linkPattern";
import { getColor } from "@/types/types";

const DEBOUNCE_MS = 150;

/** The contenteditable itself. */
const editor = () => screen.getByTestId("rich-text-editor");

/** Type into the editor the way the browser does: mutate, then fire input. */
function typeInto(html: string): void {
  const el = editor();
  el.innerHTML = html;
  fireEvent.input(el);
}

/** Put the caret at `offset` in the editor's first text node. */
function caretAt(offset: number): void {
  const el = editor();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const node = walker.nextNode();
  const range = document.createRange();
  range.setStart(node ?? el, node ? offset : 0);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Let the 150ms change debounce fire. */
function settle(): void {
  act(() => {
    jest.advanceTimersByTime(DEBOUNCE_MS);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("filling the editor from `value`", () => {
  it("puts the initial value into a freshly mounted editor", () => {
    render(<RichTextEditor value="<div>hello</div>" onChange={jest.fn()} alwaysEditable />);

    expect(editor().innerHTML).toBe("<div>hello</div>");
  });

  it("sanitises what it is given, rather than trusting stored content", () => {
    render(<RichTextEditor value='<b>keep</b><img src="x.png"><script>bad()</script>' onChange={jest.fn()} alwaysEditable />);

    expect(editor().innerHTML).toBe("<b>keep</b>");
  });

  it("applies a later value change", () => {
    const { rerender } = render(<RichTextEditor value="<div>first</div>" onChange={jest.fn()} alwaysEditable />);

    rerender(<RichTextEditor value="<div>second</div>" onChange={jest.fn()} alwaysEditable />);

    expect(editor().innerHTML).toBe("<div>second</div>");
  });
});

describe("emitting changes", () => {
  it("debounces typing into one call", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);

    typeInto("<div>a</div>");
    typeInto("<div>ab</div>");
    typeInto("<div>abc</div>");
    expect(onChange).not.toHaveBeenCalled();

    settle();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("<div>abc</div>");
  });

  it("commits on blur without waiting for the debounce", () => {
    // A modal can close inside 150ms, and the content has to be saved first.
    const onChange = jest.fn();
    const onBlur = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} onBlur={onBlur} alwaysEditable />);

    typeInto("<div>typed</div>");
    fireEvent.blur(editor());

    expect(onChange).toHaveBeenCalledWith("<div>typed</div>");
    expect(onBlur).toHaveBeenCalledWith("<div>typed</div>");
  });

  it("does not fire the change twice when the debounce would also have run", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);

    typeInto("<div>typed</div>");
    fireEvent.blur(editor());
    settle();

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("commits pending text on unmount instead of dropping it", () => {
    // The blocker: Escape closes a note by unmounting, and this used to clear
    // the pending timer without running it, losing everything typed since the
    // last flush.
    const onChange = jest.fn();
    const { unmount } = render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);

    typeInto("<div>unsaved</div>");
    expect(onChange).not.toHaveBeenCalled();

    unmount();

    expect(onChange).toHaveBeenCalledWith("<div>unsaved</div>");
  });

  it("has nothing to commit on unmount when the change already went out", () => {
    const onChange = jest.fn();
    const { unmount } = render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);

    typeInto("<div>saved</div>");
    settle();
    onChange.mockClear();

    unmount();

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("submitting with Enter", () => {
  const setup = () => {
    const onSubmit = jest.fn();
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} onSubmit={onSubmit} alwaysEditable />);
    return { onSubmit, onChange };
  };

  it("empties the box, so the text is not left behind", () => {
    // It used to stay put: the effect that writes `value` back was skipped
    // whenever the editor had focus, and after Enter the caret is still in it.
    const { onSubmit } = setup();

    typeInto("<div>First comment</div>");
    fireEvent.keyDown(editor(), { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledWith("<div>First comment</div>");
    expect(editor().innerHTML).toBe("");
  });

  it("submits nothing on a second Enter, rather than a duplicate", () => {
    const { onSubmit } = setup();

    typeInto("<div>First comment</div>");
    fireEvent.keyDown(editor(), { key: "Enter" });
    fireEvent.keyDown(editor(), { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenLastCalledWith("");
  });

  it("drops the pending change, or it would type the comment straight back in", () => {
    const { onSubmit, onChange } = setup();

    typeInto("<div>First comment</div>");
    fireEvent.keyDown(editor(), { key: "Enter" });
    onChange.mockClear();

    settle();

    expect(onChange).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(editor().innerHTML).toBe("");
  });

  it("leaves Shift+Enter alone, for a newline inside a comment", () => {
    const { onSubmit } = setup();

    typeInto("<div>text</div>");
    fireEvent.keyDown(editor(), { key: "Enter", shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(editor().innerHTML).toBe("<div>text</div>");
  });
});

describe("pasting", () => {
  const paste = (types: Record<string, string>) =>
    fireEvent.paste(editor(), {
      clipboardData: { getData: (type: string) => types[type] ?? "" },
    });

  /** Paste goes in at the caret, so the caret has to be in the editor. */
  const putCaretInEditor = () => {
    const el = editor();
    const range = document.createRange();
    range.setStart(el, 0);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  it("sanitises HTML on the way in, not at render time", () => {
    // Nothing sanitised paste before, so storage accumulated tags the render
    // allow-list would later delete -- the user's formatting vanished on reload.
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);
    putCaretInEditor();

    paste({ "text/html": '<b>bold</b><font color="red">red</font><img src="x.png">' });
    settle();

    expect(editor().innerHTML).toBe("<b>bold</b>red");
    expect(onChange).toHaveBeenCalledWith("<b>bold</b>red");
  });

  it("inserts nothing when the caret is not in this editor", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);
    window.getSelection()!.removeAllRanges();

    paste({ "text/html": "<b>nope</b>" });
    settle();

    expect(editor().innerHTML).toBe("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls back to plain text when there is no HTML flavour", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);
    putCaretInEditor();

    paste({ "text/plain": "a < b && c" });
    settle();

    expect(editor().textContent).toBe("a < b && c");
    expect(editor().querySelectorAll("*")).toHaveLength(0);
  });
});

describe("view mode", () => {
  it("shows rendered content until it is clicked", () => {
    render(<RichTextEditor value="<b>rendered</b>" onChange={jest.fn()} />);

    expect(screen.queryByTestId("rich-text-editor")).toBeNull();
    expect(screen.getByText("rendered")).toBeTruthy();
  });

  it("toggles a checkbox against the stored source, adding no link markup", () => {
    // Rendered view mode has link-pattern anchors in it that were never part of
    // the note; saving that DOM back baked them in permanently.
    const onChange = jest.fn();
    const source =
      '<ul class="checklist"><li class="checkbox-item" data-checked="false">' +
      "<input type=\"checkbox\"><span>T123 write it</span></li></ul>";
    render(
      <RichTextEditor
        value={source}
        onChange={onChange}
        linkPatterns={[
          {
            id: getLinkPatternId("p1"),
            prefix: "T",
            urlTemplate: "https://tickets/{id}",
            description: "Ticket",
            color: getColor("#2563eb"),
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox"));

    const saved = onChange.mock.calls[0][0] as string;
    expect(saved).toContain('data-checked="true"');
    expect(saved).not.toContain("<a");
  });

  it("switches to edit mode when clicked", () => {
    render(<RichTextEditor value="<div>text</div>" onChange={jest.fn()} />);

    fireEvent.click(screen.getByText("text"));

    expect(screen.getByTestId("rich-text-editor")).toBeTruthy();
  });

  it("stays in view mode when alwaysEditable is off and nothing is clicked", () => {
    render(<RichTextEditor value="<div>text</div>" onChange={jest.fn()} noBorderInViewMode />);

    expect(screen.queryByTestId("rich-text-editor")).toBeNull();
  });
});

/**
 * execCommand does not exist in jsdom, so these assert the call rather than its
 * effect. That is the point of them: the rule is which command is issued and
 * that a change follows, and both were wrong before -- the keyboard shortcuts
 * emitted no change at all and relied on execCommand happening to dispatch an
 * input event.
 */
describe("inline formatting", () => {
  let exec: jest.Mock;

  beforeEach(() => {
    exec = jest.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
  });

  afterEach(() => {
    delete (document as unknown as { execCommand?: unknown }).execCommand;
  });

  it("pins styleWithCSS off, so the output is <b> and not <font>", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<div>text</div>" onChange={onChange} alwaysEditable />);

    fireEvent.click(screen.getByTitle("Bold (⌘B)"));
    settle();

    expect(exec).toHaveBeenNthCalledWith(1, "styleWithCSS", false, "false");
    expect(exec).toHaveBeenNthCalledWith(2, "bold");
    expect(onChange).toHaveBeenCalled();
  });

  it.each([
    ["b", "bold"],
    ["i", "italic"],
    ["u", "underline"],
  ])("emits a change for the %s shortcut", (key, command) => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<div>text</div>" onChange={onChange} alwaysEditable />);

    fireEvent.keyDown(editor(), { key, metaKey: true });
    settle();

    expect(exec).toHaveBeenCalledWith(command);
    expect(onChange).toHaveBeenCalled();
  });

  it("still formats when the browser refuses styleWithCSS", () => {
    exec.mockImplementationOnce(() => {
      throw new Error("unsupported");
    });
    render(<RichTextEditor value="<div>text</div>" onChange={jest.fn()} alwaysEditable />);

    fireEvent.click(screen.getByTitle("Italic (⌘I)"));

    expect(exec).toHaveBeenLastCalledWith("italic");
  });
});

describe("block conversions from the toolbar", () => {
  it("turns the caret's line into a bullet list and emits the change", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<div>item</div>" onChange={onChange} alwaysEditable />);
    caretAt(4);

    fireEvent.click(screen.getByTitle("Bullet List (type - )"));
    settle();

    expect(editor().querySelector("ul li")?.textContent).toBe("item");
    expect(onChange).toHaveBeenCalledWith(editor().innerHTML);
  });

  it("turns it into a blockquote", () => {
    render(<RichTextEditor value="<div>quoted</div>" onChange={jest.fn()} alwaysEditable />);
    caretAt(6);

    fireEvent.click(screen.getByTitle("Blockquote (type > )"));

    expect(editor().querySelector("blockquote")?.textContent).toBe("quoted");
  });

  it("turns it into a heading", () => {
    render(<RichTextEditor value="<div>title</div>" onChange={jest.fn()} alwaysEditable />);
    caretAt(5);

    fireEvent.click(screen.getByTitle("Heading 2 (type ## )"));

    expect(editor().querySelector("h2")?.textContent).toBe("title");
  });
});

describe("markdown triggers", () => {
  const triggerSpace = (line: string, caret: number) => {
    const onChange = jest.fn();
    render(<RichTextEditor value={`<div>${line}</div>`} onChange={onChange} alwaysEditable />);
    caretAt(caret);
    fireEvent.keyDown(editor(), { key: " " });
    return onChange;
  };

  it("makes a bullet list out of '- '", () => {
    const onChange = triggerSpace("-", 1);
    settle();

    expect(editor().querySelector("ul li")).toBeTruthy();
    expect(onChange).toHaveBeenCalled();
  });

  it("makes an ordered list out of '1. '", () => {
    triggerSpace("1.", 2);
    expect(editor().querySelector("ol li")).toBeTruthy();
  });

  it("makes an empty checkbox out of '[] '", () => {
    triggerSpace("[]", 2);
    expect(editor().querySelector("li.checkbox-item")?.getAttribute("data-checked")).toBe("false");
  });

  it("makes a ticked checkbox out of '[x] '", () => {
    triggerSpace("[x]", 3);
    expect(editor().querySelector("li.checkbox-item")?.getAttribute("data-checked")).toBe("true");
  });

  it("makes a blockquote out of '> '", () => {
    triggerSpace(">", 1);
    expect(editor().querySelector("blockquote")).toBeTruthy();
  });

  it("makes a heading out of '## ', with the caret after the text", () => {
    // "# " typed in front of an existing line used to leave the caret at the
    // start of the new heading, so the next character landed before the text.
    // The space is prevented, so at trigger time the line reads "##Heading"
    // with the caret between the hashes and the text.
    const onChange = jest.fn();
    render(<RichTextEditor value="<div>##Heading</div>" onChange={onChange} alwaysEditable />);
    caretAt(2);

    fireEvent.keyDown(editor(), { key: " " });

    const header = editor().querySelector("h2")!;
    expect(header.textContent).toBe("Heading");
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer.textContent).toBe("Heading");
    expect(range.startOffset).toBe(7);
  });

  it("leaves an ordinary space alone", () => {
    const onChange = triggerSpace("word", 4);
    expect(editor().querySelector("ul, ol, h1, h2, blockquote")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("leaving the editor", () => {
  it("blurs on Escape even when alwaysEditable, because blur is what commits", () => {
    // Escape is how you leave a note. It used to do nothing here, so the
    // pending change went out with the unmount instead of before it.
    const onChange = jest.fn();
    render(<RichTextEditor value="" onChange={onChange} alwaysEditable />);
    const el = editor();
    const blur = jest.spyOn(el, "blur");

    typeInto("<div>typed</div>");
    fireEvent.keyDown(el, { key: "Escape" });

    expect(blur).toHaveBeenCalled();
  });

  it("stays in edit mode when focus moves into the toolbar", () => {
    render(<RichTextEditor value="<div>text</div>" onChange={jest.fn()} />);
    fireEvent.click(screen.getByText("text"));

    fireEvent.blur(editor(), { relatedTarget: screen.getByTitle("Bold (⌘B)") });

    expect(screen.getByTestId("rich-text-editor")).toBeTruthy();
  });

  it("returns to view mode when focus leaves entirely", () => {
    render(<RichTextEditor value="<div>text</div>" onChange={jest.fn()} />);
    fireEvent.click(screen.getByText("text"));

    fireEvent.blur(editor(), { relatedTarget: null });

    expect(screen.queryByTestId("rich-text-editor")).toBeNull();
  });
});

describe("links", () => {
  const selectEverything = () => {
    const range = document.createRange();
    range.selectNodeContents(editor());
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const openDialog = () => {
    selectEverything();
    fireEvent.click(screen.getByTitle("Link (⌘K)"));
    return screen.getByPlaceholderText("https://...");
  };

  const apply = (url: string) => {
    const input = openDialog();
    fireEvent.change(input, { target: { value: url } });
    fireEvent.keyDown(input, { key: "Enter" });
  };

  it("wraps the selection in a link", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="doit" onChange={onChange} alwaysEditable />);

    apply("https://example.com");
    settle();

    const link = editor().querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toBe("doit");
    expect(onChange).toHaveBeenCalled();
  });

  it("refuses a javascript: URL", () => {
    render(<RichTextEditor value="doit" onChange={jest.fn()} alwaysEditable />);

    apply("javascript:alert(1)");

    expect(editor().querySelector("a")).toBeNull();
  });

  it("escapes quotes in the URL, so it cannot break out of the attribute", () => {
    render(<RichTextEditor value="doit" onChange={jest.fn()} alwaysEditable />);

    apply('https://x.test/" onmouseover="steal()');

    // The whole string stays inside href as one value -- no second attribute
    // and no event handler is created out of it.
    const link = editor().querySelector("a")!;
    expect(link.getAttribute("href")).toBe('https://x.test/" onmouseover="steal()');
    expect(link.hasAttribute("onmouseover")).toBe(false);
  });

  it("forgets a selection that has gone stale", () => {
    // A range saved half an hour ago points at nodes that may be long gone.
    render(<RichTextEditor value="doit" onChange={jest.fn()} alwaysEditable />);
    const input = openDialog();

    act(() => {
      jest.advanceTimersByTime(31_000);
    });
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(editor().querySelector("a")).toBeNull();
    expect(screen.queryByPlaceholderText("https://...")).toBeNull();
  });

  it("closes on Escape without changing anything", () => {
    render(<RichTextEditor value="doit" onChange={jest.fn()} alwaysEditable />);
    const input = openDialog();

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByPlaceholderText("https://...")).toBeNull();
    expect(editor().innerHTML).toBe("doit");
  });

  it("prefills the dialog with an existing link's URL", () => {
    render(<RichTextEditor value='<a href="https://old.test/">doit</a>' onChange={jest.fn()} alwaysEditable />);

    const input = openDialog() as HTMLInputElement;

    expect(input.value).toBe("https://old.test/");
  });

  it("opens the dialog from the keyboard too", () => {
    render(<RichTextEditor value="doit" onChange={jest.fn()} alwaysEditable />);
    selectEverything();

    fireEvent.keyDown(editor(), { key: "k", metaKey: true });

    expect(screen.getByPlaceholderText("https://...")).toBeTruthy();
  });
});

describe("keys inside structured blocks", () => {
  it("continues a list on Enter", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<ul><li>item</li></ul>" onChange={onChange} alwaysEditable />);
    caretAt(4);

    fireEvent.keyDown(editor(), { key: "Enter" });
    settle();

    expect(editor().querySelectorAll("li")).toHaveLength(2);
    expect(onChange).toHaveBeenCalled();
  });

  it("unwraps a list item on Backspace at its start", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<ul><li>item</li></ul>" onChange={onChange} alwaysEditable />);
    caretAt(0);

    fireEvent.keyDown(editor(), { key: "Backspace" });
    settle();

    expect(editor().querySelector("ul")).toBeNull();
    expect(editor().textContent).toBe("item");
    expect(onChange).toHaveBeenCalled();
  });

  it("indents a list item with Tab", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<ul><li>one</li><li>two</li></ul>" onChange={onChange} alwaysEditable />);
    const second = editor().querySelectorAll("li")[1].firstChild!;
    const range = document.createRange();
    range.setStart(second, 1);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.keyDown(editor(), { key: "Tab" });
    settle();

    expect(editor().querySelector("li ul li")?.textContent).toBe("two");
    expect(onChange).toHaveBeenCalled();
  });

  it("leaves Tab alone outside a list, so focus can still move on", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="<div>plain</div>" onChange={onChange} alwaysEditable />);
    caretAt(2);

    fireEvent.keyDown(editor(), { key: "Tab" });
    settle();

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("inline code", () => {
  it("wraps the selection in a code element", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value="npm run dev" onChange={onChange} alwaysEditable />);
    const range = document.createRange();
    range.selectNodeContents(editor());
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.click(screen.getByTitle("Inline Code (type `text`)"));
    settle();

    expect(editor().querySelector("code")?.textContent).toBe("npm run dev");
    expect(onChange).toHaveBeenCalled();
  });

  it("leaves an empty code element to type into when nothing is selected", () => {
    render(<RichTextEditor value="text" onChange={jest.fn()} alwaysEditable />);
    caretAt(4);

    fireEvent.click(screen.getByTitle("Inline Code (type `text`)"));

    // A zero-width space, so the element has somewhere for the caret to sit.
    expect(editor().querySelector("code")?.textContent).toBe("​");
  });
});
