import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { sanitizeHtml, escapeHtmlAttribute, sanitizeUrl } from "@/utils/sanitize";
import {
  isRangeValid,
  getLineTextBeforeCursor,
  getCaretOffset,
  setCaretOffset,
  placeCaretAtEnd,
  insertHtmlAtCaret,
  insertTextAtCaret,
  getCurrentBlock,
  getCaretTextNode,
} from "@/utils/richText/selection";
import {
  convertToBulletList,
  convertToOrderedList,
  convertToCheckboxList,
  convertToBlockquote,
  convertToHeader,
} from "@/utils/richText/blocks";
import {
  handleListEnter,
  handleBlockquoteEnter,
  handleHeaderEnter,
  handleListBackspace,
  handleBlockquoteBackspace,
  handleHeaderBackspace,
  handleListIndent,
  convertInlineCode,
  toggleCheckbox,
  toggleCheckboxInHtml,
} from "@/utils/richText/keyHandlers";
import { LinkPattern } from "@/types/linkPattern";
import { processLinkPatternsInHtml } from "@/utils/linkPatternUtils";
import { LinkIcon } from "@/components/shared/Icons";

/** Shared empty default, so the display memo is not defeated by a fresh []. */
const NO_LINK_PATTERNS: LinkPattern[] = [];

