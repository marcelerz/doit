"use client";

import { useState, useMemo } from "react";
import { getEnabledViews } from "@/types/viewRegistry";
import { FeatureSettings } from "@/types/settings";
import { Modal } from "@/components/shared/Modal";
import { CloseIcon } from "@/components/shared/Icons";

type HelpSection =
  | "getting-started"
  | "quick-start"
  | "views"
  | "input"
  | "filtering"
  | "people-projects"
  | "time-tracking"
  | "keyboard"
  | "settings"
  | "workflows"
  | "productivity"
  | "advanced";

interface HelpSectionData {
  id: HelpSection;
  title: string;
  icon: string;
}

const sections: HelpSectionData[] = [
  { id: "getting-started", title: "Getting Started", icon: "🚀" },
  { id: "quick-start", title: "Quick Start Guide", icon: "⚡" },
  { id: "views", title: "Views", icon: "👁️" },
  { id: "input", title: "Smart Input", icon: "✏️" },
  { id: "filtering", title: "Filtering & Sorting", icon: "🔍" },
  { id: "people-projects", title: "People & Projects", icon: "👥" },
  { id: "time-tracking", title: "Time & Focus", icon: "⏱️" },
  { id: "keyboard", title: "Keyboard Shortcuts", icon: "⌨️" },
  { id: "settings", title: "Settings", icon: "🔧" },
  { id: "workflows", title: "Workflows & Tutorials", icon: "📖" },
  { id: "productivity", title: "Productivity Techniques", icon: "💡" },
  { id: "advanced", title: "Advanced Features", icon: "⚙️" },
];

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTutorial?: () => void;
  /** Which views this user has enabled; the digit shortcuts index into them. */
  features?: FeatureSettings;
}

/** " (3)" for a view that has a digit key, or "" for one that does not. */
function shortcutFor(shortcuts: ViewShortcuts, label: string): string {
  const match = shortcuts.bound.find((entry) => entry.label === label);
  return match ? ` (${match.key})` : "";
}

interface ViewShortcuts {
  /** Views that have a digit key, in order. */
  bound: { key: string; label: string }[];
  /** Views past the ninth, which cannot be bound to a single digit. */
  unbound: string[];
  /** Display form of the bound range, e.g. "1-9". */
  range: string;
}

/**
 * The digit shortcuts as this user actually has them.
 *
 * The numbers index into getEnabledViews, so which view "5" opens depends on
 * the feature flags. Every mention of them here used to be written out by
 * hand, and had drifted to a list of eight that no longer matched anything.
 */
function useViewShortcuts(features: FeatureSettings | undefined): ViewShortcuts {
  return useMemo(() => {
    const views = getEnabledViews(features);
    // Only single digits can be bound, so views past the ninth have no key.
    const bound = views.slice(0, 9).map((view, index) => ({ key: String(index + 1), label: view.label }));
    return {
      bound,
      unbound: views.slice(9).map((view) => view.label),
      range: bound.length === 0 ? "" : bound.length === 1 ? "1" : `1-${bound.length}`,
    };
  }, [features]);
}

export function HelpOverlay({ isOpen, onClose, onRestartTutorial, features }: HelpOverlayProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>("getting-started");
  const shortcuts = useViewShortcuts(features);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" label="Help">
      <div className="flex flex-col h-[80vh] max-h-[800px]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                ❓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Help & Documentation</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Learn how to use Doit effectively</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 mt-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="mr-1">{section.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "getting-started" && <GettingStartedSection onRestartTutorial={onRestartTutorial} />}
          {activeSection === "quick-start" && <QuickStartSection />}
          {activeSection === "views" && <ViewsSection shortcuts={shortcuts} />}
          {activeSection === "input" && <InputSection />}
          {activeSection === "filtering" && <FilteringSection />}
          {activeSection === "people-projects" && <PeopleProjectsSection />}
          {activeSection === "time-tracking" && <TimeTrackingSection />}
          {activeSection === "keyboard" && <KeyboardSection shortcuts={shortcuts} />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "workflows" && <WorkflowsSection />}
          {activeSection === "productivity" && <ProductivityTechniquesSection />}
          {activeSection === "advanced" && <AdvancedSection />}
        </div>
      </div>
    </Modal>
  );
}

