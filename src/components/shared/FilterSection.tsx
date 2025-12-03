"use client";

interface FilterSectionProps {
  label: string;
  activeCount: number;
  options: string[];
  selectedValues: Set<string>;
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  getButtonColor: (value: string, isSelected: boolean) => string;
  formatLabel?: (value: string) => string;
}

export function FilterSection({
  label,
  activeCount,
  options,
  selectedValues,
  onToggle,
  onSelectAll,
  onClear,
  getButtonColor,
  formatLabel = (v) => v,
}: FilterSectionProps) {
  if (options.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label} - {activeCount}
        </label>
        <div className="flex gap-2">
          <button onClick={onSelectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Select All
          </button>
          <button onClick={onClear} className="text-xs text-red-600 dark:text-red-400 hover:underline">
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((value) => (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={getButtonColor(value, selectedValues.has(value))}
          >
            {formatLabel(value)}
          </button>
        ))}
      </div>
    </div>
  );
}
