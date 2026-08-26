/**
 * Selection and block-position helpers for the rich text editor.
 *
 * RichTextEditor.tsx was 1,721 lines: 894 of module-level DOM helpers ahead of
 * an 827-line component. None of these touch React -- they read and move the
 * caret inside a contenteditable -- so they belong here, where they can be
 * tested without mounting an editor.
 */

export interface ValidatedSelection {
  selection: Selection;
  range: Range;
}

export function getValidatedSelection(): ValidatedSelection | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  try {
    const range = selection.getRangeAt(0);
    if (!range.startContainer.isConnected || !range.endContainer.isConnected) {
      return null;
    }
    return { selection, range };
  } catch {
    return null;
  }
}

export function isRangeValid(range: Range | null): boolean {
  if (!range) return false;
  try {
    return range.startContainer.isConnected && range.endContainer.isConnected;
  } catch {
    return false;
  }
}

export function ensureEditable(element: HTMLElement): void {
  if (!element.firstChild) {
    element.appendChild(document.createElement("br"));
  }
}

export function getCurrentBlock(editor: HTMLDivElement): HTMLElement | null {
  const validated = getValidatedSelection();
  if (!validated) return null;

  let node: Node | null = validated.selection.anchorNode;
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

/** Text on the current line up to the caret. */
export function getLineTextBeforeCursor(): string {
  const validated = getValidatedSelection();
  if (!validated) return "";

  const { range } = validated;
  const node = range.startContainer;

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.substring(0, range.startOffset) || "";
  }
  return "";
}

/** Whether the caret sits at the very start of its block. */
export function isCursorAtBlockStart(editor: HTMLDivElement): boolean {
  const validated = getValidatedSelection();
  if (!validated) return false;

  const { range } = validated;
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

/** Line text minus the markdown trigger the caret just completed. */
export function getTextAfterTrigger(triggerLength: number): { remainingText: string; textNode: Text | null; block: HTMLElement | null } {
  const validated = getValidatedSelection();
  if (!validated) {
    return { remainingText: "", textNode: null, block: null };
  }

  const { range } = validated;
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

/** Empty the caret's text node. */
export function clearCurrentLine(textNode: Text | null): void {
  if (textNode) {
    textNode.textContent = "";
  }
}