function GettingStartedSection({ onRestartTutorial }: { onRestartTutorial?: () => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🚀 Getting Started</h3>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome to Doit! This powerful todo app helps you manage tasks efficiently with smart input, multiple views,
          and flexible organization. Here&apos;s a quick overview to get you started:
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg mt-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🎯 First 5 Minutes</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-2">
            <li>
              <strong>Create a task:</strong> Type in the input field and press Enter
            </li>
            <li>
              <strong>Complete it:</strong> Click the checkbox next to your task
            </li>
            <li>
              <strong>Add details:</strong> Click on a task to open the detail view
            </li>
            <li>
              <strong>Try views:</strong> Press 1-4 to switch between List, Kanban, Gantt, Calendar
            </li>
            <li>
              <strong>Get help:</strong> Press ? anytime to return here
            </li>
          </ol>
        </div>

        <div className="space-y-4 mt-6">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📝 Step 1: Create Your First Task</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>The input field at the top is where everything starts. Here&apos;s how:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Click the input field (or press{" "}
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">N</kbd>)
                </li>
                <li>
                  Type your task:{" "}
                  <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Buy groceries tomorrow</code>
                </li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Enter</kbd> to
                  create it
                </li>
                <li>Notice &quot;tomorrow&quot; was auto-detected as a due date! ✨</li>
              </ol>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Step 2: Complete Tasks</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Mark tasks as done when you finish them:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click the checkbox (circle) next to any task</li>
                <li>The task moves to the &quot;Completed&quot; section</li>
                <li>Completed tasks auto-archive after 7 days (configurable in Settings)</li>
                <li>The checkbox outline color shows the task&apos;s priority</li>
              </ol>
              <p className="mt-2 text-zinc-500 italic">💡 Tip: Deleted the wrong thing? Hit Undo in the notification.</p>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">👁️ Step 3: Explore Views</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Doit offers multiple ways to see your tasks. Try switching views:</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">📋 List (press 1)</span>
                  <p className="text-xs text-zinc-500">Traditional list with filters</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">📊 Kanban (press 2)</span>
                  <p className="text-xs text-zinc-500">Drag tasks between columns</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">📅 Gantt (press 3)</span>
                  <p className="text-xs text-zinc-500">Timeline with scheduling</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">🗓️ Calendar (press 4)</span>
                  <p className="text-xs text-zinc-500">Monthly calendar view</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">👥 Step 4: Add People & Projects</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Organize tasks with people and projects:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">5</kbd> to go to
                  People view
                </li>
                <li>Click &quot;Add Person&quot; and enter a name (e.g., &quot;John&quot;)</li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">6</kbd> to go to
                  Projects view
                </li>
                <li>Click &quot;Add Project&quot; and enter a name (e.g., &quot;Website&quot;)</li>
                <li>
                  Now create a task:{" "}
                  <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Review design @John %Website</code>
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔍 Step 5: Click for Details</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Every task has a rich detail view:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click on any task to open its detail overlay</li>
                <li>Here you can edit the text, add comments, set due dates</li>
                <li>Add duration estimates, subtasks, and dependencies</li>
                <li>View activity history to see all changes</li>
                <li>
                  Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Esc</kbd> to close
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4 border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">🎓 Next Steps</h4>
          <ul className="text-sm text-green-800 dark:text-green-200 list-disc list-inside space-y-1">
            <li>
              Check out the <strong>Quick Start Guide</strong> tab for a hands-on tutorial
            </li>
            <li>
              Learn about <strong>Smart Input</strong> to add tasks faster
            </li>
            <li>
              Explore <strong>Workflows & Tutorials</strong> for common use cases
            </li>
            <li>
              Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs">/</kbd> to search your
              tasks
            </li>
          </ul>
          {onRestartTutorial && (
            <button
              onClick={onRestartTutorial}
              className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>🎯</span>
              <span>Start Interactive Tutorial</span>
            </button>
          )}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💾 About Your Data</h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            All your data is stored locally in your browser (IndexedDB). Nothing is sent to any server.
            <strong> Create regular backups</strong> in Settings → Backup to protect your data. You can export and
            import your entire task database anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickStartSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⚡ Quick Start Guide</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Follow this step-by-step tutorial to learn the basics in 10 minutes. Try each step as you read!
      </p>

      {/* Tutorial 1: Creating Tasks */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-blue-500 text-white px-4 py-2 font-semibold">📝 Tutorial 1: Creating Tasks (2 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Press N or click the input field</p>
              <p className="mt-1">The cursor should be in the &quot;Add a new todo...&quot; field at the top.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Type a simple task</p>
              <p className="mt-1">
                Try: <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">Call dentist</code>
              </p>
              <p className="mt-1">Press Enter. Your task appears in the list!</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Now try a task with a date</p>
              <p className="mt-1">
                Type: <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">Buy milk tomorrow</code>
              </p>
              <p className="mt-1">
                Notice how &quot;tomorrow&quot; gets highlighted? It&apos;s auto-detected as a due date!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Try more date formats</p>
              <p className="mt-1">
                These all work: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">next friday</code>,{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">in 3 days</code>,{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Dec 25</code>,{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">eod</code> (end of day)
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Creating tasks with automatic date detection
          </div>
        </div>
      </div>

      {/* Tutorial 2: Using Markers */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-purple-500 text-white px-4 py-2 font-semibold">🏷️ Tutorial 2: Using Markers (3 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">First, create a person</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">5</kbd> to go to
                People view → Click &quot;Add Person&quot; → Enter &quot;John&quot; → Save
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create a project</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">6</kbd> to go to
                Projects view → Click &quot;Add Project&quot; → Enter &quot;Website&quot; → Save
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Go back to List view</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">1</kbd> to return to
                the task list.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Use markers in your task</p>
              <p className="mt-1">
                Type:{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                  Review homepage @John %Website !!high
                </code>
              </p>
              <p className="mt-1">Watch the text highlight as you type each marker!</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 px-2 font-medium text-zinc-900 dark:text-zinc-100">Marker</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-900 dark:text-zinc-100">Meaning</th>
                  <th className="text-left py-2 px-2 font-medium text-zinc-900 dark:text-zinc-100">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                <tr>
                  <td className="py-2 px-2 font-mono text-blue-600 dark:text-blue-400">@</td>
                  <td className="py-2 px-2">Assign to person</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">@John</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-green-600 dark:text-green-400">$</td>
                  <td className="py-2 px-2">Source/requester</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">$Sarah</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-purple-600 dark:text-purple-400">%</td>
                  <td className="py-2 px-2">Project</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">%Website</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-red-600 dark:text-red-400">!!</td>
                  <td className="py-2 px-2">Priority</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">!!urgent</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-mono text-cyan-600 dark:text-cyan-400">#</td>
                  <td className="py-2 px-2">Tag</td>
                  <td className="py-2 px-2">
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">#frontend</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Using @, $, %, !!, and # markers to add metadata
          </div>
        </div>
      </div>

      {/* Tutorial 3: Managing Tasks */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-green-500 text-white px-4 py-2 font-semibold">✅ Tutorial 3: Managing Tasks (2 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Complete a task</p>
              <p className="mt-1">Click the checkbox (circle) next to &quot;Call dentist&quot; to mark it complete.</p>
              <p className="mt-1">The task moves to the &quot;Completed&quot; section with a strikethrough.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Undo a mistake</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Undo</kbd> in the
                notification that appears.
              </p>
              <p className="mt-1">The task returns to Active. The button stays for ten seconds.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Open task details</p>
              <p className="mt-1">Click on any task text to open the detail overlay.</p>
              <p className="mt-1">Here you can edit everything: text, dates, duration, comments, subtasks.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Add a comment</p>
              <p className="mt-1">In the detail overlay, scroll to &quot;Comments&quot; section.</p>
              <p className="mt-1">Type a note and press Enter. Comments are great for tracking progress!</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
              5
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Close the overlay</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">Esc</kbd> or click
                outside to close.
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Completing tasks, undo/redo, and using the detail view
          </div>
        </div>
      </div>

      {/* Tutorial 4: Filtering */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-orange-500 text-white px-4 py-2 font-semibold">🔍 Tutorial 4: Finding Tasks (3 minutes)</div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              1
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Search for tasks</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">/</kbd> to focus the
                search bar.
              </p>
              <p className="mt-1">Type part of a task name. Results filter instantly!</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              2
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Open the filters panel</p>
              <p className="mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">F</kbd> or click the
                filter button.
              </p>
              <p className="mt-1">You&apos;ll see filter buttons for people, projects, priorities, and more.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              3
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Filter by person</p>
              <p className="mt-1">Click on &quot;John&quot; in the Assigned filter section.</p>
              <p className="mt-1">Only tasks assigned to John are shown. Click again to remove the filter.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              4
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Change grouping</p>
              <p className="mt-1">Find the &quot;Group by&quot; dropdown (usually says &quot;None&quot;).</p>
              <p className="mt-1">Change it to &quot;Project&quot; or &quot;Priority&quot; to organize your view.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              5
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Save as a preset (optional)</p>
              <p className="mt-1">Like this view? Click the presets icon (star/bookmark) to save it.</p>
              <p className="mt-1">Give it a name like &quot;John&apos;s Tasks&quot; for quick access later.</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
            ✅ <strong>You learned:</strong> Searching, filtering, grouping, and saving view presets
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">🎉 You&apos;re Ready!</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          You now know the basics of Doit! Explore the other help sections to learn about:
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Views:</strong> Kanban boards, Gantt charts, and Calendar
          </li>
          <li>
            <strong>Time & Focus:</strong> Time tracking and Pomodoro techniques
          </li>
          <li>
            <strong>Advanced:</strong> Recurring tasks, dependencies, subtasks, sprints
          </li>
          <li>
            <strong>Workflows:</strong> Common use cases and best practices
          </li>
        </ul>
      </div>
    </div>
  );
}

function ViewsSection({ shortcuts }: { shortcuts: ViewShortcuts }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">👁️ Views</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Doit offers multiple views to visualize and manage your tasks. Switch views using tabs or number keys{" "}
        <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">{shortcuts.range}</kbd>.
      </p>

      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"📋 List View"}{shortcutFor(shortcuts, "List")}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            The default view showing all your tasks in a list format. Features include:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Filter by status (Active, Completed, Archived)</li>
            <li>Group by person, project, priority, due date, sprint, or category</li>
            <li>Sort by created date, due date, priority, title, or manual order</li>
            <li>Quick search across all task fields</li>
            <li>Save and load custom view presets</li>
            <li>Drag-and-drop manual reordering</li>
          </ul>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📊 Kanban Board (2)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            A visual board for managing tasks through workflow states:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Drag and drop tasks between columns</li>
            <li>Customizable workflow states (Backlog, To Do, In Progress, Review, Done, Archived)</li>
            <li>Filter by sprint (All, Backlog, or specific sprint)</li>
            <li>Create custom views showing different state combinations</li>
            <li>Configure allowed state transitions in Settings</li>
            <li>Cards show priority, assignee, due date, and more</li>
          </ul>
        </div>

        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">📅 Gantt Chart (3)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Timeline visualization for planning and scheduling:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>View tasks on a horizontal timeline</li>
            <li>Three scheduling techniques: Sequential, Pomodoro, and Flow</li>
            <li>Customizable time blocks (meetings, focus time, lunch, breaks)</li>
            <li>Group tasks by project</li>
            <li>Shows dependencies between tasks</li>
            <li>Click &quot;Start Focus&quot; to enter focus mode from any task</li>
          </ul>
        </div>

        <div className="border-l-4 border-orange-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"🗓️ Calendar View"}{shortcutFor(shortcuts, "Calendar")}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Monthly calendar showing tasks by due date:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Colored dots indicate tasks on each day (by state, priority, or project)</li>
            <li>Click a day to see all tasks due</li>
            <li>Navigate between months</li>
            <li>Week numbers and overdue badges (optional)</li>
            <li>Shows recurring task indicators</li>
          </ul>
        </div>

        <div className="border-l-4 border-cyan-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"👥 People View"}{shortcutFor(shortcuts, "People")}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Manage your contacts with dedicated features:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create people with names and alternative names (nicknames)</li>
            <li>Add context notes and comments</li>
            <li>Custom colors for highlighting in tasks</li>
            <li>See task counts per person</li>
            <li>Archive inactive people</li>
          </ul>
        </div>

        <div className="border-l-4 border-indigo-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"📁 Projects View"}{shortcutFor(shortcuts, "Projects")}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Organize work into projects with categories:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create projects with alternative names</li>
            <li>Assign projects to categories (Work, Personal, etc.)</li>
            <li>Custom colors for project badges</li>
            <li>Add context notes and comments</li>
            <li>Archive completed projects</li>
          </ul>
        </div>

        <div className="border-l-4 border-pink-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"🏃 Sprints View"}{shortcutFor(shortcuts, "Sprints")}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Scrum-style sprint planning:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create time-boxed sprints with goals and dates</li>
            <li>Sprint statuses: Planning, Active, Completed, Cancelled</li>
            <li>Assign tasks to sprints via the task detail view</li>
            <li>Filter Kanban board by sprint</li>
            <li>Track sprint progress</li>
          </ul>
        </div>

        <div className="border-l-4 border-yellow-500 pl-4">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{"📈 Statistics View"}{shortcutFor(shortcuts, "Stats")}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Analytics and insights:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Task completion rates over time</li>
            <li>Distribution by person, project, and priority</li>
            <li>Productivity trends</li>
            <li>Time tracking summaries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InputSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">✏️ Smart Input</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The smart input field automatically detects metadata as you type, saving you time and clicks.
      </p>

      {/* Step by Step Input Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">
          📝 Step-by-Step: Creating a Task with Metadata
        </h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">N</kbd> or click the
              input field
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>
              Type your task: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">Review PR</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>
              Add who: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">@John</code> (type @ then the name)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>
              Add when: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">tomorrow</code> (auto-detected!)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>
              Add project: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">%Website</code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">6.</span>
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Enter</kbd> to create!
            </span>
          </li>
        </ol>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 italic">
          Final input:{" "}
          <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">Review PR @John tomorrow %Website</code>
        </p>
      </div>

      {/* Markers Table */}
      <div>
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">🏷️ Available Markers</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Marker</th>
                <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Purpose</th>
                <th className="text-left py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr>
                <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">@name</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Assign to person</td>
                <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Review PR @John</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-green-600 dark:text-green-400">$name</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Source person (who requested)</td>
                <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Fix bug $Sarah</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-purple-600 dark:text-purple-400">%project</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Link to project</td>
                <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Update docs %Website</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-red-600 dark:text-red-400">!!priority</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Set priority</td>
                <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Deploy hotfix !!urgent</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-cyan-600 dark:text-cyan-400">#tag</td>
                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">Add tag</td>
                <td className="py-2 px-3 text-zinc-500 dark:text-zinc-500">Research #frontend #react</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-Detection Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">
          🪄 Auto-Detection (No Markers Needed!)
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          These patterns are automatically detected without typing any markers:
        </p>

        <div className="space-y-3">
          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">📅 Dates</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Natural:</strong> tomorrow, next friday, Dec 25, in 3 days, next week
              </p>
              <p>
                <strong>Shortcuts:</strong> eod (end of day), bow (beginning of week), eom (end of month)
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Call client next tuesday</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">🔄 Recurring Patterns</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Intervals:</strong> every day, every 2 weeks, every 3 months
              </p>
              <p>
                <strong>Weekdays:</strong> every monday, every friday, every workday
              </p>
              <p>
                <strong>Nth days:</strong> every first monday, every last friday
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Weekly standup every monday</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">👤 People Mentions</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Direct names:</strong> Just type a person&apos;s name (if they exist)
              </p>
              <p>
                <strong>Source context:</strong> &quot;from John&quot;, &quot;via Sarah&quot;, &quot;per Mike&quot;
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Review feedback from Sarah</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">📁 Projects</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>With context:</strong> &quot;on Project&quot;, &quot;for Project&quot;, &quot;in Project&quot;
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Update docs on Website</code>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">⚡ Priorities</h5>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <strong>Keywords:</strong> urgent, high, medium, low (and their alternatives)
              </p>
              <p>
                <strong>Try it:</strong>{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Fix security bug urgent</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Shortcuts Reference */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">📅 Date Shorthand Reference</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-green-800 dark:text-green-200">
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">today</code> - Today
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">tomorrow</code> - Tomorrow
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eod</code> - End of day
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">bod</code> - Beginning of day
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">bow</code> - Beginning of week
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eow</code> - End of week
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">bom</code> - Beginning of month
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eom</code> - End of month
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">boq</code> - Beginning of quarter
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">eoq</code> - End of quarter
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">morning</code> - Morning time
          </div>
          <div>
            <code className="bg-green-200 dark:bg-green-800 px-1 rounded">afternoon</code> - Afternoon time
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">💡 Input Tips</h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside space-y-1">
          <li>
            <strong>Deactivate auto-detection:</strong> Click on a detected token to turn it off
          </li>
          <li>
            <strong>What stays in text:</strong> People with @/$ markers stay visible in the task
          </li>
          <li>
            <strong>What&apos;s removed:</strong> Dates, recurring patterns, and duration are removed from text
          </li>
          <li>
            <strong>No marker for:</strong> Duration and dependencies - set these in the detail view
          </li>
          <li>
            <strong>Keyboard:</strong> Press Enter to create, Escape to cancel
          </li>
        </ul>
      </div>

      {/* Complex Example */}
      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-2">🎯 Complex Example</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Try typing this all-in-one task:</p>
        <code className="block bg-white dark:bg-zinc-900 p-3 rounded text-sm border border-zinc-300 dark:border-zinc-700">
          Review homepage design @John %Website !!high tomorrow #design #frontend
        </code>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          This creates a task assigned to John, linked to Website project, high priority, due tomorrow, with design and
          frontend tags.
        </p>
      </div>
    </div>
  );
}

function FilteringSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🔍 Filtering & Sorting</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔎 Search</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Use the search bar (or press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">/</kbd>) to find tasks. Search
            looks across:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Task text and plain text</li>
            <li>Comments</li>
            <li>Assigned people and source</li>
            <li>Projects and tags</li>
            <li>Context notes</li>
          </ul>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 italic">
            Search history is saved automatically. Click on the search field to see recent searches.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎛️ Filters</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Click the filter button (or press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">F</kbd>) to show filter options.
            Available filters:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Assigned person
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Source person
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Project
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Mentioned people
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Priority
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span> Due date range
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Duration
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Tags
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Recurring tasks
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dependencies
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 italic">
            Filter buttons are colored using your configured marker colors from Settings.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📂 Grouping</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Group tasks to organize your view. Available grouping options:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>None:</strong> Flat list of all tasks
            </li>
            <li>
              <strong>Person:</strong> Group by assigned person
            </li>
            <li>
              <strong>Project:</strong> Group by project
            </li>
            <li>
              <strong>Priority:</strong> Group by priority level
            </li>
            <li>
              <strong>Due Date:</strong> Group by due date (Overdue, Today, This Week, Later, etc.)
            </li>
            <li>
              <strong>Sprint:</strong> Group by sprint assignment
            </li>
            <li>
              <strong>Category:</strong> Group by project category
            </li>
          </ul>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2 italic">
            Click on group headers to collapse/expand sections.
          </p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">↕️ Sorting</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Sort tasks by these fields:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Created date (newest/oldest first)</li>
            <li>Updated date</li>
            <li>Due date (soonest/latest first)</li>
            <li>Priority (highest/lowest first)</li>
            <li>Title (alphabetical)</li>
            <li>Manual order (drag to reorder)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 View Presets</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Save your current filter, sort, and group settings as a preset. Quickly switch between different views for
            different workflows (e.g., &quot;My Tasks&quot;, &quot;Team Overview&quot;, &quot;Due This Week&quot;).
          </p>
        </div>
      </div>
    </div>
  );
}

function PeopleProjectsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">👥 People & Projects</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">👤 Creating People</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Go to the People view and click &quot;Add Person&quot;. You can configure:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Name:</strong> The primary name for the person
            </li>
            <li>
              <strong>Alternatives:</strong> Nicknames or variations (e.g., &quot;Johnny&quot;, &quot;JD&quot;)
            </li>
            <li>
              <strong>Context:</strong> Role, department, notes, or any other info (rich text supported)
            </li>
            <li>
              <strong>Color:</strong> Custom highlight color (or use default marker color)
            </li>
            <li>
              <strong>Comments:</strong> Add notes with full edit history
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📁 Creating Projects</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Go to the Projects view and click &quot;Add Project&quot;. Projects have:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Name:</strong> The primary project name
            </li>
            <li>
              <strong>Alternatives:</strong> Other names or abbreviations
            </li>
            <li>
              <strong>Category:</strong> Work, Personal, or custom categories
            </li>
            <li>
              <strong>Context:</strong> Description, goals, or notes
            </li>
            <li>
              <strong>Color:</strong> Custom color for project badges
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏷️ Categories</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Organize projects into categories (e.g., Work, Personal, Client A). Configure categories in Settings →
            Categories. Categories help you:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Group related projects together</li>
            <li>Filter tasks by category</li>
            <li>Apply category-specific time blocks in Gantt view</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✨ Using in Tasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Reference people and projects in your tasks:</p>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <code className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">
                @John
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Assign task to John (shows in blue)</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-mono">
                $Sarah
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Mark Sarah as source/requester (shows in green)</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-mono">
                %Website
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Link to Website project (shows in purple)</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded font-mono">
                John
              </code>
              <span className="text-zinc-600 dark:text-zinc-400">Auto-detected mention (shows in yellow/orange)</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📦 Archiving</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Archive people or projects you no longer need. Archived items:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Won&apos;t appear in dropdowns when creating tasks</li>
            <li>Remain linked to existing tasks</li>
            <li>Can be viewed by toggling &quot;Show Archived&quot;</li>
            <li>Can be unarchived anytime</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Pro Tip: Alternative Names</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Add alternative names for better auto-detection. For example, if you have a person named &quot;John
            Doe&quot; with alternatives &quot;Johnny&quot; and &quot;JD&quot;, typing any of these in a task will
            automatically highlight them.
          </p>
        </div>
      </div>
    </div>
  );
}

function KeyboardSection({ shortcuts }: { shortcuts: ViewShortcuts }) {
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

function TimeTrackingSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⏱️ Time Tracking & Focus Mode</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏱️ Time Tracking</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Track time spent on tasks directly from the task detail view:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Click &quot;Start Timer&quot; to begin tracking</li>
            <li>Pause and resume as needed</li>
            <li>Add manual time entries</li>
            <li>View total time tracked per task</li>
            <li>Compare actual vs. estimated time</li>
            <li>Time entries are stored with timestamps and optional notes</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎯 Focus Mode</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter a distraction-free mode to work through your tasks sequentially:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Start from the Gantt view by clicking &quot;Start Focus&quot; on any task</li>
            <li>Full-screen timer with task details</li>
            <li>Automatic time tracking</li>
            <li>Notifications when tasks complete or breaks start</li>
            <li>Preview of the next task during breaks</li>
            <li>Session statistics (tasks completed, time worked)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🍅 Scheduling Techniques</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The Gantt view supports three scheduling techniques:
          </p>
          <div className="mt-3 space-y-3">
            <div className="pl-3 border-l-2 border-blue-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">📋 Sequential</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Simple task-to-task scheduling with configurable context switching time between tasks.
              </p>
            </div>
            <div className="pl-3 border-l-2 border-red-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">🍅 Pomodoro</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Work in focused sessions (default 25 min) with short breaks (5 min) and long breaks (15 min) after every
                4 sessions. Includes audio notifications.
              </p>
            </div>
            <div className="pl-3 border-l-2 border-green-500">
              <h5 className="font-medium text-zinc-900 dark:text-zinc-100">🌊 Flow</h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Extended focus sessions (default 52 min) with longer breaks (17 min). Based on the 52/17 method or
                Ultradian rhythm.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔔 Notifications & Sounds</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Configure alerts in Settings → Focus:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Browser notifications for breaks and task events</li>
            <li>Sound alerts (different tones for short/long breaks)</li>
            <li>Optional confirmation before starting breaks</li>
            <li>Ambient sounds during work and break phases</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏰ Time Blocks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Block out parts of your day in Settings → Work Hours:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set work hours for each day</li>
            <li>Add blocks: Break ☕, Lunch 🍴, Meeting 👥, Focus Time 🎯, Commute 🚗, Personal 🏠</li>
            <li>Custom colors per block type</li>
            <li>Different schedules for weekdays vs. weekends</li>
            <li>Tasks automatically schedule around your blocks</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Time Tracking Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>Set duration estimates on tasks to compare actual vs. planned time</li>
          <li>Use Focus Mode to automatically track time while working</li>
          <li>Review tracked time in the Statistics view</li>
          <li>Extend the timer if you need more time (press + in Focus Mode)</li>
        </ul>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🔧 Settings</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Access settings via the gear icon in the header. Settings are organized into tabs:
      </p>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⚙️ General</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Theme:</strong> Light, Dark, or System preference
            </li>
            <li>
              <strong>Auto-Archive:</strong> Days before completed tasks are archived (default: 7)
            </li>
            <li>
              <strong>Auto-Delete:</strong> Days before archived tasks are deleted (default: 90)
            </li>
            <li>
              <strong>Feature Toggles:</strong> Enable/disable views and features to simplify the interface
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎨 Priorities</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Create custom priority levels (default: Urgent, High, Medium, Low)</li>
            <li>Set custom colors for each priority</li>
            <li>Add alternative names (e.g., &quot;asap&quot; for &quot;urgent&quot;)</li>
            <li>Drag to reorder priority levels</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏷️ Categories</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Organize projects into categories (Work, Personal, etc.)</li>
            <li>Custom colors per category</li>
            <li>Filter and group tasks by category</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎨 Markers</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Customize colors for each marker type (@, $, %, !!, #, etc.)</li>
            <li>Colors apply to highlighting in the input and task display</li>
            <li>Filter buttons also use these colors</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📅 Date/Time</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Time-of-day:</strong> Set times for morning, noon, afternoon, evening shortcuts
            </li>
            <li>
              <strong>Work Week Start:</strong> Sunday or Monday
            </li>
            <li>
              <strong>Fiscal Year Start:</strong> Month when the fiscal year begins, used for Review periods
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🕐 Work Hours</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Set daily work hours (start/end times)</li>
            <li>Add time blocks (lunch, meetings, focus time, breaks)</li>
            <li>Different schedules for weekdays vs. weekends</li>
            <li>Per-day custom schedules if needed</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📊 Gantt & Calendar</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Gantt:</strong> Scheduling technique (Sequential, Pomodoro, Flow), presets, zoom level
            </li>
            <li>
              <strong>Calendar:</strong> Week start day, dot colors, task limits per day
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📋 Kanban</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Workflow States:</strong> Add/edit/reorder columns with custom colors and icons
            </li>
            <li>
              <strong>Transitions:</strong> Define which states can move to which others
            </li>
            <li>
              <strong>Views:</strong> Create custom views showing different state combinations
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔄 Auto-Assign</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Set default values for new tasks. When enabled, new tasks automatically get:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Default assigned person</li>
            <li>Default project</li>
            <li>Default priority (default: Medium)</li>
            <li>Default due date (default: Today)</li>
            <li>Default duration (default: 30 minutes)</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 Backup & Import</h4>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>Backup:</strong> Export all data as JSON (tasks, people, projects, settings)
            </li>
            <li>
              <strong>Restore:</strong> Import from a backup file
            </li>
            <li>
              <strong>Export:</strong> Export tasks in Markdown, CSV, or JSON format
            </li>
            <li>
              <strong>Import:</strong> Import tasks from external sources
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Links</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Define link patterns to auto-detect references in task text:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              Set a prefix (e.g., &quot;T&quot;) and URL template (e.g.,
              &quot;https://jira.com/browse/&#123;id&#125;&quot;)
            </li>
            <li>Text like &quot;T-123&quot; becomes a clickable link</li>
            <li>Custom colors per link pattern</li>
          </ul>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">💡 Simplify Your Interface</h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          Don&apos;t need all features? Go to Settings → General → Feature Toggles to disable views (Gantt, Calendar,
          Kanban, Sprints, Stats) and features (Templates, Batch Processing, Focus Mode) you don&apos;t use.
        </p>
      </div>
    </div>
  );
}

function WorkflowsSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">📖 Workflows & Tutorials</h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Learn how to use Doit effectively with these common workflows and step-by-step guides.
      </p>

      {/* Workflow 1: Daily Planning */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
          <h4 className="font-semibold">☀️ Daily Planning Workflow</h4>
          <p className="text-sm text-blue-100 mt-1">Start each day organized and focused</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Review overdue tasks</p>
              <p className="text-xs mt-0.5">Open List view → Filter by &quot;Overdue&quot; in Due Dates section</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Check today&apos;s tasks</p>
              <p className="text-xs mt-0.5">Filter by &quot;Today&quot; to see what&apos;s due</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Plan in Gantt view</p>
              <p className="text-xs mt-0.5">Press 3 for Gantt → See your day laid out on a timeline</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Start Focus Mode</p>
              <p className="text-xs mt-0.5">Click &quot;Start Focus&quot; on any task to work with a timer</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use the Pomodoro scheduling technique for structured work sessions with breaks
          </div>
        </div>
      </div>

      {/* Workflow 2: Team Task Assignment */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3">
          <h4 className="font-semibold">👥 Team Task Assignment</h4>
          <p className="text-sm text-purple-100 mt-1">Delegate and track work for your team</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Set up your team</p>
              <p className="text-xs mt-0.5">People view (5) → Add each team member with role in Context field</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create project tasks</p>
              <p className="text-xs mt-0.5">
                Use:{" "}
                <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">
                  Task name @John %Project !!high tomorrow
                </code>
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">View by person</p>
              <p className="text-xs mt-0.5">Group by &quot;Person&quot; to see each team member&apos;s workload</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Track in Kanban</p>
              <p className="text-xs mt-0.5">Press 2 for Kanban → Drag tasks through workflow stages</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use $name to track who requested a task (e.g.,{" "}
            <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Fix bug $Sarah</code>)
          </div>
        </div>
      </div>

      {/* Workflow 3: Sprint Planning */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3">
          <h4 className="font-semibold">🏃 Sprint Planning (Agile)</h4>
          <p className="text-sm text-green-100 mt-1">Plan and execute time-boxed sprints</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create a sprint</p>
              <p className="text-xs mt-0.5">Sprints view (7) → Add Sprint → Set name, goal, dates (usually 2 weeks)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Assign tasks to sprint</p>
              <p className="text-xs mt-0.5">
                Open task detail → Set &quot;Sprint&quot; dropdown, or batch-select tasks
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Activate the sprint</p>
              <p className="text-xs mt-0.5">Click &quot;Set Active&quot; on the sprint to start working</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Track on Kanban</p>
              <p className="text-xs mt-0.5">Kanban view (2) → Filter by sprint → Move tasks through columns</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
              5
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Complete sprint</p>
              <p className="text-xs mt-0.5">Mark sprint as &quot;Completed&quot; → Review in Statistics view (8)</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Group by Sprint in List view to see all sprint tasks at once
          </div>
        </div>
      </div>

      {/* Workflow 4: Project Management */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3">
          <h4 className="font-semibold">📁 Project Management</h4>
          <p className="text-sm text-orange-100 mt-1">Organize work into projects with dependencies</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create the project</p>
              <p className="text-xs mt-0.5">Projects view (6) → Add Project → Set category (Work, Personal, etc.)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Break down into tasks</p>
              <p className="text-xs mt-0.5">
                Create tasks with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">%ProjectName</code> marker
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Add dependencies</p>
              <p className="text-xs mt-0.5">
                Open task detail → &quot;Blocked By&quot; field → Select prerequisite tasks
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Use subtasks for complex items</p>
              <p className="text-xs mt-0.5">Open task detail → Add subtasks → Check off as completed</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
              5
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Visualize in Gantt</p>
              <p className="text-xs mt-0.5">
                Gantt view (3) → Enable &quot;Group by Project&quot; → See dependencies as arrows
              </p>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use{" "}
            <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">on ProjectName</code> or{" "}
            <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">for ProjectName</code> for auto-detection
            without markers
          </div>
        </div>
      </div>

      {/* Workflow 5: Recurring Tasks */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-3">
          <h4 className="font-semibold">🔄 Setting Up Recurring Tasks</h4>
          <p className="text-sm text-cyan-100 mt-1">Automate repetitive tasks</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create with &quot;every&quot; pattern</p>
              <p className="text-xs mt-0.5">
                Type: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Weekly review every friday</code>
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">The pattern auto-detects</p>
              <p className="text-xs mt-0.5">
                Watch &quot;every friday&quot; highlight → First due date is set automatically
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Complete and regenerate</p>
              <p className="text-xs mt-0.5">When you complete the task, a new one is created for next Friday</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
            <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Supported patterns:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every day</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every 2 weeks</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every monday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every workday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every first monday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every last friday</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every 3 months</code>
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">every year</code>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow 6: Batch Operations */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-3">
          <h4 className="font-semibold">⚡ Batch Operations</h4>
          <p className="text-sm text-pink-100 mt-1">Edit multiple tasks at once</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Enter selection mode</p>
              <p className="text-xs mt-0.5">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">S</kbd> → Round
                checkboxes appear
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Select tasks</p>
              <p className="text-xs mt-0.5">
                Click tasks to select, or use &quot;Select All&quot; / &quot;Clear All&quot;
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Choose action</p>
              <p className="text-xs mt-0.5">
                Use toolbar: Complete, Archive, Delete, or &quot;Edit&quot; for more options
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Batch edit metadata</p>
              <p className="text-xs mt-0.5">
                Click &quot;Edit&quot; → Change assignee, project, priority, sprint, or due date for all
              </p>
            </div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Use filters first to show only the tasks you want to batch edit
          </div>
        </div>
      </div>

      {/* Workflow 7: Time Blocking */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3">
          <h4 className="font-semibold">📅 Time Blocking Your Day</h4>
          <p className="text-sm text-indigo-100 mt-1">Schedule tasks around meetings and breaks</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Set up work hours</p>
              <p className="text-xs mt-0.5">Settings → Work Hours → Set your daily start/end times</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Add time blocks</p>
              <p className="text-xs mt-0.5">Add blocks for: Lunch 🍴, Meetings 👥, Focus Time 🎯, Breaks ☕</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Set task durations</p>
              <p className="text-xs mt-0.5">Open each task → Set estimated duration (e.g., 30m, 1h)</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">View in Gantt</p>
              <p className="text-xs mt-0.5">Tasks auto-schedule around your blocks → See your planned day</p>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded text-xs">
            <strong>Pro tip:</strong> Choose a scheduling technique (Sequential, Pomodoro, or Flow) in Gantt settings
          </div>
        </div>
      </div>

      {/* Workflow 8: Backup Strategy */}
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3">
          <h4 className="font-semibold">💾 Backup Your Data</h4>
          <p className="text-sm text-amber-100 mt-1">Keep your tasks safe</p>
        </div>
        <div className="p-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Open backup settings</p>
              <p className="text-xs mt-0.5">Settings (gear icon) → Backup tab</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Create a full backup</p>
              <p className="text-xs mt-0.5">Click &quot;Export Backup&quot; → Download JSON file</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Store safely</p>
              <p className="text-xs mt-0.5">Save to cloud storage (Drive, Dropbox) or email to yourself</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
              4
            </span>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">To restore</p>
              <p className="text-xs mt-0.5">Settings → Backup → &quot;Import Backup&quot; → Select your file</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs">
            <strong>⚠️ Important:</strong> All data is stored locally. If you clear browser data, your tasks are gone
            unless you have a backup!
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 More Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>Use templates for tasks you create often (Settings → Templates)</li>
          <li>Create view presets for different contexts (work, personal, urgent)</li>
          <li>Use categories to separate work and personal projects</li>
          <li>Check Statistics view (8) to see your productivity trends</li>
        </ul>
      </div>
    </div>
  );
}

function ProductivityTechniquesSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">💡 Productivity Techniques</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Popular productivity methods you can implement with this app:
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🍅 Pomodoro Technique</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Work in focused 25-minute sessions with 5-minute breaks. After 4 sessions, take a longer 15-30 minute break.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use Pomodoro scheduling mode in Gantt view</li>
            <li>Great for maintaining focus and preventing burnout</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📅 Time Blocking</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Schedule parts of the day for specific categories (deep work, admin, meetings, etc.).
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Block working time in the Work Hours tab in Settings</li>
            <li>Great for managers and people with varied responsibilities</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📥 Getting Things Done (GTD)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Capture everything → clarify → organize → review → do.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use the Kanban board and customize states/transitions to mimic this workflow</li>
            <li>Excellent for people juggling many projects</li>
            <li>More about organization than session timing</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🐸 Eat That Frog</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Do your hardest/most important task first thing in the day.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Assign the priority &quot;Urgent&quot; or &quot;Critical&quot; to prioritize these work items</li>
            <li>Good when prioritization is your main challenge</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📊 Eisenhower Matrix</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Categorize tasks into four quadrants:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>
              <strong>With Due Date + High Priority</strong> → do now
            </li>
            <li>
              <strong>High Priority, no due date</strong> → plan
            </li>
            <li>
              <strong>With Due Date, not high priority</strong> → delegate
            </li>
            <li>
              <strong>Neither</strong> → delete
            </li>
          </ul>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Works well for quickly triaging a long list.</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            ⏱️ The &quot;Just 5 Minutes&quot; Rule
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Commit to working for just five minutes.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use Flow in Kanban settings with 5-minute work time and a short break</li>
            <li>Often breaks the resistance of starting</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Don&apos;t Break the Chain</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Put an &quot;X&quot; on a calendar for each day you make progress.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Track your streaks in the Stats tab—don&apos;t break your streak!</li>
            <li>Useful for habits, learning, coding, daily writing</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⚡ The 2-Minute Rule</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            If something takes less than two minutes, do it immediately.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Use sorting by duration to prioritize short todos</li>
            <li>Good for clearing micro-tasks that create mental clutter</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🎯 MIT Method (Most Important Tasks)</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Pick 2–3 critical tasks for the day. Everything else is secondary.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Good for people overwhelmed by long lists</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📦 Task Batching</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Group similar tasks together to reduce context switching.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Example: email all at once, admin all at once, coding in one chunk</li>
            <li>Block times in Work Hours settings to do batch work</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📋 Kanban / Personal Kanban</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Visual board with To Do → Doing → Done.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Limits the number of tasks &quot;in progress&quot; (WIP limits)</li>
            <li>Reduces overwhelm and context switching</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">⏰ 52/17 Method</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Work 52 minutes, rest 17 minutes.</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Based on a study of high-performing employees</li>
            <li>Ideal if Pomodoro&apos;s short breaks feel too choppy</li>
            <li>Use Flow scheduling mode in Gantt with 52/17 preset</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🌊 Ultradian Rhythm Cycles</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Humans naturally work in 90–120 minute energy cycles.
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside space-y-1">
            <li>Deep work for 90 minutes → 20–30 minute break</li>
            <li>Amazing for high-concentration tasks like coding, writing, or studying</li>
            <li>Use Flow scheduling mode in Gantt with Ultradian Rhythm preset</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AdvancedSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⚙️ Advanced Features</h3>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📝 Templates</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Save frequently used task configurations as templates for quick reuse:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create templates from existing tasks or from scratch</li>
            <li>Include text, metadata (assignee, project, priority, tags), and subtasks</li>
            <li>Quick-apply when creating new tasks</li>
            <li>Track usage count per template</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔄 Recurring Tasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Create recurring tasks that automatically regenerate:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Intervals:</strong> &quot;every day&quot;, &quot;every 2 weeks&quot;, &quot;every 3 months&quot;
            </li>
            <li>
              <strong>Weekdays:</strong> &quot;every monday&quot;, &quot;every friday&quot;, &quot;every workday&quot;
            </li>
            <li>
              <strong>Nth weekdays:</strong> &quot;every first monday&quot;, &quot;every last friday&quot;
            </li>
            <li>When you complete a recurring task, a new instance is automatically created</li>
            <li>The next due date is calculated from the pattern</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🔗 Dependencies</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Link tasks together with dependencies:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set blockers in the task detail view</li>
            <li>Tasks with unfinished dependencies show a blocked indicator</li>
            <li>Complete blockers before completing dependent tasks</li>
            <li>Dependencies show as arrows in the Gantt view</li>
            <li>Filter by tasks with/without dependencies</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Subtasks</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Break down complex tasks into subtasks:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Add subtasks in the task detail view</li>
            <li>Check off subtasks independently</li>
            <li>Progress indicator shows completed/total</li>
            <li>Include subtasks in templates</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">✅ Batch Processing</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs">S</kbd> to enable
            selection mode:
          </p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Click tasks to select/deselect them</li>
            <li>Use &quot;Select All&quot; / &quot;Clear All&quot; buttons</li>
            <li>
              <strong>Batch operations:</strong> Complete, Archive, Delete, Unarchive
            </li>
            <li>
              <strong>Batch edit:</strong> Change assignee, project, priority, sprint, or due date for all selected
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💾 Backup & Export</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Keep your data safe and portable:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Full Backup (JSON):</strong> All tasks, people, projects, sprints, and settings
            </li>
            <li>
              <strong>Export Markdown:</strong> Human-readable task list
            </li>
            <li>
              <strong>Export CSV:</strong> Spreadsheet-compatible format
            </li>
            <li>
              <strong>Import:</strong> Restore from backup or import from other systems
            </li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">🏃 Sprints & Scrum</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Agile-style sprint planning:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Create time-boxed sprints with goals and dates</li>
            <li>Sprint statuses: Planning → Active → Completed/Cancelled</li>
            <li>Assign tasks to sprints</li>
            <li>Filter Kanban board by sprint</li>
            <li>Group tasks by sprint in List view</li>
            <li>Batch-assign sprint to selected tasks</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📚 Activity History</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Track all changes to tasks, people, and projects:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>View activity log in the detail overlay</li>
            <li>See when tasks were created, edited, completed, archived</li>
            <li>Track metadata changes (assignee, project, priority, etc.)</li>
            <li>Comment history with edit timestamps</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">💬 Comments</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Add notes and updates to tasks:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Add comments in the task detail view</li>
            <li>Edit comments (full history preserved)</li>
            <li>Delete comments</li>
            <li>Comments are searchable</li>
            <li>People and projects also support comments</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">↩️ Undo</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Mistakes happen:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Completing, archiving or deleting shows an Undo button for ten seconds</li>
            <li>Creating and editing are not undoable -- edit again to change them back</li>
            <li>Works with batch operations too</li>
          </ul>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">📏 Manual Reordering</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Drag tasks to set custom order:</p>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 list-disc list-inside space-y-1">
            <li>Set sort to &quot;Manual&quot; in List view</li>
            <li>Drag tasks up/down to reorder</li>
            <li>Order is preserved when sorting by manual</li>
            <li>Works within groups</li>
          </ul>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mt-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-2">🗄️ Storage</h4>
        <p className="text-sm text-purple-800 dark:text-purple-200">
          All data is stored locally in your browser using IndexedDB (with localStorage fallback for Safari private
          mode). Data never leaves your device. Create regular backups in Settings → Backup to protect your data.
        </p>
      </div>
    </div>
  );
}
