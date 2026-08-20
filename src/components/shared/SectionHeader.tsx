"use client";

import { ChevronDownIcon } from "@/components/shared/Icons";

interface SectionHeaderProps {
  /** Title text for the section */
  title: string;
  /** Optional count to display next to the title */
  count?: number;
  /** Whether the section is expanded */
  expanded: boolean;
  /** Toggle expansion state */
  onToggle: () => void;
  /** Optional custom styling variant */
  variant?: "default" | "highlight";
  /** Optional highlight color for the indicator dot (when variant is "highlight") */
  highlightColor?: string;
  /** Children rendered when expanded */
  children?: React.ReactNode;
}

/**
 * Collapsible section header with title, count, and chevron toggle.
 * Used for grouping content in views like ReviewsView.
 *
 * @example
 * <SectionHeader
 *   title="Days"
 *   count={5}
 *   expanded={daysExpanded}
 *   onToggle={() => setDaysExpanded(!daysExpanded)}
 * >
 *   {daysExpanded && <div>Content here</div>}
 * </SectionHeader>
 */
export function SectionHeader({
  title,
  count,
  expanded,
  onToggle,
  variant = "default",
  highlightColor,
  children,
}: SectionHeaderProps) {
  const isHighlight = variant === "highlight";

  return (
    <section className={isHighlight ? "bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800 p-4" : ""}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between text-left group ${isHighlight ? "mb-3" : "mb-3"}`}
      >
        <h2
          className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${
            isHighlight
              ? "text-amber-700 dark:text-amber-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {isHighlight && (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: highlightColor || "#f59e0b" }}
            />
          )}
          {title}
          {count !== undefined && ` (${count})`}
        </h2>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${
            isHighlight
              ? "text-amber-600 dark:text-amber-500"
              : "text-zinc-500 dark:text-zinc-400"
          } ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && children}
    </section>
  );
}
