/**
 * Sanitization Utilities
 *
 * Common sanitization functions for HTML content and URLs.
 * Consolidated from RichTextEditor.tsx and Comments.tsx.
 */

import DOMPurify from "dompurify";

/**
 * Allowed HTML tags for rich text content
 * Includes markdown-like elements: lists, blockquotes, headers, checkboxes, code
 */
const ALLOWED_TAGS = [
  "b",
  "i",
  "u",
  "strong",
  "em",
  "a",
  "br",
  "p",
  "span",
  "div",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "input",
  "code",
];

/**
 * Allowed HTML attributes for rich text content
 */
const ALLOWED_ATTR = ["href", "target", "rel", "style", "type", "checked", "class"];

/**
 * Sanitize HTML content to prevent XSS attacks
 * Used by: RichTextEditor, Comments
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}

/**
 * Dangerous URL protocols to block
 */
const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:"];

/**
 * Allowed URL protocols
 */
const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

/**
 * Sanitize a URL to prevent XSS and other malicious URLs
 * Used by: RichTextEditor for link creation
 *
 * @param url - Raw URL string to sanitize
 * @returns Sanitized URL string or null if invalid/dangerous
 */
export function sanitizeUrl(url: string): string | null {
  if (!url?.trim()) return null;
  const lower = url.trim().toLowerCase();

  // Block dangerous protocols
  if (DANGEROUS_PROTOCOLS.some((p) => lower.startsWith(p))) return null;

  // If no protocol specified, add https://
  if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)) {
    return `https://${url.trim()}`;
  }

  // Only allow specific protocols
  if (!ALLOWED_PROTOCOLS.some((p) => lower.startsWith(p))) return null;

  return url.trim();
}

/**
 * Check if HTML content is effectively empty (only whitespace)
 * Uses DOMPurify to safely sanitize before checking content.
 * Used by: Comments for validating comment content
 *
 * @param html - HTML string to check
 * @returns True if the content is empty or whitespace-only
 */
export function isHtmlEmpty(html: string): boolean {
  if (!html) return true;
  if (typeof window === "undefined") return html.trim().length === 0;
  // Safely extract text content using DOMPurify to sanitize first
  const sanitized = sanitizeHtml(html);
  const temp = document.createElement("div");
  // Using sanitized HTML is safe here because DOMPurify has already removed any malicious content
  temp.innerHTML = sanitized;
  const text = temp.textContent || "";
  return text.trim().length === 0;
}
