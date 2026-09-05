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

/** Collapse the selection onto one position. */
function collapseTo(selection: Selection, node: Node, offset: number): void {
  const range = document.createRange();
  try {
    range.setStart(node, offset);
  } catch {
    return;
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * The caret as a character offset over the editor's text, or null if the caret
 * is not in this editor.
 *
 * A saved Range holds node references, so any mutation between saving and
 * restoring invalidates it -- which is why this editor carries isConnected
 * guards on every stored selection and a thirty-second staleness rule on the
 * link dialog. An offset survives the nodes being replaced wholesale, which is
 * exactly what happens when a new value arrives while the user is typing.
 *
 * Counted the same way the DOM counts it: text only. Element boundaries and
 * <br> contribute nothing, so a caret at the start of the second paragraph and
 * one at the end of the first share an offset. Both restore to a position on
 * the same character, which is what matters for keeping the user's place.
 */
export function getCaretOffset(editor: HTMLElement): number | null {
  const validated = getValidatedSelection();
  if (!validated) return null;

  const { range } = validated;
  if (!editor.contains(range.startContainer)) return null;

  const measure = document.createRange();
  measure.selectNodeContents(editor);
  try {
    measure.setEnd(range.startContainer, range.startOffset);
  } catch {
    return null;
  }
  return measure.toString().length;
}

/**
 * Put the caret back at a character offset, clamping past the end rather than
 * giving up -- content can shrink between the save and the restore.
 */
export function setCaretOffset(editor: HTMLElement, offset: number): void {
  const selection = window.getSelection();
  if (!selection) return;

  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(0, offset);
  let last: Text | null = null;

  let node = walker.nextNode() as Text | null;
  while (node) {
    if (remaining <= node.data.length) {
      collapseTo(selection, node, remaining);
      return;
    }
    remaining -= node.data.length;
    last = node;
    node = walker.nextNode() as Text | null;
  }

  if (last) {
    collapseTo(selection, last, last.data.length);
  } else {
    collapseTo(selection, editor, 0);
  }
}

/**
 * Put the caret after an element's text, so typing continues the line.
 *
 * The block conversions each rebuild their block and then have to say where the
 * caret went. They said it five different ways, and two of them said "at the
 * start", which is why typing "# " in front of existing text used to leave the
 * next character before it.
 */
export function placeCaretAtEnd(element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) return;

  const last = element.lastChild;
  if (last && last.nodeType === Node.TEXT_NODE) {
    collapseTo(selection, last, last.textContent?.length || 0);
  } else if (last && last.nodeName === "BR") {
    // A lone <br> is the placeholder keeping an empty block from collapsing.
    // The caret belongs before it, or the block renders one line too tall.
    collapseTo(selection, element, element.childNodes.length - 1);
  } else {
    collapseTo(selection, element, element.childNodes.length);
  }
}
