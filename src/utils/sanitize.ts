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
 * Escape a value being interpolated into a double-quoted HTML attribute.
 *
 * sanitizeUrl checks the scheme but leaves quotes intact, so a URL of
 * `https://x" onmouseover="alert(1)//` still closes the attribute when the
 * surrounding HTML is built as a string by hand.
 *
 * @param value - Raw attribute value
 * @returns The value with characters that could end the attribute escaped
 */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Sanitize a value destined for a CSS `color` declaration.
 *
 * Link-pattern colours are user-entered free text (Settings -> Links) and are
 * interpolated into a style attribute. Without this, a value like
 * `red" onmouseover="alert(1)//` closes the attribute and adds an event
 * handler -- and because link patterns are rendered after DOMPurify has run,
 * nothing downstream would strip it.
 *
 * Accepts hex (#rgb, #rgba, #rrggbb, #rrggbbaa) and bare CSS colour keywords.
 * Anything else returns null and the caller should fall back to its default.
 *
 * @param color - Raw colour string
 * @returns The colour if it is safe to interpolate, otherwise null
 */
export function sanitizeCssColor(color: string | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) return trimmed;
  if (/^[a-z]+$/i.test(trimmed)) return trimmed;
  return null;
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
