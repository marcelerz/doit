"use client";

import { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleSection({ title, count, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <section>
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left mb-3 group">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          {title} ({count})
        </h2>
        <svg
          className={`w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && children}
    </section>
  );
}
