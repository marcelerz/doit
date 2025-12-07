"use client";

type IconType = "edit" | "delete" | "remove" | "archive" | "unarchive" | "duplicate" | "add" | "close";
type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "default" | "danger" | "success" | "warning" | "info" | "ghost";

interface IconButtonProps {
  icon: IconType;
  onClick: () => void;
  title?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

const iconPaths: Record<IconType, string> = {
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  delete:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  remove: "M6 18L18 6M6 6l12 12",
  archive: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  unarchive: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
  duplicate:
    "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  add: "M12 4v16m8-8H4",
  close: "M6 18L18 6M6 6l12 12",
};

const sizeClasses: Record<ButtonSize, { button: string; icon: string }> = {
  sm: { button: "p-1", icon: "w-3 h-3" },
  md: { button: "p-1.5", icon: "w-4 h-4" },
  lg: { button: "p-2", icon: "w-5 h-5" },
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
  danger: "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400",
  success:
    "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400",
  warning:
    "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400",
  info: "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400",
  ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
};

// Map icons to their default variants
const defaultVariants: Record<IconType, ButtonVariant> = {
  edit: "default",
  delete: "danger",
  remove: "danger",
  archive: "warning",
  unarchive: "success",
  duplicate: "info",
  add: "info",
  close: "ghost",
};

// Map icons to their default titles
const defaultTitles: Record<IconType, string> = {
  edit: "Edit",
  delete: "Delete",
  remove: "Remove",
  archive: "Archive",
  unarchive: "Unarchive",
  duplicate: "Duplicate",
  add: "Add",
  close: "Close",
};

export function IconButton({
  icon,
  onClick,
  title,
  size = "md",
  variant,
  disabled = false,
  className = "",
}: IconButtonProps) {
  const resolvedVariant = variant ?? defaultVariants[icon];
  const resolvedTitle = title ?? defaultTitles[icon];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size].button} ${variantClasses[resolvedVariant]} rounded-md transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      aria-label={resolvedTitle}
      title={resolvedTitle}
    >
      <svg className={sizeClasses[size].icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon]} />
      </svg>
    </button>
  );
}
