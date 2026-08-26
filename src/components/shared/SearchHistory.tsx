"use client";

import { ClockIcon, CloseIcon } from "@/components/shared/Icons";
import { SearchHistoryId } from "@/types/types";

interface SearchHistoryDropdownProps {
  history: Array<{ id: SearchHistoryId; query: string; timestamp: number }>;
  onSelect: (query: string) => void;
  onRemove: (id: SearchHistoryId) => void;
  onClear: () => void;
  isVisible: boolean;
}

export function SearchHistoryDropdown({ history, onSelect, onRemove, onClear, isVisible }: SearchHistoryDropdownProps) {
  if (!isVisible || history.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Recent Searches</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>
      <ul className="py-1">
        {history.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group cursor-pointer"
            onClick={() => onSelect(item.query)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ClockIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{item.query}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              title="Remove from history"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

