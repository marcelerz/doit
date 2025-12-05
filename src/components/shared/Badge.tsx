interface BadgeProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: "blue" | "green" | "pink" | "purple" | "red" | "teal" | "amber" | "zinc";
  size?: "sm" | "md";
  customColor?: string; // Hex color for custom styling
}

const variantClasses = {
  blue: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50",
  green:
    "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50",
  pink: "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50",
  purple:
    "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50",
  red: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50",
  teal: "bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50",
  amber:
    "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50",
  zinc: "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700",
};

/**
 * Reusable badge component for displaying metadata with optional remove button
 */
export function Badge({ children, onRemove, variant = "zinc", size = "sm", customColor }: BadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";

  // If custom color is provided, use inline styles instead of variant classes
  if (customColor) {
    const style = {
      backgroundColor: customColor,
      color: "#333",
      borderColor: customColor,
    };

    if (onRemove) {
      return (
        <button
          onClick={onRemove}
          style={style}
          className={`${sizeClasses} rounded border transition-opacity hover:opacity-80`}
        >
          {children} ✕
        </button>
      );
    }

    return (
      <span style={style} className={`${sizeClasses} rounded border`}>
        {children}
      </span>
    );
  }

  // Use variant classes if no custom color
  if (onRemove) {
    return (
      <button
        onClick={onRemove}
        className={`${sizeClasses} rounded border transition-colors ${variantClasses[variant]}`}
      >
        {children} ✕
      </button>
    );
  }

  return <span className={`${sizeClasses} rounded border ${variantClasses[variant]}`}>{children}</span>;
}
