import { LinkPattern } from "@/types/linkPattern";

// Node type constants (same as DOM Node constants)
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/**
 * Processes HTML content and converts link patterns (e.g., "T12345") to clickable links.
 * This is used by RichTextEditor and Comments to auto-detect patterns in rich text content.
 *
 * SECURITY NOTE: This function expects pre-sanitized HTML input (via DOMPurify).
 * All user-generated content should be sanitized before calling this function.
 * The output is safe because:
 * 1. Input is pre-sanitized by DOMPurify in the calling component
 * 2. All pattern matches and URLs are escaped using escapeHtml()
 * 3. Only link patterns from the app's settings are processed
 *
 * The function carefully:
 * - Only processes text nodes (not inside existing <a> tags)
 * - Preserves all existing HTML formatting (bold, italic, etc.)
 * - Returns the processed HTML with link patterns converted to <a> tags
 */
export function processLinkPatternsInHtml(html: string, linkPatterns: LinkPattern[]): string {
  if (!html || linkPatterns.length === 0) {
    return html;
  }

  // Server-side: return as-is (no DOM available)
  if (typeof window === "undefined") {
    return html;
  }

  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Process all text nodes that are not inside <a> tags
  processTextNodes(temp, linkPatterns);

  return temp.innerHTML;
}

/**
 * Recursively processes text nodes in an element, converting link patterns to links.
 * Skips any text nodes that are inside <a> tags.
 */
function processTextNodes(element: Node, linkPatterns: LinkPattern[]): void {
  // Don't process inside anchor tags
  if (element.nodeName === "A") {
    return;
  }

  // Process child nodes (make a copy of childNodes since we'll be modifying the DOM)
  const childNodes = Array.from(element.childNodes);

  for (const child of childNodes) {
    if (child.nodeType === TEXT_NODE) {
      const text = child.textContent || "";
      const processed = processTextForPatterns(text, linkPatterns);

      if (processed !== text) {
        // Replace the text node with processed HTML
        const span = document.createElement("span");
        span.innerHTML = processed;

        // Replace the text node with the span's children
        const parent = child.parentNode;
        if (parent) {
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, child);
          }
          parent.removeChild(child);
        }
      }
    } else if (child.nodeType === ELEMENT_NODE) {
      // Recursively process element nodes
      processTextNodes(child, linkPatterns);
    }
  }
}

/**
 * Processes plain text and replaces link patterns with HTML anchor tags.
 */
function processTextForPatterns(text: string, linkPatterns: LinkPattern[]): string {
  // Find all matches across all patterns
  const matches: {
    start: number;
    end: number;
    text: string;
    url: string;
    color?: string;
  }[] = [];

  for (const linkPattern of linkPatterns) {
    // Create regex: prefix followed by at least 4 digits (e.g., "T\d{4,}")
    const linkRegex = new RegExp(`${escapeRegex(linkPattern.prefix)}\\d{4,}`, "gi");
    const patternMatches = text.matchAll(linkRegex);

    for (const match of patternMatches) {
      if (match.index !== undefined) {
        // Extract the ID part (everything after the prefix)
        const id = match[0].slice(linkPattern.prefix.length);
        // Replace {id} in the URL template with the actual ID
        const url = linkPattern.urlTemplate.replace("{id}", id);

        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          url,
          color: linkPattern.color,
        });
      }
    }
  }

  if (matches.length === 0) {
    return text;
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build the result string
  let result = "";
  let lastIndex = 0;

  for (const match of matches) {
    // Add text before the match
    if (match.start > lastIndex) {
      result += escapeHtml(text.slice(lastIndex, match.start));
    }

    // Add the link
    const colorStyle = match.color ? `color: ${match.color};` : "color: #3b82f6;";
    result += `<a href="${escapeHtml(match.url)}" target="_blank" rel="noopener noreferrer" style="${colorStyle} font-weight: bold; text-decoration: underline;" title="Opens in new tab">${escapeHtml(match.text)}</a>`;

    lastIndex = match.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }

  return result;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Escapes HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
