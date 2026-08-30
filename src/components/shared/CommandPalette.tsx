"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { globalSearch, labelForKind, SearchResult, GlobalSearchCollections } from "@/utils/globalSearch";
import { SearchIcon } from "@/components/shared/Icons";
import { useDialogFocus } from "@/hooks/useDialogFocus";

/**
 * One search box over everything, on Cmd/Ctrl+K.
 *
 * Not built on the shared Modal: that centres a panel and traps focus on its
 * first focusable child, and a palette needs the input focused and the list
 * anchored under it. It reuses the same focus hook Modal does, so the dialog
 * semantics are identical.
 */

/** Stable ids so aria-activedescendant can name the highlighted row. */
const optionId = (index: number) => `command-palette-option-${index}`;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  collections: GlobalSearchCollections;
  onSelect: (result: SearchResult) => void;
}

export function CommandPalette({ isOpen, ...rest }: CommandPaletteProps) {
  // The body is a separate component so that opening the palette mounts it
  // fresh. Keeping the state out here would mean resetting the query and the
  // highlight in effects, which is both more code and a cascading render.
  if (!isOpen) return null;
  return <CommandPaletteContent {...rest} />;
}

function CommandPaletteContent({ onClose, collections, onSelect }: Omit<CommandPaletteProps, "isOpen">) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The input is the first focusable inside, so this lands focus there.
  useDialogFocus(true, dialogRef);

  const results = useMemo(() => globalSearch(query, collections), [query, collections]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const choose = (result: SearchResult | undefined) => {
    if (!result) return;
    onSelect(result);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((previous) => (results.length === 0 ? 0 : (previous + 1) % results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((previous) => (results.length === 0 ? 0 : (previous - 1 + results.length) % results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[highlighted]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search everything"
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <SearchIcon className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // The list changes on every keystroke, so index 3 of the old
              // results is a different thing entirely.
              setHighlighted(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, people, projects, sprints, reviews…"
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="command-palette-results"
            aria-activedescendant={results.length > 0 ? optionId(highlighted) : undefined}
            className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none text-sm"
          />
          <kbd className="hidden sm:block px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-500">
            Esc
          </kbd>
        </div>

        {query.trim() !== "" && (
          <ul
            id="command-palette-results"
            ref={listRef}
            role="listbox"
            aria-label="Search results"
            className="max-h-[50vh] overflow-y-auto py-1"
          >
            {results.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Nothing matches “{query.trim()}”
              </li>
            ) : (
              results.map((result, index) => (
                // role="option" belongs on the direct child of the listbox. It
                // was on a button nested inside the li, which leaves assistive
                // technology unable to associate the two at all.
                <li
                  key={`${result.kind}-${result.id}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === highlighted}
                  data-highlighted={index === highlighted}
                  onClick={() => choose(result)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`cursor-pointer px-4 py-2 flex items-center gap-3 transition-colors ${
                    index === highlighted ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`text-sm truncate flex-1 ${
                      result.muted
                        ? "text-zinc-400 dark:text-zinc-500 line-through"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {result.title}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                    {labelForKind(result.kind)}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 dark:text-zinc-500 flex gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
