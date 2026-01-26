import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

// Sanitize HTML content to prevent XSS attacks
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    // Include "div" since contentEditable creates <div> elements for line breaks
    ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "a", "br", "p", "span", "div"],
    ALLOWED_ATTR: ["href", "target", "rel", "style"],
    ALLOW_DATA_ATTR: false,
  });
}

interface RichTextEditorProps {
  value?: string;
  onChange: (html: string) => void;
  onBlur?: (html: string) => void; // Called when editor loses focus, useful for committing changes
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  showKeyboardShortcuts?: boolean;
  alwaysEditable?: boolean; // When true, always stays in edit mode
  noBorderInViewMode?: boolean; // When true, hides border in view mode
}

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Start typing...",
  minHeight = "100px",
  maxHeight = "300px",
  className = "",
  showKeyboardShortcuts = false,
  alwaysEditable = false,
  noBorderInViewMode = false,
}: RichTextEditorProps) {
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditing, setIsEditing] = useState(alwaysEditable);
  const editorRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string | undefined>(value);
  const savedSelectionRef = useRef<Range | null>(null);

  // Update content when value prop changes (e.g., when todo is loaded)
  useEffect(() => {
    // Only update if not currently editing
    if (!isEditing && displayRef.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
    }

    // Update editor content when switching to edit mode
    if (isEditing && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
        lastValueRef.current = value;
      }
    }
  }, [value, isEditing]);

  const applyLink = () => {
    if (linkUrl && editorRef.current && savedSelectionRef.current) {
      // Restore the selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);

        // Get the selected content with HTML formatting preserved
        const range = savedSelectionRef.current;
        const fragment = range.cloneContents();
        const div = document.createElement("div");
        div.appendChild(fragment);
        const selectedHtml = div.innerHTML;
        const selectedText = selection.toString();

        if (selectedText) {
          // Create the HTML for the link, preserving inner HTML formatting
          const fullUrl = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
          const linkHtml = `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${selectedHtml}</a>`;

          // Insert the link HTML without extra space
          document.execCommand("insertHTML", false, linkHtml);

          // Trigger change
          const html = editorRef.current.innerHTML;
          lastValueRef.current = html;
          onChange(html);

          // Force re-style links after insertion
          setTimeout(() => {
            if (editorRef.current) {
              const links = editorRef.current.querySelectorAll("a");
              links.forEach((link) => {
                const anchor = link as HTMLAnchorElement;
                anchor.style.color = "#2563eb";
                anchor.style.textDecoration = "underline";
                anchor.style.cursor = "pointer";
              });
            }
          }, 0);
        }
      }
      setShowLinkInput(false);
      setLinkUrl("");
      setShowFormattingToolbar(false);
      savedSelectionRef.current = null;
    }
  };

  return (
    <div className="relative">
      {/* Display Mode - Shows rendered HTML with clickable links */}
      {!isEditing && (
        <div
          ref={displayRef}
          onClick={(e) => {
            // If clicking a link, open it
            if (e.target instanceof HTMLAnchorElement) {
              e.preventDefault();
              window.open(e.target.href, "_blank");
            } else if (!alwaysEditable) {
              // Otherwise, switch to edit mode (unless alwaysEditable)
              setIsEditing(true);
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.focus();
                }
              }, 0);
            }
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || "") }}
          style={{ minHeight, maxHeight }}
          className={`overflow-y-auto text-sm px-3 py-2 rounded whitespace-pre-wrap ${
            noBorderInViewMode ? "border-0" : "border border-zinc-300 dark:border-zinc-600"
          } bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
            noBorderInViewMode ? "cursor-pointer" : "cursor-text"
          } empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer ${className}`}
          data-placeholder={placeholder}
        />
      )}

      {/* Edit Mode - ContentEditable for editing */}
      {isEditing && (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-testid="rich-text-editor"
          onInput={(_e) => {
            // Call onChange immediately when content changes
            if (editorRef.current) {
              const html = editorRef.current.innerHTML;
              lastValueRef.current = html || "";
              onChange(html || "");
            }
          }}
          onBlur={(_e) => {
            // Always call onBlur callback immediately to save content
            // (important for modal close - content must be saved before unmount)
            if (onBlur && editorRef.current) {
              const html = editorRef.current.innerHTML;
              onBlur(html || "");
            }

            // If alwaysEditable, don't exit edit mode
            if (alwaysEditable) {
              return;
            }

            // Use setTimeout to allow clicking on toolbar/link input
            // This only affects the UI state, not the content saving
            setTimeout(() => {
              // Check if focus moved to link input or toolbar
              const activeEl = document.activeElement;
              if (activeEl && activeEl.closest(".rich-text-toolbar")) {
                return;
              }

              // Update state and exit edit mode
              if (editorRef.current) {
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html || "";
                onChange(html || "");
              }
              setIsEditing(false);
              setShowFormattingToolbar(false);
              setShowLinkInput(false);
            }, 100);
          }}
          onMouseUp={(_e) => {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
              const range = selection.getRangeAt(0);
              savedSelectionRef.current = range.cloneRange();

              const rect = range.getBoundingClientRect();

              setToolbarPosition({
                top: rect.top - 40,
                left: rect.left + rect.width / 2 - 100,
              });
              setShowFormattingToolbar(true);
              setShowLinkInput(false);
            } else {
              setShowFormattingToolbar(false);
              setShowLinkInput(false);
              savedSelectionRef.current = null;
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.execCommand("bold");
            } else if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.execCommand("italic");
            } else if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.execCommand("underline");
            } else if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();

              // Check if selection contains a link
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let linkElement: HTMLAnchorElement | null = null;

                // Get the selected content to check for links
                const fragment = range.cloneContents();

                // Check if the selection itself is entirely within a link
                const container = range.commonAncestorContainer;
                if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
                  linkElement = container.parentElement.closest("a");
                } else if (container.nodeType === Node.ELEMENT_NODE) {
                  linkElement = (container as HTMLElement).closest("a");
                }

                // If not found, check if selection contains a link
                if (!linkElement) {
                  const div = document.createElement("div");
                  div.appendChild(fragment);
                  linkElement = div.querySelector("a");
                }

                // Pre-populate with existing URL if found
                if (linkElement && linkElement.href) {
                  setLinkUrl(linkElement.href);
                } else {
                  setLinkUrl("");
                }
              }

              setShowLinkInput(true);
            } else if (e.key === "Escape") {
              if (!alwaysEditable) {
                e.currentTarget.blur();
              }
            }
          }}
          style={{ minHeight, maxHeight }}
          className={`overflow-y-auto text-sm px-3 py-2 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline ${className}`}
          data-placeholder={placeholder}
        />
      )}

      {/* Formatting Toolbar */}
      {isEditing && showFormattingToolbar && !showLinkInput && (
        <div
          className="rich-text-toolbar fixed z-[9999] flex gap-1 bg-zinc-800 dark:bg-zinc-700 rounded shadow-lg px-2 py-1"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand("bold");
              setShowFormattingToolbar(false);
            }}
            className="px-3 py-1 text-xs font-bold text-white hover:bg-zinc-600 dark:hover:bg-zinc-600 rounded transition-colors"
            title="Bold (⌘B)"
          >
            B
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand("italic");
              setShowFormattingToolbar(false);
            }}
            className="px-3 py-1 text-xs italic text-white hover:bg-zinc-600 dark:hover:bg-zinc-600 rounded transition-colors"
            title="Italic (⌘I)"
          >
            I
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              document.execCommand("underline");
              setShowFormattingToolbar(false);
            }}
            className="px-3 py-1 text-xs underline text-white hover:bg-zinc-600 dark:hover:bg-zinc-600 rounded transition-colors"
            title="Underline (⌘U)"
          >
            U
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();

              // Check if selection contains a link
              const selection = window.getSelection();
              if (selection && savedSelectionRef.current) {
                let linkElement: HTMLAnchorElement | null = null;

                // Get the selected content to check for links
                const range = savedSelectionRef.current;
                const fragment = range.cloneContents();

                // Check if the selection itself is entirely within a link
                const container = range.commonAncestorContainer;
                if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
                  linkElement = container.parentElement.closest("a");
                } else if (container.nodeType === Node.ELEMENT_NODE) {
                  linkElement = (container as HTMLElement).closest("a");
                }

                // If not found, check if selection contains a link
                if (!linkElement) {
                  const div = document.createElement("div");
                  div.appendChild(fragment);
                  linkElement = div.querySelector("a");
                }

                // Pre-populate with existing URL if found
                if (linkElement && linkElement.href) {
                  setLinkUrl(linkElement.href);
                } else {
                  setLinkUrl("");
                }
              }

              setShowLinkInput(true);
            }}
            className="px-3 py-1 text-xs text-white hover:bg-zinc-600 dark:hover:bg-zinc-600 rounded transition-colors"
            title="Link (⌘K)"
          >
            🔗
          </button>
        </div>
      )}

      {/* Link Input */}
      {isEditing && showFormattingToolbar && showLinkInput && (
        <div
          className="rich-text-toolbar fixed z-[9999] flex gap-1 bg-zinc-800 dark:bg-zinc-700 rounded shadow-lg px-2 py-2"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
        >
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
                setShowFormattingToolbar(false);
                // Refocus editor to keep it in edit mode
                if (editorRef.current) {
                  editorRef.current.focus();
                }
              }
            }}
            placeholder="https://example.com"
            autoFocus
            className="text-xs px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              applyLink();
            }}
            className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            title="Apply Link"
          >
            ✓
          </button>
        </div>
      )}

      {showKeyboardShortcuts && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">⌘B</kbd> Bold,{" "}
          <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">⌘I</kbd> Italic,{" "}
          <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">⌘U</kbd> Underline,{" "}
          <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">⌘K</kbd> Link
        </div>
      )}
    </div>
  );
}
