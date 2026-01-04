"use client";

import { useState } from "react";
import { ClockIcon, CloseIcon, SearchIcon } from "@/components/shared/Icons";
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

interface SearchInputWithHistoryProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  history: Array<{ id: SearchHistoryId; query: string; timestamp: number }>;
  onRemoveFromHistory: (id: SearchHistoryId) => void;
  onClearHistory: () => void;
  className?: string;
}

export function SearchInputWithHistory({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  history,
  onRemoveFromHistory,
  onClearHistory,
  className = "",
}: SearchInputWithHistoryProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSelect = (query: string) => {
    onChange(query);
    onSearch(query);
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      onSearch(value.trim());
      setShowHistory(false);
    } else if (e.key === "Escape") {
      setShowHistory(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (!value && history.length > 0) {
              setShowHistory(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding to allow click on history items
            setTimeout(() => setShowHistory(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-8 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              setShowHistory(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
        {!value && history.length > 0 && isFocused && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            title="Show search history"
          >
            <ClockIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <SearchHistoryDropdown
        history={history}
        onSelect={handleSelect}
        onRemove={onRemoveFromHistory}
        onClear={onClearHistory}
        isVisible={showHistory && !value}
      />
    </div>
  );
}
