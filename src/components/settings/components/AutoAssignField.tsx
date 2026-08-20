"use client";

import { useState, CSSProperties } from "react";

interface DropdownItem {
  id: string;
  label: string;
}

interface AutoAssignFieldProps {
  /** Label text for the field */
  label: string;
  /** Optional marker symbol shown in label, badge, and dropdown items (e.g., "@", "$", "%", "!!") */
  marker?: string;
  /** Current value of the field */
  value: string | undefined;
  /** Style for the badge (background color, text color, border color) */
  badgeStyle: CSSProperties;
  /** Placeholder for the search input */
  placeholder: string;
  /** Items to show in the dropdown */
  items: DropdownItem[];
  /** Called when an item is selected */
  onSelect: (value: string) => void;
  /** Called when the value is cleared */
  onClear: () => void;
  /** Message to show when no items match the search */
  emptyMessage?: string;
  /** Whether to allow selecting custom values via Enter key */
  allowCustomValue?: boolean;
  /** Limit the number of displayed items (default: 30) */
  limit?: number;
}

/**
 * Reusable auto-assign field component with label, badge, and dropdown
 */
export function AutoAssignField({
  label,
  marker,
  value,
  badgeStyle,
  placeholder,
  items,
  onSelect,
  onClear,
  emptyMessage = "No items found",
  allowCustomValue = false,
  limit = 30,
}: AutoAssignFieldProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = items
    .filter((item) => search === "" || item.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, limit);

  const handleSelect = (itemLabel: string) => {
    onSelect(itemLabel);
    setSearch("");
    setShowDropdown(false);
  };

  const handleClose = () => {
    setShowDropdown(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "Enter" && allowCustomValue) {
      e.preventDefault();
      const valueToUse = filteredItems.length > 0 ? filteredItems[0].label : search.trim();
      if (valueToUse) {
        handleSelect(valueToUse);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {label}
        {marker && (
          <>
            {" "}
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{marker}</code>
          </>
        )}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {value && (
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 rounded border transition-colors hover:opacity-80"
            style={badgeStyle}
          >
            {marker}
            {value} ✕
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
          >
            {value ? "Change" : "+"}
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={handleClose} />
              <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  autoFocus
                  className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.label)}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {marker}
                      {item.label}
                    </button>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">{emptyMessage}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
