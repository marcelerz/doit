"use client";

import { defaultNotesSettings } from "@/types/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLoading } from "./components/SettingsLoading";
import { SettingsHeader } from "./components/SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";

const tooltip = (
  <div className="space-y-2">
    <p>Notes for meeting notes, ideas, and quick thoughts.</p>
    <ul className="space-y-1">
      <li>Pin important notes</li>
      <li>Add action items that convert to todos</li>
      <li>Link to people and projects</li>
      <li>Convert entire notes to todos</li>
    </ul>
  </div>
);

export function NotesTab() {
  const { settings, isLoaded, updateNotesSettings } = useSettings();

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  const notes = settings.notes;

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Notes Settings"
        tooltip={tooltip}
        description="Configure default settings for notes. Manage individual notes in the Notes tab on the main view."
        action={{
          label: "Reset to Defaults",
          onClick: () => updateNotesSettings(defaultNotesSettings),
        }}
      />

      {/* Settings */}
      <div className="grid grid-cols-1 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="defaultPinNewNotes"
            checked={notes.defaultPinNewNotes}
            onChange={(e) => updateNotesSettings({ ...notes, defaultPinNewNotes: e.target.checked })}
            className="h-4 w-4 mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <label htmlFor="defaultPinNewNotes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Pin new notes by default
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              When enabled, newly created notes will be automatically pinned
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="showArchivedByDefault"
            checked={notes.showArchivedByDefault}
            onChange={(e) => updateNotesSettings({ ...notes, showArchivedByDefault: e.target.checked })}
            className="h-4 w-4 mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <label htmlFor="showArchivedByDefault" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Show archived notes by default
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              When enabled, archived notes will be visible in the notes list by default
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Default Sort Order</label>
          <select
            value={notes.sortOrder}
            onChange={(e) =>
              updateNotesSettings({ ...notes, sortOrder: e.target.value as "modified" | "created" | "title" })
            }
            className="w-full max-w-xs px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="modified">Last Modified</option>
            <option value="created">Creation Date</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            How notes are sorted when you open the Notes view
          </p>
        </div>
      </div>

      {/* Info card */}
      <NoticeBox title="Using Notes">
        <p>
          Notes are great for meeting notes, brainstorming, and quick thoughts. Add <strong>action items</strong> to your
          notes and convert them to todos with a single click. You can also convert an entire note to a todo if it
          becomes actionable.
        </p>
      </NoticeBox>
    </div>
  );
}
