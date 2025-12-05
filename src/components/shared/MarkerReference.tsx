export function MarkerReference() {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">✨ Smart Input Markers</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-blue-800 dark:text-blue-200">
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">@name</code> Assign
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">#project</code> Project
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">$name</code> Source
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">^name</code> Mention
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">!!high</code> Priority
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">~date</code> Due (or auto-detect)
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">*2h</code> Duration
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">%pattern</code> Recurring
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">&gt;task</code> Dependency
        </div>
        <div>
          <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">&amp;tag</code> Tag
        </div>
      </div>
      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
        💡 Dates are automatically detected (e.g., "tomorrow", "next Friday"). Click highlighted dates to deactivate.
      </p>
    </div>
  );
}
