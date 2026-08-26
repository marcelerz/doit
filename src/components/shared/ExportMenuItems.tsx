"use client";

import { ExportFormat } from "@/utils/export";
import { DocumentIcon, TableIcon, CodeIcon } from "@/components/shared/Icons";

interface ExportMenuItemsProps {
  onExport: (format: ExportFormat) => void;
  /** Whether a filter is active, which changes what the footnote promises. */
  hasActiveFilters: boolean;
  /** Plural noun for the footnote, e.g. "todos" or "notes". */
  noun: string;
  /** Extra classes for each row; the more-menu nests these differently. */
  itemClassName?: string;
}

/**
 * The three export formats and the footnote saying what will be exported.
 *
 * Repeated four times: once in each of the two view toolbars' export
 * dropdowns, and again in each of their overflow menus.
 */
export function ExportMenuItems({
  onExport,
  hasActiveFilters,
  noun,
  itemClassName = "",
}: ExportMenuItemsProps) {
  const rowClass = `w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 ${itemClassName}`;

  return (
    <>
      <button onClick={() => onExport("markdown")} className={rowClass}>
        <DocumentIcon className="w-4 h-4" />
        Markdown (.md)
      </button>
      <button onClick={() => onExport("csv")} className={rowClass}>
        <TableIcon className="w-4 h-4" />
        CSV (.csv)
      </button>
      <button onClick={() => onExport("json")} className={rowClass}>
        <CodeIcon className="w-4 h-4" />
        JSON (.json)
      </button>
      <div className="px-4 py-1 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 mt-1">
        {hasActiveFilters ? `Exports filtered ${noun}` : `Exports all ${noun}`}
      </div>
    </>
  );
}
