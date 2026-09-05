/**
 * What Enter, Backspace and Tab do inside a rich text block.
 *
 * Each returns true when it handled the key, so the editor's keydown can try
 * them in order and fall through to the browser's default when none applies.
 * They were module-level functions inside RichTextEditor.tsx; nothing here
 * touches React.
 */

import {
  getValidatedSelection,
  ensureEditable,
  getCurrentBlock,
  isCursorAtBlockStart,
  setCaretOffset,
} from "./selection";
import {
  isListItemEmpty,
  getListNestingLevel,
  createBulletListItem,
  createCheckboxListItem,
} from "./blocks";

export function synchronizeCheckboxState(
  checked: boolean,
  checkbox: HTMLInputElement,
  li: HTMLLIElement,
  span: HTMLSpanElement | null
): boolean {
  try {
    checkbox.checked = checked;
    if (checked) {
      checkbox.setAttribute("checked", "checked");
    } else {
      checkbox.removeAttribute("checked");
    }
    li.setAttribute("data-checked", String(checked));
    if (span) span.classList.toggle("checkbox-checked", checked);
    return true;
  } catch {
    return false;
  }
}

// Handle Enter key in lists
export function handleListEnter(editor: HTMLDivElement): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  // Check if we're in a list item
  const li = block.tagName === "LI" ? block as HTMLLIElement : block.closest("li");
  if (!li) return false;

  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return false;

  const validated = getValidatedSelection();
  if (!validated) return false;

  const { selection } = validated;
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
export function handleBlockquoteEnter(editor: HTMLDivElement): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  const blockquote = block.tagName === "BLOCKQUOTE" ? block : block.closest("blockquote");
  if (!blockquote) return false;

  // If empty, exit blockquote
  if (blockquote.textContent?.trim() === "") {
    const validated = getValidatedSelection();
    if (!validated) return false;

    const { selection } = validated;
    const p = document.createElement("div");
    ensureEditable(p);
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
export function handleHeaderEnter(editor: HTMLDivElement): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  const headerTags = ["H1", "H2", "H3", "H4"];
  if (!headerTags.includes(block.tagName)) return false;

  // Create a new paragraph after the header
  const validated = getValidatedSelection();
  if (!validated) return false;

  const { selection } = validated;
  const p = document.createElement("div");
  ensureEditable(p);
  block.insertAdjacentElement("afterend", p);

  const newRange = document.createRange();
  newRange.setStart(p, 0);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  return true;
}

/**
 * A plain block holding the same content -- the nodes, not their text.
 *
 * These unwraps used to rebuild the block with `div.textContent =
 * source.textContent`, which keeps the characters and discards every element
 * around them. Backspacing out of "<b>Bold</b> tail" gave back "Bold tail" with
 * the bold gone, and the same for links, code spans and italics.
 */
function unwrapToBlock(source: Element | null): HTMLDivElement {
  const block = document.createElement("div");
  while (source?.firstChild) {
    block.appendChild(source.firstChild);
  }
  ensureEditable(block);
  return block;
}

// Handle Backspace at the start of a list item
export function handleListBackspace(editor: HTMLDivElement): boolean {
  if (!isCursorAtBlockStart(editor)) return false;

  const block = getCurrentBlock(editor);
  if (!block) return false;

  const li = block.tagName === "LI" ? block as HTMLLIElement : block.closest("li");
  if (!li) return false;

  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return false;

  const validated = getValidatedSelection();
  if (!validated) return false;

  // A checkbox item keeps its text in the span beside the input, and the input
  // itself has no business surviving the unwrap.
  const p = unwrapToBlock(li.classList.contains("checkbox-item") ? li.querySelector("span") : li);

  // If this is the only item, replace the list
  if (list.children.length === 1) {
    list.replaceWith(p);
  } else {
    // Insert before the list and remove the item
    li.remove();
    list.insertAdjacentElement("beforebegin", p);
  }

  setCaretOffset(p, 0);
  return true;
}

