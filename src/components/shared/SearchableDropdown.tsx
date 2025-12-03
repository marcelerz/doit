import { useState, useEffect } from "react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface SearchableDropdownItem {
  id: string;
  label: string;
  prefix?: string;
}

interface SearchableDropdownProps {
  items: SearchableDropdownItem[];
  onSelect: (item: SearchableDropdownItem) => void;
  onAdd?: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  searchValue?: string;
  allowAdd?: boolean;
  highlightColor?: "blue" | "green" | "pink" | "purple" | "red" | "teal" | "amber";
  excludeIds?: string[];
  emptyMessage?: string;
}

const highlightColorClasses = {
  blue: "bg-blue-100 dark:bg-blue-900/50",
  green: "bg-green-100 dark:bg-green-900/50",
  pink: "bg-pink-100 dark:bg-pink-900/50",
  purple: "bg-purple-100 dark:bg-purple-900/50",
  red: "bg-red-100 dark:bg-red-900/50",
  teal: "bg-teal-100 dark:bg-teal-900/50",
  amber: "bg-amber-100 dark:bg-amber-900/50",
};

const addButtonColorClasses = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  pink: "text-pink-600 dark:text-pink-400",
  purple: "text-purple-600 dark:text-purple-400",
  red: "text-red-600 dark:text-red-400",
  teal: "text-teal-600 dark:text-teal-400",
  amber: "text-amber-600 dark:text-amber-400",
};

/**
 * Reusable searchable dropdown with keyboard navigation
 * Supports filtering, adding new items, and keyboard navigation
 */
export function SearchableDropdown({
  items,
  onSelect,
  onAdd,
  onClose,
  placeholder = "Search...",
  searchValue: externalSearchValue,
  allowAdd = true,
  highlightColor = "blue",
  excludeIds = [],
  emptyMessage = "No items found",
}: SearchableDropdownProps) {
  const [search, setSearch] = useState(externalSearchValue || "");

  useEffect(() => {
    if (externalSearchValue !== undefined) {
      setSearch(externalSearchValue);
    }
  }, [externalSearchValue]);

  const filteredItems = items
    .filter((item) => !excludeIds.includes(item.id))
    .filter((item) => search === "" || item.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  const hasAddOption = allowAdd && onAdd && filteredItems.length === 0 && search.trim() !== "";
  const totalItems = filteredItems.length + (hasAddOption ? 1 : 0);

  const handleSelect = (index: number) => {
    if (index < filteredItems.length) {
      onSelect(filteredItems[index]);
    } else if (hasAddOption && onAdd) {
      onAdd(search.trim());
    }
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const { selectedIndex, setSelectedIndex, handleKeyDown } = useKeyboardNavigation({
    itemCount: totalItems,
    onSelect: handleSelect,
    onClose: handleClose,
  });

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={handleClose} />
      <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
        />
        <div className="max-h-48 overflow-y-auto">
          {filteredItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item);
                setSearch("");
              }}
              className={`w-full text-left text-xs px-3 py-2 transition-colors ${
                idx === selectedIndex
                  ? highlightColorClasses[highlightColor]
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              {item.prefix}
              {item.label}
            </button>
          ))}
          {filteredItems.length === 0 &&
            (search === "" ? (
              <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">{emptyMessage}</div>
            ) : hasAddOption && onAdd ? (
              <button
                onClick={() => {
                  onAdd(search.trim());
                  setSearch("");
                }}
                className={`w-full text-left text-xs px-3 py-2 transition-colors font-medium ${
                  addButtonColorClasses[highlightColor]
                } ${
                  selectedIndex === 0
                    ? highlightColorClasses[highlightColor]
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                + Add &quot;{search}&quot;
              </button>
            ) : (
              <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">No matches</div>
            ))}
        </div>
      </div>
    </>
  );
}
