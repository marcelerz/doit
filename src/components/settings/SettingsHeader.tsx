"use client";

import { ReactNode } from "react";
import { InfoTooltip } from "@/components/shared/InfoTooltip";

interface SettingsHeaderAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "subtle";
  hidden?: boolean;
}

interface SettingsHeaderProps {
  title: string;
  tooltip?: ReactNode;
  description?: ReactNode;
  action?: SettingsHeaderAction;
}

/**
 * Standardized header for settings tabs.
 *
 * Supports:
 * - Title with optional InfoTooltip
 * - Optional description below title
 * - Optional action button (Reset to Defaults, Add Item, etc.)
 *   - "primary" variant: blue button (for Add actions)
 *   - "secondary" variant: subtle text button (for Reset actions, default)
 *   - "subtle" variant: gray background button (for Refresh actions)
 */
export function SettingsHeader({ title, tooltip, description, action }: SettingsHeaderProps) {
  const showAction = action && !action.hidden;

  const getButtonClassName = (variant: "primary" | "secondary" | "subtle" = "secondary") => {
    switch (variant) {
      case "primary":
        return "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors";
      case "subtle":
        return "text-sm px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors";
      case "secondary":
      default:
        return "px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors";
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{title}</span>
            {tooltip && <InfoTooltip content={tooltip} />}
          </h2>
          {description && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{description}</p>}
        </div>
        {showAction && (
          <button onClick={action.onClick} className={getButtonClassName(action.variant)}>
            {action.label}
          </button>
        )}
      </div>
    </>
  );
}
