"use client";

import { ReactNode } from "react";

type NoticeBoxVariant = "info" | "warning" | "success";

interface NoticeBoxProps {
  /** Title of the notice box (default based on variant) */
  title?: string;
  /** Color variant: info (blue), warning (amber), success (green) */
  variant?: NoticeBoxVariant;
  /** Optional icon (emoji or text) to show before title */
  icon?: string;
  /** List of bullet points to display */
  items?: string[];
  /** Custom content (alternative to items) */
  children?: ReactNode;
}

const variantStyles = {
  info: {
    container: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    title: "text-blue-900 dark:text-blue-100",
    text: "text-blue-800 dark:text-blue-200",
    icon: "ℹ️",
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    title: "text-amber-900 dark:text-amber-100",
    text: "text-amber-800 dark:text-amber-200",
    icon: "⚠️",
  },
  success: {
    container: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    title: "text-green-900 dark:text-green-100",
    text: "text-green-800 dark:text-green-200",
    icon: "✓",
  },
};

const defaultTitles = {
  info: "How it works",
  warning: "Warning",
  success: "Success",
};

/**
 * Reusable notice box for settings tabs
 * Supports bullet points, custom content, and different color variants
 */
export function NoticeBox({ title, variant = "info", icon, items, children }: NoticeBoxProps) {
  const styles = variantStyles[variant];
  const displayTitle = title ?? defaultTitles[variant];

  return (
    <div className={`p-4 rounded-lg border ${styles.container}`}>
      <div className={icon ? "flex items-start gap-3" : ""}>
        {icon && <span className="text-xl">{icon}</span>}
        <div className={icon ? "" : ""}>
          <h4 className={`font-semibold text-sm mb-2 ${styles.title}`}>
            {styles.icon} {displayTitle}
          </h4>
          {items ? (
            <ul className={`text-sm space-y-1 list-disc list-inside ${styles.text}`}>
              {items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className={`text-sm ${styles.text}`}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
