"use client";

import { forwardRef } from "react";
import { SearchIcon, CloseIcon } from "@/components/shared/Icons";

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show the clear button when there's text */
  showClear?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Callback when input receives focus */
  onFocus?: () => void;
  /** Callback when input loses focus */
  onBlur?: () => void;
  /** Callback when a key is pressed */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Search input with search icon and optional clear button.
 * Used for filtering lists in views like ProjectsView, PeopleView, SprintsView.
 *
 * @example
 * <SearchInput
 *   ref={inputRef}
 *   value={search}
 *   onChange={handleSearchChange}
 *   placeholder="Search projects... (press / to focus)"
 * />
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Search...",
      showClear = true,
      className = "",
      autoFocus = false,
      onFocus,
      onBlur,
      onKeyDown,
    },
    ref
  ) => {
    const hasClearButton = showClear && value;

    return (
      <div className={`relative flex-1 ${className}`}>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`w-full pl-10 ${hasClearButton ? "pr-10" : "pr-4"} py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {hasClearButton && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Clear search"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
