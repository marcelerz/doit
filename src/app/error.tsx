"use client";

import { useEffect } from "react";

/**
 * App Router error boundary.
 *
 * There was no boundary anywhere in the app, so any render-time throw took the
 * whole page down to a blank screen. This is the last line of defence; the
 * storage load path has its own recovery screen with data-export options.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Your data is stored on this device and has not been touched. Try again, and if the problem
          persists, reload the page.
        </p>

        <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded p-3 mb-4 overflow-x-auto whitespace-pre-wrap">
          {error.message}
        </pre>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-3 py-2 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 text-sm font-medium rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