// Handle Backspace at the start of a blockquote
export function handleBlockquoteBackspace(editor: HTMLDivElement): boolean {
  if (!isCursorAtBlockStart(editor)) return false;

  const block = getCurrentBlock(editor);
  if (!block) return false;

  const blockquote = block.tagName === "BLOCKQUOTE" ? block : block.closest("blockquote");
  if (!blockquote) return false;

  const validated = getValidatedSelection();
  if (!validated) return false;

  const p = unwrapToBlock(blockquote);
  blockquote.replaceWith(p);

  setCaretOffset(p, 0);
  return true;
}

// Handle Backspace at the start of a header
export function handleHeaderBackspace(editor: HTMLDivElement): boolean {
  if (!isCursorAtBlockStart(editor)) return false;

  const block = getCurrentBlock(editor);
  if (!block) return false;

  const headerTags = ["H1", "H2", "H3", "H4"];
  if (!headerTags.includes(block.tagName)) return false;

  const validated = getValidatedSelection();
  if (!validated) return false;

  const p = unwrapToBlock(block);
  block.replaceWith(p);

  setCaretOffset(p, 0);
  return true;
}

// Handle Tab for list indentation
export function handleListIndent(editor: HTMLDivElement, indent: boolean): boolean {
  const block = getCurrentBlock(editor);
  if (!block) return false;

  const li = block.tagName === "LI" ? block as HTMLLIElement : block.closest("li");
  if (!li) return false;

  const list = li.parentElement;
  if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return false;

  const validated = getValidatedSelection();
  if (!validated) return false;

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

  // Restore cursor position - re-acquire selection after DOM mutation
  const freshSelection = window.getSelection();
  if (!freshSelection) return true;

  const newRange = document.createRange();
  if (li.classList.contains("checkbox-item")) {
    const span = li.querySelector("span");
    if (span?.firstChild) {
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
  freshSelection.removeAllRanges();
  freshSelection.addRange(newRange);
  return true;
}

// Convert inline code with backticks (`) - standard markdown style
export function convertInlineCode(_editor: HTMLDivElement): boolean {
  const validated = getValidatedSelection();
  if (!validated) return false;

  const { selection, range } = validated;
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

  try {
    parent.insertBefore(beforeText, node);
    parent.insertBefore(code, node);
    parent.insertBefore(afterText, node);
    parent.removeChild(node);
  } catch {
    // DOM operation failed, likely due to node being detached
    return false;
  }

  // Position cursor after the code element
  const newRange = document.createRange();
  newRange.setStartAfter(code);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  return true;
}

/**
 * Toggle the nth checkbox inside an HTML string, returning the new string.
 *
 * View mode does not render the stored content directly: link patterns are
 * turned into anchors first. Toggling a checkbox in that rendered DOM and
 * saving what comes back bakes those generated <a> elements into the stored
 * note for good, so a pattern that is later edited or removed leaves dead links
 * behind. Working on the source instead keeps the two apart.
 *
 * Indexing by position is safe because link-pattern processing only rewrites
 * text nodes -- it never adds or removes an <input>, so the nth checkbox on
 * screen is the nth checkbox in the source.
 */
export function toggleCheckboxInHtml(html: string, index: number): string | null {
  const container = document.createElement("div");
  container.innerHTML = html;

  const checkbox = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[index];
  if (!checkbox) return null;

  const li = checkbox.closest("li") as HTMLLIElement | null;
  const checked = !checkbox.checked;

  if (li) {
    synchronizeCheckboxState(checked, checkbox, li, li.querySelector("span"));
  } else if (checked) {
    checkbox.setAttribute("checked", "checked");
  } else {
    checkbox.removeAttribute("checked");
  }

  return container.innerHTML;
}

// Toggle checkbox state
export function toggleCheckbox(
  checkbox: HTMLInputElement,
  onChange: (html: string) => void,
  onBlur?: (html: string) => void,
  container?: HTMLElement | null
): void {
  const newChecked = !checkbox.checked;
  const li = checkbox.closest("li") as HTMLLIElement | null;

  if (li) {
    const span = li.querySelector("span") as HTMLSpanElement | null;
    synchronizeCheckboxState(newChecked, checkbox, li, span);
  } else {
    // Fallback if no li found
    checkbox.checked = newChecked;
    if (newChecked) {
      checkbox.setAttribute("checked", "checked");
    } else {
      checkbox.removeAttribute("checked");
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