interface RichTextEditorProps {
  value?: string;
  onChange: (html: string) => void;
  onBlur?: (html: string) => void; // Called when editor loses focus, useful for committing changes
  onSubmit?: (html: string) => void; // Called when Enter is pressed without modifiers (for comment submission)
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  alwaysEditable?: boolean; // When true, always stays in edit mode
  noBorderInViewMode?: boolean; // When true, hides border in view mode
  linkPatterns?: LinkPattern[]; // Link patterns to auto-detect in display mode
}

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  onSubmit,
  placeholder = "Start typing...",
  minHeight = "100px",
  maxHeight = "300px",
  className = "",
  alwaysEditable = false,
  noBorderInViewMode = false,
  linkPatterns = NO_LINK_PATTERNS,
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditing, setIsEditing] = useState(alwaysEditable);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  /**
   * This component's half of the contract with `value`.
   *
   * `domValueRef` is what the contenteditable is believed to hold -- either what
   * the user last typed and we emitted, or what we last wrote into it. Incoming
   * `value` is compared against that and never against innerHTML, which is the
   * browser's own serialisation and differs from the string the parent stores
   * for reasons that have nothing to do with anyone having edited anything.
   *
   * null means "this element is new and holds nothing", which is how a freshly
   * mounted editor gets filled.
   */
  const domValueRef = useRef<string | null>(null);
  /** HTML waiting on the debounce, so blur and unmount can still commit it. */
  const pendingHtmlRef = useRef<string | null>(null);
  /** The last HTML actually handed to onChange, for spotting our own echo. */
  const lastEmittedRef = useRef<string | null>(null);

  // Selection with timestamp for staleness detection
  const savedSelectionRef = useRef<{ range: Range; timestamp: number } | null>(null);
  const SELECTION_STALE_MS = 30000;

  // Refs for race condition fixes
  const pendingInlineCodeRef = useRef<number | null>(null);
  const onChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isToolbarInteractionRef = useRef(false);
  const DEBOUNCE_MS = 150;

  // onChange through a ref, so a debounce can never fire a stale callback
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const fire = useCallback((html: string) => {
    lastEmittedRef.current = html;
    onChangeRef.current(html);
  }, []);

  /** A newly mounted contenteditable holds nothing, whatever `value` says. */
  const attachEditor = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node) domValueRef.current = null;
  }, []);

  /**
   * The one place an edit leaves this component.
   *
   * There were twenty copies of "read innerHTML, call onChange", one per key
   * handler and toolbar button. Typing debounced; every other path fired
   * immediately without cancelling the pending debounce, so typing and then
   * clicking a toolbar button inside 150ms let the older text win. Now every
   * path goes through here, and each one supersedes the last.
   */
  const emitChange = useCallback((immediate = false) => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.innerHTML || "";
    domValueRef.current = html;
    if (onChangeTimeoutRef.current) clearTimeout(onChangeTimeoutRef.current);

    if (immediate) {
      onChangeTimeoutRef.current = null;
      pendingHtmlRef.current = null;
      fire(html);
      return;
    }

    pendingHtmlRef.current = html;
    onChangeTimeoutRef.current = setTimeout(() => {
      onChangeTimeoutRef.current = null;
      pendingHtmlRef.current = null;
      fire(html);
    }, DEBOUNCE_MS);
  }, [fire]);

  /**
   * Put an incoming `value` into the DOM, keeping the caret where it was.
   *
   * The old version refused to do this whenever the editor had focus, and its
   * only trigger was [value, isEditing] -- so a change arriving mid-typing was
   * not deferred, it was dropped for good. That is why a comment box would not
   * empty after Enter: the caret was still in it, so the clear never landed and
   * never came back.
   *
   * Writing while focused is safe now because the caret is saved as a character
   * offset, which survives the nodes it pointed at being replaced.
   */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const next = value ?? "";
    if (next === domValueRef.current) return;

    // `value` lags a debounce behind the DOM, so a keystroke landing while the
    // last change is still in flight makes the parent echo back text the user
    // has already moved past. Writing that would undo the keystroke. An echo is
    // only ignorable while the user is in the box; once focus is gone, whatever
    // the parent says is the truth.
    const focused = document.activeElement === editor;
    if (focused && next === lastEmittedRef.current) return;

    const caret = focused ? getCaretOffset(editor) : null;

    editor.innerHTML = sanitizeHtml(next);
    domValueRef.current = next;

    if (caret !== null) setCaretOffset(editor, caret);
  }, [value, isEditing]);

  // Cleanup on unmount -- committing what is pending rather than dropping it.
  // Closing a note with Escape used to throw away everything typed in the last
  // 150ms, because this cleared the timer without running it.
  useEffect(() => {
    return () => {
      savedSelectionRef.current = null;
      if (pendingInlineCodeRef.current !== null) {
        cancelAnimationFrame(pendingInlineCodeRef.current);
      }
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
        onChangeTimeoutRef.current = null;
      }
      const pending = pendingHtmlRef.current;
      pendingHtmlRef.current = null;
      if (pending !== null) fire(pending);
    };
  }, [fire]);

  /**
   * Bold, italic and underline -- the one place execCommand is still the right
   * tool. It is the only browser primitive that splits and merges inline ranges
   * correctly, and the only one that takes part in the native undo stack; hand
   * rolling it would mean range surgery that breaks Cmd+Z rather than fixing it.
   *
   * styleWithCSS is pinned off so the output is <b>/<i>/<u> in every browser
   * rather than <span style> or <font> depending on the day. The sanitiser's
   * allow-list has those tags; it does not have <font> at all.
   */
  const execFormat = (command: string) => {
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      // Not supported everywhere, and not worth failing the format over.
    }
    document.execCommand(command);
  };

  // DOMPurify plus a full text-node walk, previously re-run on every parent
  // render whether or not anything had changed.
  const sanitizedValue = useMemo(() => sanitizeHtml(value || ""), [value]);
  const displayHtml = useMemo(
    () => processLinkPatternsInHtml(sanitizedValue, linkPatterns),
    [sanitizedValue, linkPatterns],
  );

  const applyLink = () => {
    if (!linkUrl || !editorRef.current || !savedSelectionRef.current) return;

    const { range, timestamp } = savedSelectionRef.current;

    // Check for staleness
    if (Date.now() - timestamp > SELECTION_STALE_MS) {
      setShowLinkInput(false);
      setLinkUrl("");
      savedSelectionRef.current = null;
      return;
    }

    // Validate range is still valid
    if (!isRangeValid(range)) {
      setShowLinkInput(false);
      setLinkUrl("");
      savedSelectionRef.current = null;
      return;
    }

    // Ensure range is within editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setShowLinkInput(false);
      setLinkUrl("");
      savedSelectionRef.current = null;
      return;
    }

    // Sanitize the URL
    const sanitizedUrl = sanitizeUrl(linkUrl);
    if (!sanitizedUrl) {
      setShowLinkInput(false);
      setLinkUrl("");
      savedSelectionRef.current = null;
      return;
    }

    // Restore the selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);

      // Get the selected content with HTML formatting preserved
      const fragment = range.cloneContents();
      const div = document.createElement("div");
      div.appendChild(fragment);
      const selectedHtml = div.innerHTML;
      const selectedText = selection.toString();

      if (selectedText) {
        // Sanitize selectedHtml to prevent XSS, then create the link
        const sanitizedSelectedHtml = sanitizeHtml(selectedHtml);
        // sanitizedUrl has had its scheme checked but not its quotes escaped,
        // so `https://x" onmouseover="...` would still break out of the
        // attribute and into the live contentEditable DOM.
        const linkHtml = `<a href="${escapeHtmlAttribute(sanitizedUrl)}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${sanitizedSelectedHtml}</a>`;

        insertHtmlAtCaret(editorRef.current, linkHtml);
        emitChange();

        // Force re-style links after insertion
        requestAnimationFrame(() => {
          if (editorRef.current) {
            const links = editorRef.current.querySelectorAll("a");
            links.forEach((link) => {
              const anchor = link as HTMLAnchorElement;
              anchor.style.color = "#2563eb";
              anchor.style.textDecoration = "underline";
              anchor.style.cursor = "pointer";
            });
          }
        });
      }
    }
    setShowLinkInput(false);
    setLinkUrl("");
    savedSelectionRef.current = null;
  };

  // Handle link button click from toolbar
  const handleLinkButtonClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = { range: range.cloneRange(), timestamp: Date.now() };

      let linkElement: HTMLAnchorElement | null = null;
      const fragment = range.cloneContents();

      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
        linkElement = container.parentElement.closest("a");
      } else if (container.nodeType === Node.ELEMENT_NODE) {
        linkElement = (container as HTMLElement).closest("a");
      }

      if (!linkElement) {
        const div = document.createElement("div");
        div.appendChild(fragment);
        linkElement = div.querySelector("a");
      }

      if (linkElement && linkElement.href) {
        setLinkUrl(linkElement.href);
      } else {
        setLinkUrl("");
      }
    }
    setShowLinkInput(true);
  };

  // Toolbar button handler - applies formatting and refocuses editor
  const applyFormatting = (command: string) => {
    execFormat(command);
    editorRef.current?.focus();
    emitChange();
  };

  /**
   * Turn the caret's line -- or the selection -- into a block.
   *
   * The text has to be read before the DOM is touched. It used to be read from
   * the selection alone, so clicking Bullet with a collapsed caret, which is how
   * anyone actually uses these buttons, appended an empty block and left the
   * line's text sitting outside it:
   *
   *   keep this text  ->  keep this text<ul><li><br></li></ul>
   */
  const insertBlockElement = (type: "bullet" | "ordered" | "checkbox" | "quote" | "h1" | "h2" | "h3" | "h4") => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    let selectedText = selection?.toString() ?? "";

    if (selectedText !== "" && selection && selection.rangeCount > 0) {
      selection.getRangeAt(0).deleteContents();
    } else {
      const block = getCurrentBlock(editor);
      if (block && block !== editor) {
        // The conversion replaces the block outright, so its text comes along.
        selectedText = block.textContent || "";
      } else {
        // A bare text node with no block around it: nothing gets replaced, so
        // the line has to be emptied here or the text would appear twice.
        const line = getCaretTextNode();
        selectedText = line?.data || "";
        if (line) line.data = "";
      }
    }

    editor.focus();

    switch (type) {
      case "bullet":
        convertToBulletList(editor, selectedText, 0);
        break;
      case "ordered":
        convertToOrderedList(editor, selectedText, 0);
        break;
      case "checkbox":
        convertToCheckboxList(editor, false, selectedText, 0);
        break;
      case "quote":
        convertToBlockquote(editor, selectedText, 0);
        break;
      case "h1":
        convertToHeader(editor, 1, selectedText, 0);
        break;
      case "h2":
        convertToHeader(editor, 2, selectedText, 0);
        break;
      case "h3":
        convertToHeader(editor, 3, selectedText, 0);
        break;
      case "h4":
        convertToHeader(editor, 4, selectedText, 0);
        break;
    }

    emitChange();
  };

  // Handle list indentation from toolbar
  const handleToolbarIndent = (indent: boolean) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (handleListIndent(editorRef.current, indent)) {
      emitChange();
    }
  };

  // Insert inline code at cursor
  const insertInlineCode = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      if (selectedText) {
        // Wrap selected text in code tags
        const code = document.createElement("code");
        code.textContent = selectedText;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(code);

        // Move cursor after code element
        const newRange = document.createRange();
        newRange.setStartAfter(code);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // An empty code element with a zero-width space to sit in, and the
        // caret inside it -- the point of the button is to type code next.
        const code = document.createElement("code");
        code.textContent = "\u200B";
        selection.getRangeAt(0).insertNode(code);
        placeCaretAtEnd(code);
      }

      emitChange();
    }
  };

  return (
    <div className="relative">
      {/* Display Mode - Shows rendered HTML with clickable links and checkboxes */}
      {!isEditing && (
        <div
          ref={displayRef}
          onClick={(e) => {
            // If clicking a checkbox, toggle it and persist the change
            if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
              e.preventDefault();
              e.stopPropagation();

              // Toggle in the source rather than in displayRef, whose HTML has
              // link-pattern anchors in it that were never part of the note.
              const boxes = displayRef.current?.querySelectorAll('input[type="checkbox"]');
              const index = boxes ? [...boxes].indexOf(e.target) : -1;
              const next = index < 0 ? null : toggleCheckboxInHtml(sanitizedValue, index);
              if (next !== null) {
                onChange(next);
                onBlur?.(next);
              }
              return;
            }

            // If clicking a link, open it
            if (e.target instanceof HTMLAnchorElement) {
              e.preventDefault();
              window.open(e.target.href, "_blank");
              return;
            }

            // Otherwise, switch to edit mode (unless alwaysEditable)
            if (!alwaysEditable) {
              setIsEditing(true);
              // Focus after React renders the editor element
              setTimeout(() => {
                editorRef.current?.focus();
              }, 0);
            }
          }}
          dangerouslySetInnerHTML={{ __html: displayHtml }}
          style={{ minHeight, maxHeight }}
          className={`rich-text-content overflow-y-auto text-sm px-3 py-2 rounded whitespace-pre-wrap ${
            noBorderInViewMode ? "border-0" : "border border-zinc-300 dark:border-zinc-600"
          } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
            noBorderInViewMode ? "cursor-pointer" : "cursor-text"
          } empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer ${className}`}
          data-placeholder={placeholder}
        />
      )}

      {/* Edit Mode - Toolbar and ContentEditable */}
      {isEditing && (
        <div className="border border-zinc-300 dark:border-zinc-600 rounded overflow-hidden">
          {/* Formatting Toolbar */}
          <div
            className="rich-text-toolbar flex flex-wrap items-center gap-0.5 px-1.5 py-1 bg-zinc-100 dark:bg-zinc-700 border-b border-zinc-300 dark:border-zinc-600"
            onMouseDown={(e) => {
              e.preventDefault();
              isToolbarInteractionRef.current = true;
              requestAnimationFrame(() => {
                isToolbarInteractionRef.current = false;
              });
            }}
          >
            {/* Text formatting */}
            <button
              onClick={() => applyFormatting("bold")}
              className="p-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Bold (⌘B)"
            >
              B
            </button>
            <button
              onClick={() => applyFormatting("italic")}
              className="p-1.5 text-xs italic text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Italic (⌘I)"
            >
              I
            </button>
            <button
              onClick={() => applyFormatting("underline")}
              className="p-1.5 text-xs underline text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Underline (⌘U)"
            >
              U
            </button>
            <button
              onClick={handleLinkButtonClick}
              className="p-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Link (⌘K)"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-500 mx-1" />

            {/* Lists */}
            <button
              onClick={() => insertBlockElement("bullet")}
              className="p-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Bullet List (type - )"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="2" cy="3" r="1.5" />
                <rect x="5" y="2" width="10" height="2" rx="0.5" />
                <circle cx="2" cy="8" r="1.5" />
                <rect x="5" y="7" width="10" height="2" rx="0.5" />
                <circle cx="2" cy="13" r="1.5" />
                <rect x="5" y="12" width="10" height="2" rx="0.5" />
              </svg>
            </button>
            <button
              onClick={() => insertBlockElement("ordered")}
              className="p-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Numbered List (type 1. )"
            >
              1.
            </button>
            <button
              onClick={() => insertBlockElement("checkbox")}
              className="p-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Checkbox (type [] )"
            >
              ☑
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-500 mx-1" />

            {/* Indent/Outdent */}
            <button
              onClick={() => handleToolbarIndent(false)}
              className="p-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Outdent (Shift+Tab)"
            >
              ⇤
            </button>
            <button
              onClick={() => handleToolbarIndent(true)}
              className="p-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Indent (Tab)"
            >
              ⇥
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-500 mx-1" />

            {/* Block elements */}
            <button
              onClick={() => insertBlockElement("quote")}
              className="p-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Blockquote (type > )"
            >
              ❝
            </button>
            <button
              onClick={insertInlineCode}
              className="p-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Inline Code (type `text`)"
            >
              &lt;/&gt;
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-500 mx-1" />

            {/* Headers */}
            <button
              onClick={() => insertBlockElement("h1")}
              className="p-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Heading 1 (type # )"
            >
              H1
            </button>
            <button
              onClick={() => insertBlockElement("h2")}
              className="p-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Heading 2 (type ## )"
            >
              H2
            </button>
            <button
              onClick={() => insertBlockElement("h3")}
              className="p-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Heading 3 (type ### )"
            >
              H3
            </button>

            {/* Link Input - shown inline when active */}
            {showLinkInput && (
              <>
                <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-500 mx-1" />
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyLink();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setShowLinkInput(false);
                      setLinkUrl("");
                      savedSelectionRef.current = null; // Clear stale selection on cancel
                      editorRef.current?.focus();
                    }
                  }}
                  placeholder="https://..."
                  autoFocus
                  className="text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                />
                <button
                  onClick={applyLink}
                  className="p-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  title="Apply Link"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl("");
                    savedSelectionRef.current = null; // Clear stale selection on cancel
                    editorRef.current?.focus();
                  }}
                  className="p-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded transition-colors"
                  title="Cancel"
                >
                  ✕
                </button>
              </>
            )}
          </div>

          {/* Editor */}
          <div
            ref={attachEditor}
            contentEditable
            suppressContentEditableWarning
            data-testid="rich-text-editor"
            onMouseDown={(e) => {
              // Handle checkbox clicks in edit mode - must use onMouseDown to capture before contenteditable
              if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                e.preventDefault();
                e.stopPropagation();
                // Capture reference to checkbox element
                const checkbox = e.target as HTMLInputElement;
                // Use requestAnimationFrame and validate element is still connected
                requestAnimationFrame(() => {
                  if (checkbox.isConnected) {
                    // Through emitChange, so the DOM and `value` stay agreed --
                    // otherwise the next render writes the editor back out.
                    toggleCheckbox(checkbox, () => emitChange(true), onBlur, editorRef.current);
                  }
                });
                return;
              }

              // Handle link clicks in edit mode
              if (e.target instanceof HTMLAnchorElement) {
                e.preventDefault();
                e.stopPropagation();
                window.open(e.target.href, "_blank");
                return;
              }
            }}
            onClick={(e) => {
              // Prevent native checkbox toggle on click (we handle it in onMouseDown)
              if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              // Prevent link navigation on click (we handle it in onMouseDown)
              if (e.target instanceof HTMLAnchorElement) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
            }}
            onPaste={(e) => {
              const editor = editorRef.current;
              if (!editor) return;

              // Sanitise on the way IN. There was no paste handler at all
              // before, so the browser dropped whatever was on the clipboard
              // straight into the document and it was stored verbatim -- <font>,
              // <img>, <table> and all. None of those are in the allow-list, so
              // the formatting the user could see disappeared the next time the
              // content was rendered.
              e.preventDefault();
              const html = e.clipboardData.getData("text/html");
              const text = e.clipboardData.getData("text/plain");

              const inserted = html
                ? insertHtmlAtCaret(editor, sanitizeHtml(html))
                : insertTextAtCaret(editor, text);
              if (inserted) emitChange();
            }}
            onInput={() => emitChange()}
            onBlur={(e) => {
              // Commit now rather than on the debounce: a modal can close
              // before 150ms is up, and the content has to be saved first.
              emitChange(true);
              if (onBlur && editorRef.current) {
                onBlur(editorRef.current.innerHTML || "");
              }

              // If alwaysEditable, don't exit edit mode
              if (alwaysEditable) {
                return;
              }

              // Check if focus moved to toolbar using relatedTarget (immediate, no race)
              const relatedTarget = e.relatedTarget as HTMLElement | null;
              if (relatedTarget?.closest(".rich-text-toolbar")) {
                return;
              }

              // Also check toolbar interaction flag for additional safety
              if (isToolbarInteractionRef.current) {
                return;
              }

              // Exit edit mode
              setIsEditing(false);
              setShowLinkInput(false);
            }}
          onKeyDown={(e) => {
            // Handle formatting shortcuts
            if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              execFormat("bold");
              emitChange();
              return;
            }
            if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              execFormat("italic");
              emitChange();
              return;
            }
            if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              execFormat("underline");
              emitChange();
              return;
            }
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleLinkButtonClick();
              return;
            }

            // Escape leaves the editor, and blurring is what commits the
            // text. An alwaysEditable editor stays in edit mode -- see onBlur --
            // but it still has to commit, or Escape silently discards typing.
            if (e.key === "Escape") {
              e.currentTarget.blur();
              return;
            }

            // Handle Tab for list indentation
            if (e.key === "Tab" && editorRef.current) {
              const handled = handleListIndent(editorRef.current, !e.shiftKey);
              if (handled) {
                e.preventDefault();
                emitChange();
                return;
              }
            }

            // Handle Backspace at start of structured elements
            if (e.key === "Backspace" && editorRef.current) {
              const handled =
                handleListBackspace(editorRef.current) ||
                handleBlockquoteBackspace(editorRef.current) ||
                handleHeaderBackspace(editorRef.current);
              if (handled) {
                e.preventDefault();
                emitChange();
                return;
              }
            }

            // Handle Enter key
            if (e.key === "Enter") {
              // If onSubmit is provided and no modifiers, submit content
              if (onSubmit && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (editorRef.current) {
                  const html = editorRef.current.innerHTML || "";
                  // Empty the box before handing the text over. Anything still
                  // queued would otherwise fire afterwards and type the
                  // submitted comment straight back in.
                  if (onChangeTimeoutRef.current) {
                    clearTimeout(onChangeTimeoutRef.current);
                    onChangeTimeoutRef.current = null;
                  }
                  pendingHtmlRef.current = null;
                  editorRef.current.innerHTML = "";
                  domValueRef.current = "";
                  onSubmit(html);
                }
                return;
              }

              // Handle Enter in structured elements (without onSubmit or with modifiers)
              if (editorRef.current && !onSubmit) {
                const handled =
                  handleListEnter(editorRef.current) ||
                  handleBlockquoteEnter(editorRef.current) ||
                  handleHeaderEnter(editorRef.current);
                if (handled) {
                  e.preventDefault();
                  emitChange();
                  return;
                }
              }
            }

            // Handle Space key - check for markdown triggers
            if (e.key === " " && editorRef.current) {
              const textBefore = getLineTextBeforeCursor();

              // Check for header patterns: # , ## , ### , ####
              const headerMatch = textBefore.match(/^(#{1,4})$/);
              if (headerMatch) {
                e.preventDefault();
                const level = headerMatch[1].length;
                convertToHeader(editorRef.current, level, "", level);
                emitChange();
                return;
              }

              // Check for bullet list: -
              if (textBefore === "-") {
                e.preventDefault();
                convertToBulletList(editorRef.current, "", 1);
                emitChange();
                return;
              }

              // Check for ordered list: 1.
              const orderedMatch = textBefore.match(/^(\d+\.)$/);
              if (orderedMatch) {
                e.preventDefault();
                convertToOrderedList(editorRef.current, "", orderedMatch[1].length);
                emitChange();
                return;
              }

              // Check for blockquote: >
              if (textBefore === ">") {
                e.preventDefault();
                convertToBlockquote(editorRef.current, "", 1);
                emitChange();
                return;
              }

              // Check for checkbox: [] or [ ]
              if (textBefore === "[]") {
                e.preventDefault();
                convertToCheckboxList(editorRef.current, false, "", 2);
                emitChange();
                return;
              }
              if (textBefore === "[ ]") {
                e.preventDefault();
                convertToCheckboxList(editorRef.current, false, "", 3);
                emitChange();
                return;
              }

              // Check for checked checkbox: [x] or [X]
              if (textBefore === "[x]" || textBefore === "[X]") {
                e.preventDefault();
                convertToCheckboxList(editorRef.current, true, "", 3);
                emitChange();
                return;
              }
            }

            // Handle backtick key - check for inline code completion
            if (e.key === "`" && editorRef.current) {
              // Cancel any pending inline code conversion
              if (pendingInlineCodeRef.current !== null) {
                cancelAnimationFrame(pendingInlineCodeRef.current);
              }

              // Let the character be inserted first, then check for pattern
              pendingInlineCodeRef.current = requestAnimationFrame(() => {
                pendingInlineCodeRef.current = null;
                try {
                  if (editorRef.current) {
                    const converted = convertInlineCode(editorRef.current);
                    if (converted) {
                      emitChange();
                    }
                  }
                } catch (error) {
                  console.error("Failed to convert inline code:", error);
                }
              });
            }
          }}
          style={{ minHeight, maxHeight }}
          className={`overflow-y-auto text-sm px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline ${className}`}
          data-placeholder={placeholder}
        />
        </div>
      )}

    </div>
  );
}
