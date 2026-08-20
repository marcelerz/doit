"use client";

import {
  EditIcon,
  TrashIcon,
  CloseIcon,
  ArchiveIcon,
  UndoIcon,
  DuplicateIcon,
  PlusIcon,
  DownloadIcon,
} from "@/components/shared/Icons";
import { ComponentType } from "react";

type IconType =
  | "edit"
  | "delete"
  | "remove"
  | "archive"
  | "unarchive"
  | "duplicate"
  | "add"
  | "close"
  | "download"
  | "restore";
type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "default" | "danger" | "success" | "warning" | "info" | "ghost";

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

interface IconButtonProps {
  icon: IconType;
  onClick: () => void;
  title?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

// Map icon types to their corresponding icon components
const iconComponents: Record<IconType, ComponentType<IconProps>> = {
  edit: EditIcon,
  delete: TrashIcon,
  remove: CloseIcon,
  archive: ArchiveIcon,
  unarchive: UndoIcon,
  duplicate: DuplicateIcon,
  add: PlusIcon,
  close: CloseIcon,
  download: DownloadIcon,
  restore: UndoIcon,
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
  download: "info",
  restore: "success",
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
  download: "Download",
  restore: "Restore",
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
  const IconComponent = iconComponents[icon];

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
      <IconComponent className={sizeClasses[size].icon} strokeWidth={2} />
    </button>
  );
}
