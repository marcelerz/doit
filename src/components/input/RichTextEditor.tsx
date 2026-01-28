import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { LinkPattern } from "@/types/linkPattern";
import { processLinkPatternsInHtml } from "@/utils/linkPatternUtils";
import { LinkIcon } from "@/components/shared/Icons";

// Sanitize HTML content to prevent XSS attacks
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    // Include "div" since contentEditable creates <div> elements for line breaks
    // Include markdown-like elements: lists, blockquotes, headers, checkboxes, code
    ALLOWED_TAGS: [
      "b", "i", "u", "strong", "em", "a", "br", "p", "span", "div",
      "ul", "ol", "li", "blockquote", "h1", "h2", "h3", "h4", "input", "code"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "style", "type", "checked", "class"],
    ALLOW_DATA_ATTR: true,
  });
}

// ========================================
// Markdown-like Helper Functions
// ========================================

// Get the current block element containing the cursor
function getCurrentBlock(editor: HTMLDivElement): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  let node: Node | null = selection.anchorNode;
  if (!node) return null;

  // Walk up to find the block-level element
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const display = window.getComputedStyle(el).display;
      if (display === "block" || display === "list-item" || el.tagName === "LI") {
        return el;
      }
    }
    node = node.parentNode;
  }
  return null;
}

// Get the text content before cursor on the current line
function getLineTextBeforeCursor(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);
  const node = range.startContainer;

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.substring(0, range.startOffset) || "";
  }
  return "";
}

// Check if cursor is at the start of a block element
function isCursorAtBlockStart(editor: HTMLDivElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (range.startOffset !== 0) return false;

  // Check if we're at the very beginning of a block
  const block = getCurrentBlock(editor);
  if (!block) return false;

  let node: Node | null = range.startContainer;
  while (node && node !== block) {
    const parent: ParentNode | null = node.parentNode;
    if (!parent) break;
    // Check if there are any siblings before this node with content
    let sibling = node.previousSibling;
    while (sibling) {
      if (sibling.textContent && sibling.textContent.length > 0) {
        return false;
      }
      sibling = sibling.previousSibling;
    }
    node = parent as Node;
  }
  return true;
}

// Check if a list item is empty (only whitespace)
function isListItemEmpty(li: HTMLLIElement): boolean {
  // For checkbox items, check the span content
  if (li.classList.contains("checkbox-item")) {
    const span = li.querySelector("span");
    return !span || span.textContent?.trim() === "";
  }
  return li.textContent?.trim() === "";
}

// Get the nesting level of a list (0-based)
function getListNestingLevel(li: HTMLElement): number {
  let level = 0;
  let parent = li.parentElement;
  while (parent) {
    if (parent.tagName === "UL" || parent.tagName === "OL") {
      level++;
    }
    parent = parent.parentElement;
  }
  return level - 1; // Subtract 1 because the immediate parent list counts as level 0
}

// Create a bullet list item
function createBulletListItem(text: string = ""): HTMLLIElement {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

// Create a checkbox list item
function createCheckboxListItem(text: string = "", checked: boolean = false): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "checkbox-item";
  li.setAttribute("data-checked", String(checked));

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;

  const span = document.createElement("span");
  if (checked) {
    span.className = "checkbox-checked";
  }
  span.textContent = text;

  li.appendChild(checkbox);
  li.appendChild(span);
  return li;
}

// Get text content of current line and calculate remaining text after trigger removal
function getTextAfterTrigger(triggerLength: number): { remainingText: string; textNode: Text | null; block: HTMLElement | null } {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { remainingText: "", textNode: null, block: null };
  }

  const range = selection.getRangeAt(0);
  const node = range.startContainer;

  if (node.nodeType === Node.TEXT_NODE) {
    const fullText = node.textContent || "";
    // Text after the trigger (everything after the cursor position, since trigger is before cursor)
    const textAfterCursor = fullText.substring(range.startOffset);
    // Text before the trigger (everything before cursor minus trigger length)
    const textBeforeTrigger = fullText.substring(0, range.startOffset - triggerLength);
    const remainingText = (textBeforeTrigger + textAfterCursor).trim();
    return { remainingText, textNode: node as Text, block: null };
  }

  return { remainingText: "", textNode: null, block: null };
}

