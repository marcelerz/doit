"use client";

import { useState } from "react";
import { FeatureSettings } from "@/types/settings";
import { HELP_SECTIONS, HelpSection, useViewShortcuts } from "./help/shortcuts";
import { GettingStartedSection } from "./help/GettingStartedSection";
import { SettingsSection } from "./help/SettingsSection";
import { WorkflowsSection } from "./help/WorkflowsSection";
import { PeopleProjectsSection } from "./help/PeopleProjectsSection";
import { KeyboardSection } from "./help/KeyboardSection";
import { TimeTrackingSection } from "./help/TimeTrackingSection";
import { ViewsSection } from "./help/ViewsSection";
import { InputSection } from "./help/InputSection";
import { FilteringSection } from "./help/FilteringSection";
import { QuickStartSection } from "./help/QuickStartSection";
import { Modal } from "@/components/shared/Modal";
import { CloseIcon } from "@/components/shared/Icons";

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTutorial?: () => void;
  /** Which views this user has enabled; the digit shortcuts index into them. */
  features?: FeatureSettings;
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
            {HELP_SECTIONS.map((section) => (
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
