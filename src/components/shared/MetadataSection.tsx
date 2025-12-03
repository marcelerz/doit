"use client";

import { SearchableDropdown } from "./SearchableDropdown";
import { Badge } from "./Badge";
import { useDropdownManager } from "@/hooks/useDropdownManager";

interface MetadataSectionProps {
  title: string;
  icon: string;
  values: string[];
  onRemove: (value: string) => void;
  onAdd?: (value: string) => void;
  availableItems?: Array<{ id: string; label: string; prefix?: string; alternatives?: string[] }>;
  dropdownId: string;
  placeholder?: string;
  highlightColor?: "blue" | "purple" | "green" | "pink" | "red" | "amber" | "teal";
  emptyMessage?: string;
  getColor?: (value: string) => string;
  getTextColor?: (bgColor: string) => string;
  showPrefix?: boolean;
  prefix?: string;
  renderCustomValue?: (value: string) => React.ReactNode;
  addButtonLabel?: string;
  noItemsMessage?: string;
}

export function MetadataSection({
  title,
  icon,
  values,
  onRemove,
  onAdd,
  availableItems,
  dropdownId,
  placeholder = "Search...",
  highlightColor = "blue",
  emptyMessage,
  getColor,
  getTextColor,
  showPrefix = true,
  prefix = "",
  renderCustomValue,
  addButtonLabel = "+",
  noItemsMessage,
}: MetadataSectionProps) {
  const dropdown = useDropdownManager();

  const handleSelect = (item: { id: string; label: string } | string) => {
    const value = typeof item === "string" ? item : item.id;
    if (onAdd) {
      onAdd(value);
    }
    dropdown.closeDropdown();
  };

  const handleAddNew = (name: string) => {
    if (onAdd) {
      onAdd(name);
    }
    dropdown.closeDropdown();
  };

  return (
    <div>
      <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
        {icon} {title}
      </h4>
      {noItemsMessage && (!availableItems || availableItems.length <= 1) ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">{noItemsMessage}</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => {
            if (renderCustomValue) {
              return <div key={value}>{renderCustomValue(value)}</div>;
            }

            const displayValue = showPrefix && prefix ? `${prefix}${value}` : value;

            if (getColor && getTextColor) {
              const bgColor = getColor(value);
              const textColor = getTextColor(bgColor);
              return (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  {displayValue}
                  <button onClick={() => onRemove(value)} className="ml-1 hover:opacity-70">
                    ×
                  </button>
                </span>
              );
            }

            return (
              <Badge key={value} variant={highlightColor} onRemove={() => onRemove(value)}>
                {displayValue}
              </Badge>
            );
          })}

          {onAdd && availableItems && (
            <div className="relative">
              <button
                onClick={() => dropdown.toggleDropdown(dropdownId)}
                className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
              >
                {addButtonLabel}
              </button>
              {dropdown.isOpen(dropdownId) && (
                <SearchableDropdown
                  items={availableItems}
                  onSelect={handleSelect}
                  onAdd={handleAddNew}
                  onClose={() => dropdown.closeDropdown()}
                  placeholder={placeholder}
                  highlightColor={highlightColor}
                  excludeIds={values}
                  emptyMessage={emptyMessage || "All items already added"}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