// Clear the current line content (text node)
function clearCurrentLine(textNode: Text | null): void {
  if (textNode) {
    textNode.textContent = "";
  }
}

// Convert current line to a bullet list
function convertToBulletList(editor: HTMLDivElement, initialText: string = "", triggerLength: number = 0): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // Get remaining text BEFORE modifying the DOM
  const { remainingText, textNode } = triggerLength > 0
    ? getTextAfterTrigger(triggerLength)
    : { remainingText: initialText, textNode: null };

  const block = getCurrentBlock(editor);
  const ul = document.createElement("ul");
  const li = createBulletListItem(remainingText);
  ul.appendChild(li);

  if (block && block !== editor) {
    block.replaceWith(ul);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    const range = selection.getRangeAt(0);
    range.insertNode(ul);
  }

  // Position cursor inside the li
  const newRange = document.createRange();
  if (!li.firstChild) {
    const newTextNode = document.createTextNode("");
    li.appendChild(newTextNode);
  }
  newRange.setStart(li.firstChild!, li.firstChild!.textContent?.length || 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// Convert current line to an ordered list
function convertToOrderedList(editor: HTMLDivElement, initialText: string = "", triggerLength: number = 0): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // Get remaining text BEFORE modifying the DOM
  const { remainingText, textNode } = triggerLength > 0
    ? getTextAfterTrigger(triggerLength)
    : { remainingText: initialText, textNode: null };

  const block = getCurrentBlock(editor);
  const ol = document.createElement("ol");
  const li = createBulletListItem(remainingText);
  ol.appendChild(li);

  if (block && block !== editor) {
    block.replaceWith(ol);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    const range = selection.getRangeAt(0);
    range.insertNode(ol);
  }

  // Position cursor inside the li
  const newRange = document.createRange();
  if (!li.firstChild) {
    const newTextNode = document.createTextNode("");
    li.appendChild(newTextNode);
  }
  newRange.setStart(li.firstChild!, li.firstChild!.textContent?.length || 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// Convert current line to a checkbox list
function convertToCheckboxList(editor: HTMLDivElement, checked: boolean = false, initialText: string = "", triggerLength: number = 0): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // Get remaining text BEFORE modifying the DOM
  const { remainingText, textNode } = triggerLength > 0
    ? getTextAfterTrigger(triggerLength)
    : { remainingText: initialText, textNode: null };

  const block = getCurrentBlock(editor);
  const ul = document.createElement("ul");
  ul.className = "checklist";

  const li = createCheckboxListItem(remainingText, checked);
  ul.appendChild(li);

  if (block && block !== editor) {
    block.replaceWith(ul);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    const range = selection.getRangeAt(0);
    range.insertNode(ul);
  }

  // Position cursor inside the span - ensure there's a text node to place cursor
  const span = li.querySelector("span");
  const newRange = document.createRange();
  if (span) {
    if (!span.firstChild) {
      // Create empty text node for cursor placement
      const newTextNode = document.createTextNode("");
      span.appendChild(newTextNode);
    }
    newRange.setStart(span.firstChild!, span.firstChild!.textContent?.length || 0);
  } else {
    newRange.setStart(li, li.childNodes.length);
  }
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// Convert current line to a blockquote
function convertToBlockquote(editor: HTMLDivElement, initialText: string = "", triggerLength: number = 0): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // Get remaining text BEFORE modifying the DOM
  const { remainingText, textNode } = triggerLength > 0
    ? getTextAfterTrigger(triggerLength)
    : { remainingText: initialText, textNode: null };

  const block = getCurrentBlock(editor);
  const blockquote = document.createElement("blockquote");

  // If empty, add a BR to prevent collapse, otherwise set the text
  if (remainingText) {
    blockquote.textContent = remainingText;
  } else {
    const br = document.createElement("br");
    blockquote.appendChild(br);
  }

  if (block && block !== editor) {
    block.replaceWith(blockquote);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    const range = selection.getRangeAt(0);
    range.insertNode(blockquote);
  }

  // Position cursor at the start of the blockquote
  const newRange = document.createRange();
  newRange.setStart(blockquote, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// Convert current line to a header
function convertToHeader(editor: HTMLDivElement, level: number, initialText: string = "", triggerLength: number = 0): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  // Get remaining text BEFORE modifying the DOM
  const { remainingText, textNode } = triggerLength > 0
    ? getTextAfterTrigger(triggerLength)
    : { remainingText: initialText, textNode: null };

  const block = getCurrentBlock(editor);
  const header = document.createElement(`h${level}`);

  // If empty, add a BR to prevent collapse, otherwise set the text
  if (remainingText) {
    header.textContent = remainingText;
  } else {
    const br = document.createElement("br");
    header.appendChild(br);
  }

  if (block && block !== editor) {
    block.replaceWith(header);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    const range = selection.getRangeAt(0);
    range.insertNode(header);
  }

  // Position cursor at the start of the header
  const newRange = document.createRange();
  newRange.setStart(header, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

// Handle Enter key in lists
function handleListEnter(editor: HTMLDivElement): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  // Check if we're in a list item
  const li = block.tagName === "LI" ? block as HTMLLIElement : block.closest("li");
  if (!li) return false;

  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return false;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const isChecklist = list.classList.contains("checklist");
  const isEmpty = isListItemEmpty(li as HTMLLIElement);

  // If the list item is empty and there are OTHER items, exit the list
  // But if it's the only item, just create a new item (don't remove the list)
  if (isEmpty && list.children.length > 1) {
    // Create a new paragraph after the list
    const p = document.createElement("div");
    const br = document.createElement("br");
    p.appendChild(br);

    // Remove the empty item and insert paragraph after list
    li.remove();
    list.insertAdjacentElement("afterend", p);

    // Position cursor in the new paragraph
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return true;
  }

  // Create a new list item of the same type
  const newLi = isChecklist
    ? createCheckboxListItem("", false)
    : createBulletListItem("");

  // Insert after current item
  li.insertAdjacentElement("afterend", newLi);

  // Position cursor in the new item
  const newRange = document.createRange();
  if (isChecklist) {
    const span = newLi.querySelector("span");
    if (span) {
      // Add a BR to the span to ensure it's editable
      if (!span.firstChild) {
        const br = document.createElement("br");
        span.appendChild(br);
      }
      newRange.setStart(span, 0);
    } else {
      newRange.setStart(newLi, newLi.childNodes.length);
    }
  } else {
    // Add a text node or BR to ensure it's editable
    if (!newLi.firstChild) {
      const br = document.createElement("br");
      newLi.appendChild(br);
    }
    newRange.setStart(newLi, 0);
  }
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

// Handle Enter key in blockquote
function handleBlockquoteEnter(editor: HTMLDivElement): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  const blockquote = block.tagName === "BLOCKQUOTE" ? block : block.closest("blockquote");
  if (!blockquote) return false;

  // If empty, exit blockquote
  if (blockquote.textContent?.trim() === "") {
    const selection = window.getSelection();
    if (!selection) return false;

    const p = document.createElement("div");
    const br = document.createElement("br");
    p.appendChild(br);
    blockquote.replaceWith(p);

    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return true;
  }

  // Otherwise let default behavior handle it (creates new line inside blockquote)
  return false;
}

// Handle Enter key in headers
function handleHeaderEnter(editor: HTMLDivElement): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  const headerTags = ["H1", "H2", "H3", "H4"];
  if (!headerTags.includes(block.tagName)) return false;

  // Create a new paragraph after the header
  const selection = window.getSelection();
  if (!selection) return false;

  const p = document.createElement("div");
  const br = document.createElement("br");
  p.appendChild(br);
  block.insertAdjacentElement("afterend", p);

  const newRange = document.createRange();
  newRange.setStart(p, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

// Handle Backspace at the start of a list item
function handleListBackspace(editor: HTMLDivElement): boolean {
  if (!isCursorAtBlockStart(editor)) return false;

  const block = getCurrentBlock(editor);
  if (!block) return false;

  const li = block.tagName === "LI" ? block as HTMLLIElement : block.closest("li");
  if (!li) return false;

  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return false;

  const selection = window.getSelection();
  if (!selection) return false;

  // Get the text content
  let textContent = "";
  if (li.classList.contains("checkbox-item")) {
    const span = li.querySelector("span");
    textContent = span?.textContent || "";
  } else {
    textContent = li.textContent || "";
  }

  // Create a paragraph with the content
  const p = document.createElement("div");
  p.textContent = textContent || "";
  if (!p.textContent) {
    const br = document.createElement("br");
    p.appendChild(br);
  }

  // If this is the only item, replace the list
  if (list.children.length === 1) {
    list.replaceWith(p);
  } else {
    // Insert before the list and remove the item
    li.remove();
    list.insertAdjacentElement("beforebegin", p);
  }

  // Position cursor at the start
  const newRange = document.createRange();
  if (p.firstChild) {
    newRange.setStart(p.firstChild, 0);
  } else {
    newRange.setStart(p, 0);
  }
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

// Handle Backspace at the start of a blockquote
function handleBlockquoteBackspace(editor: HTMLDivElement): boolean {
  if (!isCursorAtBlockStart(editor)) return false;

  const block = getCurrentBlock(editor);
  if (!block) return false;

  const blockquote = block.tagName === "BLOCKQUOTE" ? block : block.closest("blockquote");
  if (!blockquote) return false;

  const selection = window.getSelection();
  if (!selection) return false;

  const textContent = blockquote.textContent || "";
  const p = document.createElement("div");
  p.textContent = textContent;
  if (!p.textContent) {
    const br = document.createElement("br");
    p.appendChild(br);
  }

  blockquote.replaceWith(p);

  const newRange = document.createRange();
  if (p.firstChild) {
    newRange.setStart(p.firstChild, 0);
  } else {
    newRange.setStart(p, 0);
  }
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

// Handle Backspace at the start of a header
function handleHeaderBackspace(editor: HTMLDivElement): boolean {
  if (!isCursorAtBlockStart(editor)) return false;

  const block = getCurrentBlock(editor);
  if (!block) return false;

  const headerTags = ["H1", "H2", "H3", "H4"];
  if (!headerTags.includes(block.tagName)) return false;

  const selection = window.getSelection();
  if (!selection) return false;

  const textContent = block.textContent || "";
  const p = document.createElement("div");
  p.textContent = textContent;
  if (!p.textContent) {
    const br = document.createElement("br");
    p.appendChild(br);
  }

  block.replaceWith(p);

  const newRange = document.createRange();
  if (p.firstChild) {
    newRange.setStart(p.firstChild, 0);
  } else {
    newRange.setStart(p, 0);
  }
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

// Handle Tab for list indentation
function handleListIndent(editor: HTMLDivElement, indent: boolean): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  const li = block.tagName === "LI" ? block as HTMLLIElement : block.closest("li");
  if (!li) return false;

  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return false;

  const selection = window.getSelection();
  if (!selection) return false;

  if (indent) {
    // Check nesting level (max 3 levels)
    const currentLevel = getListNestingLevel(li);
    if (currentLevel >= 2) return true; // Already at max depth

    // Get the previous sibling
    const prevSibling = li.previousElementSibling;
    if (!prevSibling) return true; // Can't indent first item

    // Create a new nested list inside the previous sibling
    let nestedList = prevSibling.querySelector(`:scope > ${list.tagName.toLowerCase()}`);
    if (!nestedList) {
      nestedList = document.createElement(list.tagName);
      if (list.classList.contains("checklist")) {
        nestedList.className = "checklist";
      }
      prevSibling.appendChild(nestedList);
    }

    // Move current item to nested list
    nestedList.appendChild(li);
  } else {
    // Outdent: move item up one level
    const parentList = list.parentElement;
    if (!parentList) return true;

    const grandparentLi = parentList.tagName === "LI" ? parentList : parentList.closest("li");
    if (!grandparentLi) return true; // Already at top level

    const grandparentList = grandparentLi.parentElement;
    if (!grandparentList) return true;

    // Insert after the grandparent li
    grandparentList.insertBefore(li, grandparentLi.nextSibling);

    // Remove empty nested list
    if (list.children.length === 0) {
      list.remove();
    }
  }

  // Restore cursor position
  const newRange = document.createRange();
  if (li.classList.contains("checkbox-item")) {
    const span = li.querySelector("span");
    if (span && span.firstChild) {
      newRange.setStart(span.firstChild, 0);
    } else if (span) {
      newRange.setStart(span, 0);
    } else {
      newRange.setStart(li, li.childNodes.length);
    }
  } else if (li.firstChild) {
    newRange.setStart(li.firstChild, 0);
  } else {
    newRange.setStart(li, 0);
  }
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

// Convert inline code with backticks (`) - standard markdown style
function convertInlineCode(_editor: HTMLDivElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return false;

  const text = node.textContent || "";
  const cursorPos = range.startOffset;

  // Look for pattern: `text` (backticks)
  // The cursor is just after the closing backtick
  const textUpToCursor = text.substring(0, cursorPos);
  const match = textUpToCursor.match(/`([^`]+)`$/);
  if (!match) return false;

  const codeText = match[1];
  const matchStart = cursorPos - match[0].length;

  // Create the code element
  const code = document.createElement("code");
  code.textContent = codeText;

  // Replace the matched text with the code element
  const beforeText = document.createTextNode(text.substring(0, matchStart));
  const afterText = document.createTextNode(text.substring(cursorPos));

  const parent = node.parentNode;
  if (!parent) return false;

  parent.insertBefore(beforeText, node);
  parent.insertBefore(code, node);
  parent.insertBefore(afterText, node);
  parent.removeChild(node);

  // Position cursor after the code element
  const newRange = document.createRange();
  newRange.setStartAfter(code);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  return true;
}

// Toggle checkbox state
function toggleCheckbox(
  checkbox: HTMLInputElement,
  onChange: (html: string) => void,
  onBlur?: (html: string) => void,
  container?: HTMLElement | null
): void {
  const newChecked = !checkbox.checked;

  // Set both the property AND the attribute for proper HTML persistence
  checkbox.checked = newChecked;
  if (newChecked) {
    checkbox.setAttribute("checked", "checked");
  } else {
    checkbox.removeAttribute("checked");
  }

  const li = checkbox.closest("li");
  if (li) {
    li.setAttribute("data-checked", String(newChecked));
    const span = li.querySelector("span");
    if (span) {
      if (newChecked) {
        span.classList.add("checkbox-checked");
      } else {
        span.classList.remove("checkbox-checked");
      }
    }
  }

  // Trigger onChange with updated HTML to persist the change
  if (container) {
    const html = container.innerHTML;
    onChange(html);
    if (onBlur) {
      onBlur(html);
    }
  }
}

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
  linkPatterns = [],
}: RichTextEditorProps) {
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
      savedSelectionRef.current = null;
    }
  };

  // Handle link button click from toolbar
  const handleLinkButtonClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = range.cloneRange();

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
    document.execCommand(command);
    editorRef.current?.focus();
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  };

  // Toolbar button handler - inserts block element at cursor, preserving selected text
  const insertBlockElement = (type: "bullet" | "ordered" | "checkbox" | "quote" | "h1" | "h2" | "h3" | "h4") => {
    if (!editorRef.current) return;

    // Get selected text before focusing
    const selection = window.getSelection();
    let selectedText = "";
    if (selection && selection.toString()) {
      selectedText = selection.toString();
      // Delete the selected text first
      if (selection.rangeCount > 0) {
        selection.getRangeAt(0).deleteContents();
      }
    }

    // Focus editor
    editorRef.current.focus();

    switch (type) {
      case "bullet":
        convertToBulletList(editorRef.current, selectedText, 0);
        break;
      case "ordered":
        convertToOrderedList(editorRef.current, selectedText, 0);
        break;
      case "checkbox":
        convertToCheckboxList(editorRef.current, false, selectedText, 0);
        break;
      case "quote":
        convertToBlockquote(editorRef.current, selectedText, 0);
        break;
      case "h1":
        convertToHeader(editorRef.current, 1, selectedText, 0);
        break;
      case "h2":
        convertToHeader(editorRef.current, 2, selectedText, 0);
        break;
      case "h3":
        convertToHeader(editorRef.current, 3, selectedText, 0);
        break;
      case "h4":
        convertToHeader(editorRef.current, 4, selectedText, 0);
        break;
    }

    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  // Handle list indentation from toolbar
  const handleToolbarIndent = (indent: boolean) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const handled = handleListIndent(editorRef.current, indent);
    if (handled) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
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
        // Insert empty code element with placeholder
        document.execCommand("insertHTML", false, "<code>\u200B</code>");
      }

      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
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
              toggleCheckbox(e.target, onChange, onBlur, displayRef.current);
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
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.focus();
                }
              }, 0);
            }
          }}
          dangerouslySetInnerHTML={{
            __html: processLinkPatternsInHtml(sanitizeHtml(value || ""), linkPatterns),
          }}
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
            onMouseDown={(e) => e.preventDefault()}
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
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-testid="rich-text-editor"
            onMouseDown={(e) => {
              // Handle checkbox clicks in edit mode - must use onMouseDown to capture before contenteditable
              if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
                e.preventDefault();
                e.stopPropagation();
                // Toggle the checkbox after a microtask to ensure DOM is ready
                setTimeout(() => {
                  toggleCheckbox(e.target as HTMLInputElement, onChange, onBlur, editorRef.current);
                }, 0);
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
                setShowLinkInput(false);
              }, 100);
            }}
          onKeyDown={(e) => {
            // Handle formatting shortcuts
            if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.execCommand("bold");
              return;
            }
            if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.execCommand("italic");
              return;
            }
            if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              document.execCommand("underline");
              return;
            }
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleLinkButtonClick();
              return;
            }

            // Handle Escape
            if (e.key === "Escape") {
              if (!alwaysEditable) {
                e.currentTarget.blur();
              }
              return;
            }

            // Handle Tab for list indentation
            if (e.key === "Tab" && editorRef.current) {
              const handled = handleListIndent(editorRef.current, !e.shiftKey);
              if (handled) {
                e.preventDefault();
                // Trigger onChange after modifying DOM
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
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
                // Trigger onChange after modifying DOM
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }
            }

            // Handle Enter key
            if (e.key === "Enter") {
              // If onSubmit is provided and no modifiers, submit content
              if (onSubmit && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (editorRef.current) {
                  const html = editorRef.current.innerHTML;
                  onSubmit(html || "");
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
                  // Trigger onChange after modifying DOM
                  const html = editorRef.current.innerHTML;
                  lastValueRef.current = html;
                  onChange(html);
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
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }

              // Check for bullet list: -
              if (textBefore === "-") {
                e.preventDefault();
                convertToBulletList(editorRef.current, "", 1);
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }

              // Check for ordered list: 1.
              const orderedMatch = textBefore.match(/^(\d+\.)$/);
              if (orderedMatch) {
                e.preventDefault();
                convertToOrderedList(editorRef.current, "", orderedMatch[1].length);
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }

              // Check for blockquote: >
              if (textBefore === ">") {
                e.preventDefault();
                convertToBlockquote(editorRef.current, "", 1);
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }

              // Check for checkbox: [] or [ ]
              if (textBefore === "[]") {
                e.preventDefault();
                convertToCheckboxList(editorRef.current, false, "", 2);
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }
              if (textBefore === "[ ]") {
                e.preventDefault();
                convertToCheckboxList(editorRef.current, false, "", 3);
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }

              // Check for checked checkbox: [x] or [X]
              if (textBefore === "[x]" || textBefore === "[X]") {
                e.preventDefault();
                convertToCheckboxList(editorRef.current, true, "", 3);
                const html = editorRef.current.innerHTML;
                lastValueRef.current = html;
                onChange(html);
                return;
              }
            }

            // Handle backtick key - check for inline code completion
            if (e.key === "`" && editorRef.current) {
              // Let the character be inserted first, then check for pattern
              setTimeout(() => {
                if (editorRef.current) {
                  const converted = convertInlineCode(editorRef.current);
                  if (converted) {
                    const html = editorRef.current.innerHTML;
                    lastValueRef.current = html;
                    onChange(html);
                  }
                }
              }, 0);
            }
          }}
          style={{ minHeight, maxHeight }}
          className={`overflow-y-auto text-sm px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline ${className}`}
          data-placeholder={placeholder}
        />
        </div>
      )}

    </div>
  );
}
