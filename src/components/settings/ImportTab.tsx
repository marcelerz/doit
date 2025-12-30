"use client";

import { useState, useRef, useCallback } from "react";
import { importTodos, ImportResult, ImportedTodo, ImportFormat, convertAllToTodos } from "@/utils/import";
import { Todo } from "@/types/todo";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { useSettings } from "@/hooks/useSettings";
import { useTodos } from "@/hooks/useTodos";
import { SettingsLoading } from "./SettingsLoading";
import { SettingsHeader } from "./SettingsHeader";

const tooltip = (
  <div className="space-y-2">
    <p>Import tasks from external sources.</p>
    <ul className="space-y-1">
      <li>• Plain text (one task per line)</li>
      <li>• Markdown checkboxes</li>
      <li>• CSV format</li>
      <li>• Duplicate detection available</li>
    </ul>
  </div>
);

type ImportStep = "upload" | "preview" | "complete";

export function ImportTab() {
  const { people, isLoaded: peopleLoaded } = usePeople();
  const { projects, isLoaded: projectsLoaded } = useProjects();
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const { importTodos: importTodosToStore, isLoaded: todosLoaded } = useTodos();

  const [step, setStep] = useState<ImportStep>("upload");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [importedCount, setImportedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoaded = peopleLoaded && projectsLoaded && settingsLoaded && todosLoaded;

  const existingProjects = projects.map((p) => p.name);
  const existingPeople = people.map((p) => p.name);
  const existingPriorities = settings.priorities.map((p) => p.name);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const importResult = importTodos(content, "auto", file.name);
        setResult(importResult);

        // Select all by default
        if (importResult.success) {
          setSelectedTodos(new Set(importResult.todos.map((_, i) => i)));
        }

        setStep("preview");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleToggleTodo = (index: number) => {
    setSelectedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (result) {
      setSelectedTodos(new Set(result.todos.map((_, i) => i)));
    }
  };

  const handleSelectNone = () => {
    setSelectedTodos(new Set());
  };

  const handleImport = () => {
    if (!result) return;

    const todosToImport = result.todos.filter((_, i) => selectedTodos.has(i));
    const converted = convertAllToTodos(todosToImport, {
      projects: existingProjects,
      people: existingPeople,
      priorities: existingPriorities,
    });

    importTodosToStore(converted);
    setImportedCount(converted.length);
    setStep("complete");
  };

  const handleReset = () => {
    setStep("upload");
    setResult(null);
    setSelectedTodos(new Set());
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatLabel = (format: ImportFormat): string => {
    switch (format) {
      case "todoist":
        return "Todoist";
      case "things":
        return "Things 3";
      case "reminders":
        return "Apple Reminders";
      case "csv":
        return "CSV";
      case "json":
        return "JSON";
      default:
        return format;
    }
  };

  if (!isLoaded) {
    return <SettingsLoading />;
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Import Tasks"
        tooltip={tooltip}
        description="Import tasks from other apps. Supported formats: Todoist, Things 3, Apple Reminders, CSV, and JSON."
      />

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Drop file here or click to upload
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Supports JSON and CSV files</p>
              </div>
            </div>
          </div>

          {/* Format Help */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">Supported Export Formats</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-red-500">●</span>
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Todoist</span>
                    <p className="text-zinc-600 dark:text-zinc-400">Export via Settings → Backups → Export as JSON</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">●</span>
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Things 3</span>
                    <p className="text-zinc-600 dark:text-zinc-400">Use third-party export tools or AppleScript</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-orange-500">●</span>
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Apple Reminders</span>
                    <p className="text-zinc-600 dark:text-zinc-400">Use Shortcuts app or third-party exporters</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">●</span>
                  <div>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">CSV / JSON</span>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Generic format with title, notes, due_date, priority columns
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && result && (
        <div className="space-y-4">
          {/* Result Summary */}
          <div
            className={`p-4 rounded-lg ${
              result.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Found {result.todos.length} tasks in {formatLabel(result.format)} format
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-red-800 dark:text-red-200">Failed to parse file</span>
                </>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
            {result.warnings.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm text-amber-700 dark:text-amber-300 cursor-pointer">
                  {result.warnings.length} warning(s)
                </summary>
                <ul className="mt-1 text-sm text-amber-600 dark:text-amber-400 list-disc list-inside">
                  {result.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Selection Controls */}
          {result.success && result.todos.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedTodos.size} of {result.todos.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-400">|</span>
                  <button
                    onClick={handleSelectNone}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Select None
                  </button>
                </div>
              </div>

              {/* Todo List */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-700 max-h-96 overflow-y-auto">
                {result.todos.map((todo, index) => (
                  <TodoPreviewItem
                    key={index}
                    todo={todo}
                    selected={selectedTodos.has(index)}
                    onToggle={() => handleToggleTodo(index)}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedTodos.size === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Import {selectedTodos.size} Task{selectedTodos.size !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}

          {/* No todos found */}
          {result.success && result.todos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-600 dark:text-zinc-400">No tasks found in the file.</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try another file
              </button>
            </div>
          )}

          {/* Parse failed */}
          {!result.success && (
            <div className="text-center py-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try another file
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Complete */}
      {step === "complete" && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Import Complete!</h4>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Successfully imported {importedCount} task{importedCount !== 1 ? "s" : ""}.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg transition-colors"
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}

// Preview item component
interface TodoPreviewItemProps {
  todo: ImportedTodo;
  selected: boolean;
  onToggle: () => void;
}

function TodoPreviewItem({ todo, selected, onToggle }: TodoPreviewItemProps) {
  return (
    <label className="flex items-start gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${
              todo.isCompleted ? "line-through text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {todo.title}
          </span>
          {todo.isCompleted && (
            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
              Done
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
          {todo.assignedPeople.map((person, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded"
            >
              👤 {person}
            </span>
          ))}
          {todo.dueDate && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              📅 {todo.dueDate}
            </span>
          )}
          {todo.priority && (
            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
              ‼️ {todo.priority}
            </span>
          )}
          {todo.project && (
            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
              📁 {todo.project}
            </span>
          )}
          {todo.tags.map((tag, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded"
            >
              #{tag}
            </span>
          ))}
          {todo.subtasks.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
              ✅ {todo.subtasks.length} subtask{todo.subtasks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {todo.notes && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{todo.notes}</p>}
      </div>
    </label>
  );
}
