"use client";

import { ViewShortcuts } from "./shortcuts";

export function KeyboardSection({ shortcuts }: { shortcuts: ViewShortcuts }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⌨️ Keyboard Shortcuts</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Use these shortcuts to navigate and manage tasks quickly. Shortcuts work when not focused on an input field.
      </p>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🧭 Navigation</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">
                      {shortcuts.range}
                    </kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                    Switch between views ({shortcuts.bound.map((s) => s.label).join(", ")})
                    {shortcuts.unbound.length > 0 && (
                      <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                        {shortcuts.unbound.join(" and ")}{" "}
                        {shortcuts.unbound.length === 1 ? "has" : "have"} no number key -- only single digits can be
                        bound. Use the tabs.
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">/</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Focus search bar</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Esc</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                    Close overlay / Clear search / Exit mode
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">📝 Task Management</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">N</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Create new task (focus input)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">S</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                    Toggle selection mode for batch operations
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">F</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Toggle filters panel</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">?</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Show this help overlay</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">↩️ Undo</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            There is no undo shortcut. Completing, archiving or deleting a task shows a notification with an{" "}
            <strong>Undo</strong> button for ten seconds; use that.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🎯 Focus Mode</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 px-3 w-40">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Space</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Pause/Resume timer</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Enter</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Open the current task&apos;s details</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Shift</kbd>
                    <span className="mx-1">+</span>
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">Enter</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Complete current task</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">S</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Skip to next task (or skip the break)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">N</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Skip the current task entirely</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">
                    <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono">+</kbd>
                  </td>
                  <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Extend timer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💡 Tip</h4>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Keyboard shortcuts only work when you&apos;re not focused on an input field. Press{" "}
          <kbd className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-xs">Escape</kbd> first to unfocus
          any input, then use the shortcut.
        </p>
      </div>
    </div>
  );
}
