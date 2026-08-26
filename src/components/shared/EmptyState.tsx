"use client";

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4" aria-hidden="true">
        {emoji}
      </div>
      {/* The title was declared and then never destructured, so nine callers
          passed a heading that was silently dropped -- "No People", "No
          Results", "No Notes" -- leaving each empty state with only its
          supporting sentence and no heading at all. */}
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
