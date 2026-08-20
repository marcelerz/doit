"use client";

import { ReactNode } from "react";

type NoticeBoxVariant = "info" | "warning" | "success";

interface NoticeBoxProps {
  /** Title of the notice box (default based on variant) */
  title?: string;
  /** Color variant: info (blue), warning (amber), success (green) */
  variant?: NoticeBoxVariant;
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
    icon: (
      <svg
        className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    title: "text-amber-900 dark:text-amber-100",
    text: "text-amber-800 dark:text-amber-200",
    icon: (
      <svg
        className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  danger: {
    container: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    title: "text-red-900 dark:text-red-100",
    text: "text-red-800 dark:text-red-200",
    icon: (
      <svg
        className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  success: {
    container: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    title: "text-green-900 dark:text-green-100",
    text: "text-green-800 dark:text-green-200",
    icon: (
      <svg
        className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

const defaultTitles = {
  info: "How it works",
  warning: "Warning",
  danger: "Danger",
  success: "Success",
};

/**
 * Reusable notice box for settings tabs
 * Supports bullet points, custom content, and different color variants
 */
export function NoticeBox({ title, variant = "info", items, children }: NoticeBoxProps) {
  const styles = variantStyles[variant];
  const displayTitle = title ?? defaultTitles[variant];

  return (
    <div className={`p-4 rounded-lg border ${styles.container}`}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1">
          <h4 className={`font-semibold text-sm mb-2 ${styles.title}`}>{displayTitle}</h4>
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
