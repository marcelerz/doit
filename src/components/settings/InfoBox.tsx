"use client";

import { ReactNode } from "react";

interface InfoBoxProps {
  /** Title of the info box (default: "How it works") */
  title?: string;
  /** List of bullet points to display */
  items?: string[];
  /** Custom content (alternative to items) */
  children?: ReactNode;
}

/**
 * Reusable info box for settings tabs
 * Supports either a list of bullet points or custom children content
 */
export function InfoBox({ title = "ℹ️ How it works", items, children }: InfoBoxProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
      <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">{title}</h4>
      {items ? (
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-blue-800 dark:text-blue-200">{children}</div>
      )}
    </div>
  );
}
