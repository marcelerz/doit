"use client";

import { useState } from "react";
import {
  defaultNotesSettings,
  NoteTemplateItem,
  generateTemplateItemId,
  defaultOneOnOneTemplate,
  defaultMeetingNoteTemplate,
} from "@/types/settings";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLoading } from "./components/SettingsLoading";
import { SettingsHeader } from "./components/SettingsHeader";
import { NoticeBox } from "../shared/NoticeBox";
import { ChevronUpIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "../shared/Icons";

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

interface TemplateEditorProps {
  title: string;
  description: string;
  items: NoteTemplateItem[];
  defaultItems: NoteTemplateItem[];
  onChange: (items: NoteTemplateItem[]) => void;
}

function TemplateEditor({ title, description, items, defaultItems, onChange }: TemplateEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const handleToggleEnabled = (id: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  const handleStartEdit = (item: NoteTemplateItem) => {
    setEditingId(item.id);
    setEditingLabel(item.label);
  };

  const handleSaveEdit = () => {
    if (editingId && editingLabel.trim()) {
      onChange(items.map((item) => (item.id === editingId ? { ...item, label: editingLabel.trim() } : item)));
    }
    setEditingId(null);
    setEditingLabel("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel("");
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: NoteTemplateItem = {
      id: generateTemplateItemId(),
      label: "New Section",
      enabled: true,
    };
    onChange([...items, newItem]);
  };

  const handleResetToDefaults = () => {
    onChange(defaultItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <button
          onClick={handleResetToDefaults}
          className="text-xs px-2 py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700"
          >
            {/* Reorder buttons */}
            <div className="flex flex-col">
              <button
                onClick={() => handleMove(item.id, "up")}
                disabled={index === 0}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <ChevronUpIcon className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleMove(item.id, "down")}
                disabled={index === items.length - 1}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <ChevronDownIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Enable/disable checkbox */}
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => handleToggleEnabled(item.id)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />

            {/* Label (editable) */}
            {editingId === item.id ? (
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                onBlur={handleSaveEdit}
                autoFocus
                className="flex-1 px-2 py-1 text-sm bg-zinc-50 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            ) : (
              <span
                onClick={() => handleStartEdit(item)}
                className={`flex-1 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                  item.enabled ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-400 line-through"
                }`}
              >
                {item.label}
              </span>
            )}

            {/* Delete button */}
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Delete item"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item button */}
      <button
        onClick={handleAddItem}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-md transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Item
      </button>
    </div>
  );
}

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

      {/* 1:1 Note Template */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <TemplateEditor
          title="1:1 Note Template"
          description="Sections included when creating a 1:1 note from a person. Click a label to rename it."
          items={notes.oneOnOneTemplate || defaultOneOnOneTemplate}
          defaultItems={defaultOneOnOneTemplate}
          onChange={(items) => updateNotesSettings({ ...notes, oneOnOneTemplate: items })}
        />
      </div>

      {/* Meeting Note Template */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
        <TemplateEditor
          title="Meeting Note Template"
          description="Sections included when creating a meeting note from a project. Click a label to rename it."
          items={notes.meetingNoteTemplate || defaultMeetingNoteTemplate}
          defaultItems={defaultMeetingNoteTemplate}
          onChange={(items) => updateNotesSettings({ ...notes, meetingNoteTemplate: items })}
        />
      </div>

      {/* Info card */}
      <NoticeBox title="Using Notes">
        <p>
          Notes are great for meeting notes, brainstorming, and quick thoughts. Add <strong>action items</strong> to your
          notes and convert them to todos with a single click. You can also convert an entire note to a todo if it
          becomes actionable.
        </p>
      </NoticeBox>

      <NoticeBox title="Quick Notes from People & Projects">
        <p>
          Use the note button on People cards to create <strong>1:1 notes</strong> with pre-filled sections for your
          meetings. Similarly, use the note button on Project cards to create <strong>meeting notes</strong> with a
          structured template. Customize the sections above to match your workflow.
        </p>
      </NoticeBox>
    </div>
  );
}
