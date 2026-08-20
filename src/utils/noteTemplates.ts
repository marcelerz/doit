/**
 * Note Template Utilities
 *
 * Functions for generating templated notes for 1:1 meetings and project meetings.
 */

import { NoteTemplateItem } from "@/types/settings";
import { formatOrdinalDate } from "./dateUtils";

/**
 * Generate title for a 1:1 note
 * Format: "@PersonName 1:1 Note (Jan 23rd 2025)"
 */
export const generateOneOnOneNoteTitle = (personName: string): string => {
  const dateStr = formatOrdinalDate(new Date());
  return `@${personName} 1:1 Note (${dateStr})`;
};

/**
 * Generate title for a meeting note
 * Format: "%ProjectName Meeting Notes (Jan 23rd 2025)"
 */
export const generateMeetingNoteTitle = (projectName: string): string => {
  const dateStr = formatOrdinalDate(new Date());
  return `%${projectName} Meeting Notes (${dateStr})`;
};

/**
 * Generate HTML content for a 1:1 note from template items
 * Creates bold headings with bullet lists for each enabled item
 */
export const generateOneOnOneNoteContent = (items: NoteTemplateItem[]): string => {
  const enabledItems = items.filter((item) => item.enabled);

  if (enabledItems.length === 0) {
    return "<p></p>";
  }

  return enabledItems.map((item) => `<p><strong>${item.label}</strong></p><ul><li></li></ul><p>&nbsp;</p>`).join("");
};

/**
 * Generate HTML content for a meeting note from template items
 * Creates bold headings with bullet lists for each enabled item
 * Special handling for Project Status to include status indicators
 */
export const generateMeetingNoteContent = (items: NoteTemplateItem[]): string => {
  const enabledItems = items.filter((item) => item.enabled);

  if (enabledItems.length === 0) {
    return "<p></p>";
  }

  return enabledItems
    .map((item) => {
      // Special handling for Project Status section
      if (item.id === "project_status") {
        return `<p><strong>${item.label}</strong></p><ul><li>🔴🟡🟢&nbsp;</li></ul><p>&nbsp;</p>`;
      }
      return `<p><strong>${item.label}</strong></p><ul><li></li></ul><p>&nbsp;</p>`;
    })
    .join("");
};
