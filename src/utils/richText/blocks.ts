/**
 * Turning the caret's current block into a list, quote or heading.
 *
 * These are the markdown-shortcut conversions: type "- ", "1. ", "[] ", "> "
 * or "## " and the line becomes that block. They were module-level functions
 * inside RichTextEditor.tsx alongside the component that calls them.
 */

import {
  getCurrentBlock,
  getTextAfterTrigger,
  clearCurrentLine,
  getValidatedSelection,
  ensureEditable,
  placeCaretAtEnd,
} from "./selection";

/** Whether a list item holds nothing but whitespace. */
export function isListItemEmpty(li: HTMLLIElement): boolean {
  // For checkbox items, check the span content
  if (li.classList.contains("checkbox-item")) {
    const span = li.querySelector("span");
    return !span || span.textContent?.trim() === "";
  }
  return li.textContent?.trim() === "";
}

// Get the nesting level of a list (0-based)
export function getListNestingLevel(li: HTMLElement): number {
  let level = 0;
  let parent = li.parentElement;
  while (parent) {
    if (parent.tagName === "UL" || parent.tagName === "OL") {
      level++;
    }
    parent = parent.parentElement;
  }
  // Subtract 1 because the immediate parent list counts as level 0
  // Use Math.max to ensure non-negative return value (returns 0 for non-list items)
  return Math.max(0, level - 1);
}

// Create a bullet list item
export function createBulletListItem(text: string = ""): HTMLLIElement {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

// Create a checkbox list item
export function createCheckboxListItem(text: string = "", checked: boolean = false): HTMLLIElement {
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

// Convert current line to a bullet list
export function convertToBulletList(editor: HTMLDivElement, initialText: string = "", triggerLength: number = 0): void {
  const validated = getValidatedSelection();
  if (!validated) return;

  const { range } = validated;

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
    range.insertNode(ul);
  }

  ensureEditable(li);
  placeCaretAtEnd(li);
}

// Convert current line to an ordered list
export function convertToOrderedList(editor: HTMLDivElement, initialText: string = "", triggerLength: number = 0): void {
  const validated = getValidatedSelection();
  if (!validated) return;

  const { range } = validated;

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
    range.insertNode(ol);
  }

  ensureEditable(li);
  placeCaretAtEnd(li);
}

// Convert current line to a checkbox list
export function convertToCheckboxList(editor: HTMLDivElement, checked: boolean = false, initialText: string = "", triggerLength: number = 0): void {
  const validated = getValidatedSelection();
  if (!validated) return;

  const { range } = validated;

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
    range.insertNode(ul);
  }

  // The text lives in the span next to the checkbox, so the caret goes there.
  const span = li.querySelector("span");
  if (span) {
    ensureEditable(span);
    placeCaretAtEnd(span);
  } else {
    placeCaretAtEnd(li);
  }
}

// Convert current line to a blockquote
export function convertToBlockquote(editor: HTMLDivElement, initialText: string = "", triggerLength: number = 0): void {
  const validated = getValidatedSelection();
  if (!validated) return;

  const { range } = validated;

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
    ensureEditable(blockquote);
  }

  if (block && block !== editor) {
    block.replaceWith(blockquote);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    range.insertNode(blockquote);
  }

  placeCaretAtEnd(blockquote);
}

// Convert current line to a header
export function convertToHeader(editor: HTMLDivElement, level: number, initialText: string = "", triggerLength: number = 0): void {
  const validated = getValidatedSelection();
  if (!validated) return;

  const { range } = validated;

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
    ensureEditable(header);
  }

  if (block && block !== editor) {
    block.replaceWith(header);
  } else {
    // Clear the text node content
    clearCurrentLine(textNode);
    range.insertNode(header);
  }

  placeCaretAtEnd(header);
}

