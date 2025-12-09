"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  content: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg";
  position?: "top" | "bottom" | "left" | "right" | "auto";
  maxWidth?: number;
}

/**
 * Reusable info tooltip component with an "i" icon that shows detailed information on hover
 */
export function InfoTooltip({ content, title, size = "sm", position = "auto", maxWidth = 320 }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; placement: string }>({
    x: 0,
    y: 0,
    placement: "bottom",
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-5 h-5 text-sm",
    lg: "w-6 h-6 text-base",
  };

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let placement = position;
      let x = rect.left + rect.width / 2;
      let y = rect.bottom + 8;

      // Auto-detect best position if set to auto
      if (position === "auto") {
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = viewportWidth - rect.right;
        const spaceLeft = rect.left;

        if (spaceBelow >= 200) {
          placement = "bottom";
        } else if (spaceAbove >= 200) {
          placement = "top";
        } else if (spaceRight >= maxWidth + 20) {
          placement = "right";
        } else if (spaceLeft >= maxWidth + 20) {
          placement = "left";
        } else {
          placement = "bottom";
        }
      }

      // Calculate position based on placement
      switch (placement) {
        case "top":
          x = rect.left + rect.width / 2;
          y = rect.top - 8;
          break;
        case "bottom":
          x = rect.left + rect.width / 2;
          y = rect.bottom + 8;
          break;
        case "left":
          x = rect.left - 8;
          y = rect.top + rect.height / 2;
          break;
        case "right":
          x = rect.right + 8;
          y = rect.top + rect.height / 2;
          break;
      }

      // Ensure tooltip stays within viewport
      x = Math.max(10, Math.min(x, viewportWidth - maxWidth - 10));
      y = Math.max(10, Math.min(y, viewportHeight - 100));

      setTooltipPosition({ x, y, placement });
    }
  }, [isVisible, position, maxWidth]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-help flex-shrink-0`}
        aria-label="More information"
      >
        i
      </button>

      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              maxWidth: maxWidth,
              transform:
                tooltipPosition.placement === "top"
                  ? "translate(-50%, -100%)"
                  : tooltipPosition.placement === "left"
                  ? "translate(-100%, -50%)"
                  : tooltipPosition.placement === "right"
                  ? "translate(0, -50%)"
                  : "translate(-50%, 0)",
            }}
          >
            <div className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg shadow-xl border border-zinc-700 dark:border-zinc-300 p-3">
              {title && (
                <div className="font-semibold text-sm mb-2 pb-2 border-b border-zinc-700 dark:border-zinc-300">
                  {title}
                </div>
              )}
              <div className="text-xs leading-relaxed">{content}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Pre-built tooltip content for common help topics
 */
export const tooltipContent = {
  // Smart Input Markers
  smartInput: (
    <div className="space-y-2">
      <p>Use markers to quickly add metadata:</p>
      <ul className="space-y-1">
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">@name</code> - Assign to person
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">$name</code> - Source person
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">%project</code> - Link to project
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">!!priority</code> - Set priority
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">#tag</code> - Add tag
        </li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">
        Dates, recurring patterns, and mentions are auto-detected!
      </p>
    </div>
  ),

  // Due Date
  dueDate: (
    <div className="space-y-2">
      <p>Set when the task should be completed.</p>
      <p className="font-medium">Auto-detected formats:</p>
      <ul className="space-y-1">
        <li>• Natural: &quot;tomorrow&quot;, &quot;next Friday&quot;, &quot;Dec 25&quot;</li>
        <li>• Shortcuts: &quot;eod&quot;, &quot;eow&quot;, &quot;bow&quot;, &quot;bom&quot;</li>
        <li>• Relative: &quot;in 3 days&quot;, &quot;next week&quot;</li>
      </ul>
    </div>
  ),

  // Duration
  duration: (
    <div className="space-y-2">
      <p>Estimated time to complete the task.</p>
      <p className="font-medium">Formats:</p>
      <ul className="space-y-1">
        <li>• Minutes: 30m, 45m</li>
        <li>• Hours: 1h, 2h, 1.5h</li>
        <li>• Combined: 1h30m, 2h15m</li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">Used for Gantt chart scheduling.</p>
    </div>
  ),

  // Recurring
  recurring: (
    <div className="space-y-2">
      <p>Create repeating tasks automatically.</p>
      <p className="font-medium">Examples:</p>
      <ul className="space-y-1">
        <li>• &quot;every day&quot;, &quot;every 2 days&quot;</li>
        <li>• &quot;every monday&quot;, &quot;every weekday&quot;</li>
        <li>• &quot;every week&quot;, &quot;every 2 weeks&quot;</li>
        <li>• &quot;every first monday&quot;</li>
        <li>• &quot;every month&quot;, &quot;every last friday&quot;</li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">A new task is created when completed.</p>
    </div>
  ),

  // Dependencies
  dependencies: (
    <div className="space-y-2">
      <p>Block this task until dependencies are completed.</p>
      <ul className="space-y-1">
        <li>• Tasks with incomplete dependencies show a warning</li>
        <li>• You&apos;ll be warned when trying to complete blocked tasks</li>
        <li>• Circular dependencies are prevented</li>
      </ul>
    </div>
  ),

  // Assigned People
  assignedPeople: (
    <div className="space-y-2">
      <p>Who is responsible for this task.</p>
      <ul className="space-y-1">
        <li>
          • Use <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">@name</code> in task text
        </li>
        <li>• Or select from the dropdown</li>
        <li>• Multiple people can be assigned</li>
      </ul>
    </div>
  ),

  // Source People
  sourcePeople: (
    <div className="space-y-2">
      <p>Who requested or is the source of this task.</p>
      <ul className="space-y-1">
        <li>
          • Use <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">$name</code> in task text
        </li>
        <li>• Auto-detected: &quot;from John&quot;, &quot;via Sarah&quot;</li>
        <li>• Helps track task origins</li>
      </ul>
    </div>
  ),

  // Projects
  projects: (
    <div className="space-y-2">
      <p>Link tasks to projects for organization.</p>
      <ul className="space-y-1">
        <li>
          • Use <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">%project</code> in task text
        </li>
        <li>• Auto-detected: &quot;on Project&quot;, &quot;for Project&quot;</li>
        <li>• Group and filter tasks by project</li>
      </ul>
    </div>
  ),

  // Priority
  priority: (
    <div className="space-y-2">
      <p>Set task importance level.</p>
      <ul className="space-y-1">
        <li>
          • Use <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">!!priority</code> in task text
        </li>
        <li>• Auto-detected: &quot;urgent&quot;, &quot;high&quot;, &quot;low&quot;</li>
        <li>• Customize priorities in Settings</li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">Priority colors show on task checkboxes.</p>
    </div>
  ),

  // Tags
  tags: (
    <div className="space-y-2">
      <p>Add flexible labels to categorize tasks.</p>
      <ul className="space-y-1">
        <li>
          • Use <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">#tag</code> in task text
        </li>
        <li>• Filter by tags in list view</li>
        <li>• Tags are created automatically</li>
      </ul>
    </div>
  ),

  // Mentioned People
  mentionedPeople: (
    <div className="space-y-2">
      <p>People referenced in the task but not assigned.</p>
      <ul className="space-y-1">
        <li>• Auto-detected from task text</li>
        <li>• Useful for tracking who&apos;s involved</li>
        <li>• Different from @assigned people</li>
      </ul>
    </div>
  ),

  // Archive
  archiveDays: (
    <div className="space-y-2">
      <p>Completed tasks move to Archive after this many days.</p>
      <ul className="space-y-1">
        <li>• Set to 0 to archive immediately</li>
        <li>• Archived tasks stay visible but collapsed</li>
        <li>• Reduces clutter in your active list</li>
      </ul>
    </div>
  ),

  // Auto-Delete
  autoDelete: (
    <div className="space-y-2">
      <p>Permanently remove old tasks automatically.</p>
      <ul className="space-y-1">
        <li>• Counts from completion date</li>
        <li>• Affects both completed and archived tasks</li>
        <li>• Cannot be undone - be careful!</li>
      </ul>
    </div>
  ),

  // Kanban States
  kanbanStates: (
    <div className="space-y-2">
      <p>Workflow columns for the Kanban board.</p>
      <ul className="space-y-1">
        <li>• Drag tasks between states</li>
        <li>• &quot;Completed&quot; and &quot;Archived&quot; are system states</li>
        <li>• Configure allowed transitions</li>
      </ul>
    </div>
  ),

  // Sprints
  sprints: (
    <div className="space-y-2">
      <p>Time-boxed periods for agile planning.</p>
      <ul className="space-y-1">
        <li>• Create sprints with goals and dates</li>
        <li>• Assign tasks to sprints</li>
        <li>• Filter Kanban by sprint</li>
        <li>• Track sprint progress</li>
      </ul>
    </div>
  ),

  // Templates
  templates: (
    <div className="space-y-2">
      <p>Save task configurations for reuse.</p>
      <ul className="space-y-1">
        <li>• Create from existing tasks</li>
        <li>• Include metadata (people, projects, tags)</li>
        <li>• Quickly create similar tasks</li>
      </ul>
    </div>
  ),

  // Gantt Prioritization modes
  prioritization: (
    <div className="space-y-2">
      <p>How tasks are ordered for scheduling.</p>
      <ul className="space-y-1">
        <li>
          • <strong>Priority</strong>: High-priority tasks scheduled first
        </li>
        <li>
          • <strong>Due Date</strong>: Earliest deadlines scheduled first
        </li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">Affects order on timeline, not task completion.</p>
    </div>
  ),

  // Sequential (Gantt scheduling technique)
  sequential: (
    <div className="space-y-2">
      <p>Simple task-to-task scheduling.</p>
      <ul className="space-y-1">
        <li>• Fixed buffer between tasks</li>
        <li>• No structured breaks</li>
        <li>• Predictable, even spacing</li>
        <li>• Good for varied task lengths</li>
      </ul>
    </div>
  ),

  // Pomodoro
  pomodoro: (
    <div className="space-y-2">
      <p>Time management technique with breaks.</p>
      <ul className="space-y-1">
        <li>• Short breaks between tasks</li>
        <li>• Long breaks after N tasks</li>
        <li>• Presets: Standard (25/5/15/4)</li>
        <li>• Use Focus Mode for timer & sounds</li>
      </ul>
    </div>
  ),

  // Flow (Gantt scheduling technique)
  flow: (
    <div className="space-y-2">
      <p>Work/break/context cycles for deep focus.</p>
      <ul className="space-y-1">
        <li>• Extended work sessions</li>
        <li>• Fixed break after each session</li>
        <li>• Context switch time between tasks</li>
        <li>• Presets: 52/17, Ultradian (90/20)</li>
      </ul>
    </div>
  ),

  // Work Hours
  workHours: (
    <div className="space-y-2">
      <p>Define when you&apos;re available to work.</p>
      <ul className="space-y-1">
        <li>• Sets Beginning/End of Day times</li>
        <li>• Used for &quot;eod&quot;, &quot;bod&quot; shortcuts</li>
        <li>• Affects Gantt chart scheduling</li>
        <li>• Configure per-day or weekday/weekend</li>
      </ul>
    </div>
  ),

  // Time Blocks
  timeBlocks: (
    <div className="space-y-2">
      <p>Block out time for non-task activities.</p>
      <ul className="space-y-1">
        <li>• Meetings, lunch, focus time, etc.</li>
        <li>• Shown on Gantt timeline</li>
        <li>• Tasks scheduled around blocks</li>
        <li>• Custom colors and icons</li>
      </ul>
    </div>
  ),

  // Backup
  backup: (
    <div className="space-y-2">
      <p>Save and restore your data.</p>
      <ul className="space-y-1">
        <li>• Export all data as JSON</li>
        <li>• Restore from backup file</li>
        <li>• Includes tasks, people, projects, settings</li>
      </ul>
    </div>
  ),

  // Selection Mode
  selectionMode: (
    <div className="space-y-2">
      <p>Select multiple tasks for batch operations.</p>
      <ul className="space-y-1">
        <li>• Click checkboxes to select</li>
        <li>• Shift+click for range selection</li>
        <li>• Batch complete, archive, delete, or edit</li>
      </ul>
    </div>
  ),

  // Filters
  filters: (
    <div className="space-y-2">
      <p>Narrow down visible tasks.</p>
      <ul className="space-y-1">
        <li>• Filter by person, project, priority</li>
        <li>• Due date ranges</li>
        <li>• Tags, recurring, dependencies</li>
        <li>• Combine multiple filters</li>
      </ul>
    </div>
  ),

  // Grouping
  grouping: (
    <div className="space-y-2">
      <p>Organize tasks into sections.</p>
      <ul className="space-y-1">
        <li>• Group by person, project, priority</li>
        <li>• Due date, sprint, category</li>
        <li>• Collapse/expand groups</li>
      </ul>
    </div>
  ),

  // Categories
  categories: (
    <div className="space-y-2">
      <p>Custom groupings for tasks.</p>
      <ul className="space-y-1">
        <li>• Create your own categories</li>
        <li>• Different from projects</li>
        <li>• Use for areas of life, contexts, etc.</li>
      </ul>
    </div>
  ),

  // Links
  linkPatterns: (
    <div className="space-y-2">
      <p>Auto-link text patterns to URLs.</p>
      <ul className="space-y-1">
        <li>• Define patterns like &quot;JIRA-123&quot;</li>
        <li>• Automatically creates clickable links</li>
        <li>• Use $1, $2 for captured groups</li>
      </ul>
    </div>
  ),

  // Markers
  markers: (
    <div className="space-y-2">
      <p>Customize colors for metadata markers.</p>
      <ul className="space-y-1">
        <li>• @assigned, $source people</li>
        <li>• %project, !!priority, #tags</li>
        <li>• Dates, durations, recurring</li>
      </ul>
    </div>
  ),

  // Auto-Assign
  autoAssign: (
    <div className="space-y-2">
      <p>Default values for new tasks.</p>
      <ul className="space-y-1">
        <li>• Auto-assign person, project</li>
        <li>• Default priority, due date</li>
        <li>• Applied when not specified</li>
      </ul>
    </div>
  ),

  // Storage
  storage: (
    <div className="space-y-2">
      <p>Where your data is stored.</p>
      <ul className="space-y-1">
        <li>• IndexedDB (preferred, larger capacity)</li>
        <li>• LocalStorage (fallback)</li>
        <li>• Data stays in your browser</li>
        <li>• Use Backup for data portability</li>
      </ul>
    </div>
  ),

  // Subtasks
  subtasks: (
    <div className="space-y-2">
      <p>Break down tasks into smaller steps.</p>
      <ul className="space-y-1">
        <li>• Add subtasks to any task</li>
        <li>• Check off as you complete</li>
        <li>• Progress shown on parent task</li>
      </ul>
    </div>
  ),

  // Comments
  comments: (
    <div className="space-y-2">
      <p>Add notes and updates to tasks.</p>
      <ul className="space-y-1">
        <li>• Track progress and discussions</li>
        <li>• Timestamped entries</li>
        <li>• Visible in task detail</li>
      </ul>
    </div>
  ),

  // Activity
  activity: (
    <div className="space-y-2">
      <p>History of changes to a task.</p>
      <ul className="space-y-1">
        <li>• Auto-logged state changes</li>
        <li>• Metadata updates tracked</li>
        <li>• See when and what changed</li>
      </ul>
    </div>
  ),

  // Time Tracking
  timeTracking: (
    <div className="space-y-2">
      <p>Track time spent on tasks.</p>
      <ul className="space-y-1">
        <li>• Start/stop timer for active tracking</li>
        <li>• Add manual time entries</li>
        <li>• View total time and individual entries</li>
        <li>• Optional notes for each entry</li>
      </ul>
    </div>
  ),

  // Date Time Settings
  dateTimeSettings: (
    <div className="space-y-2">
      <p>Customize time shortcuts and calendar settings.</p>
      <ul className="space-y-1">
        <li>• Define what &quot;morning&quot;, &quot;noon&quot;, etc. mean</li>
        <li>• Set your work week start day</li>
        <li>• Configure fiscal year start</li>
        <li>• BOD/EOD from Work Hours settings</li>
      </ul>
    </div>
  ),

  // View Modes
  viewModes: (
    <div className="space-y-2">
      <p>Different ways to visualize your tasks.</p>
      <ul className="space-y-1">
        <li>
          • <strong>List</strong>: Traditional todo list with filters
        </li>
        <li>
          • <strong>Kanban</strong>: Visual board with drag-and-drop
        </li>
        <li>
          • <strong>Gantt</strong>: Timeline for task planning
        </li>
        <li>
          • <strong>Calendar</strong>: Monthly view with task dots
        </li>
      </ul>
    </div>
  ),

  // Gantt View
  ganttView: (
    <div className="space-y-2">
      <p>Timeline visualization for task planning.</p>
      <ul className="space-y-1">
        <li>• View tasks on a horizontal timeline</li>
        <li>• Auto-schedule based on due dates & durations</li>
        <li>• Respects work hours and time blocks</li>
        <li>• Group by project or view all tasks</li>
      </ul>
    </div>
  ),

  // Calendar View
  calendarView: (
    <div className="space-y-2">
      <p>Monthly calendar view of your tasks.</p>
      <ul className="space-y-1">
        <li>• Dots indicate tasks due on each day</li>
        <li>• Click a day to see task details</li>
        <li>• Navigate between months easily</li>
        <li>• Quick overview of upcoming deadlines</li>
      </ul>
    </div>
  ),

  // Features
  features: (
    <div className="space-y-2">
      <p>Enable or disable app features.</p>
      <ul className="space-y-1">
        <li>• Toggle views you don&apos;t use</li>
        <li>• Simplify the interface</li>
        <li>• Disabled features hide their tabs</li>
        <li>• Re-enable anytime in Settings</li>
      </ul>
    </div>
  ),

  // Search
  search: (
    <div className="space-y-2">
      <p>Find tasks quickly across all your data.</p>
      <ul className="space-y-1">
        <li>• Search task text, people, projects</li>
        <li>• Search tags, comments, and context</li>
        <li>• Recent searches saved automatically</li>
        <li>• Press Escape to clear</li>
      </ul>
    </div>
  ),

  // Import
  importData: (
    <div className="space-y-2">
      <p>Import tasks from external sources.</p>
      <ul className="space-y-1">
        <li>• Plain text (one task per line)</li>
        <li>• Markdown checkboxes</li>
        <li>• CSV format</li>
        <li>• Duplicate detection available</li>
      </ul>
    </div>
  ),

  // Export
  exportData: (
    <div className="space-y-2">
      <p>Export your tasks for use elsewhere.</p>
      <ul className="space-y-1">
        <li>• Markdown format with checkboxes</li>
        <li>• CSV for spreadsheets</li>
        <li>• JSON for full data backup</li>
        <li>• Choose which tasks to include</li>
      </ul>
    </div>
  ),

  // Undo/Redo
  undoRedo: (
    <div className="space-y-2">
      <p>Undo or redo your recent changes.</p>
      <ul className="space-y-1">
        <li>• Undo accidental deletions</li>
        <li>• Redo if you change your mind</li>
        <li>• Keyboard: Cmd/Ctrl + Z, Cmd/Ctrl + Shift + Z</li>
      </ul>
    </div>
  ),

  // Focus Mode
  focusMode: (
    <div className="space-y-2">
      <p>Timer-based task execution with breaks.</p>
      <ul className="space-y-1">
        <li>• Work through tasks one at a time</li>
        <li>• Built-in timer with sound alerts</li>
        <li>• Short/long breaks between tasks</li>
        <li>• Auto time tracking option</li>
        <li>• Launch from Gantt toolbar</li>
      </ul>
    </div>
  ),

  // Context Field
  context: (
    <div className="space-y-2">
      <p>Rich text notes for additional details.</p>
      <ul className="space-y-1">
        <li>• Add formatted notes</li>
        <li>• Include links and lists</li>
        <li>• Background info and references</li>
        <li>• Click to edit, blur to save</li>
      </ul>
    </div>
  ),

  // Links Section
  links: (
    <div className="space-y-2">
      <p>Auto-detected links in your task.</p>
      <ul className="space-y-1">
        <li>• Pattern-based link detection</li>
        <li>• Click to open in new tab</li>
        <li>• Configure patterns in Settings → Links</li>
      </ul>
    </div>
  ),

  // Theme
  theme: (
    <div className="space-y-2">
      <p>Choose your preferred appearance.</p>
      <ul className="space-y-1">
        <li>
          • <strong>Light</strong>: Bright, clean interface
        </li>
        <li>
          • <strong>Dark</strong>: Easy on the eyes at night
        </li>
        <li>
          • <strong>System</strong>: Matches your device setting
        </li>
      </ul>
    </div>
  ),

  // Reordering
  reordering: (
    <div className="space-y-2">
      <p>Manually order your tasks.</p>
      <ul className="space-y-1">
        <li>• Drag and drop to reorder</li>
        <li>• Manual order persists</li>
        <li>• Disable to use automatic sorting</li>
      </ul>
    </div>
  ),

  // Focus Sounds
  focusSounds: (
    <div className="space-y-2">
      <p>Audio cues for Focus Mode transitions.</p>
      <ul className="space-y-1">
        <li>• 🎯 Task Start - begin work</li>
        <li>• ✅ Task Complete - finished</li>
        <li>• ☕ Short Break - quick rest</li>
        <li>• 🧘 Long Break - extended rest</li>
        <li>• ⏰ Break End - back to work</li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">3 second delay between sounds for natural flow.</p>
    </div>
  ),

  // Ambient Sounds
  ambientSounds: (
    <div className="space-y-2">
      <p>Background sounds for focus sessions.</p>
      <ul className="space-y-1">
        <li>• Choose different sounds for work & breaks</li>
        <li>• Rain, nature, city ambiance, and more</li>
        <li>• Sounds loop continuously</li>
        <li>• Separate volume control</li>
      </ul>
      <p className="text-zinc-400 dark:text-zinc-600 pt-1">Only plays during active Focus Mode.</p>
    </div>
  ),

  // Batch Processing
  batchProcessing: (
    <div className="space-y-2">
      <p>Edit multiple tasks at once.</p>
      <ul className="space-y-1">
        <li>• Select multiple tasks</li>
        <li>• Batch complete, archive, or delete</li>
        <li>• Batch edit metadata (priority, project, etc.)</li>
        <li>• Shift+click for range selection</li>
      </ul>
    </div>
  ),

  // Notifications
  notifications: (
    <div className="space-y-2">
      <p>Get browser notifications for due tasks.</p>
      <ul className="space-y-1">
        <li>• Enable browser notifications permission</li>
        <li>• Get notified when tasks become overdue</li>
        <li>• Alerts for tasks due today or soon</li>
        <li>• Customize check interval and timing</li>
      </ul>
    </div>
  ),

  // Priorities
  priorities: (
    <div className="space-y-2">
      <p>Define priority levels for your tasks.</p>
      <ul className="space-y-1">
        <li>• Create custom priority levels</li>
        <li>• Assign colors to each priority</li>
        <li>• Add alternative names (e.g., &quot;critical&quot; = &quot;urgent&quot;)</li>
        <li>• Priority colors show on task checkboxes</li>
      </ul>
    </div>
  ),

  // Sorting
  sorting: (
    <div className="space-y-2">
      <p>Order tasks in the list.</p>
      <ul className="space-y-1">
        <li>• Sort by due date, priority, created date</li>
        <li>• Ascending or descending order</li>
        <li>• Combined with grouping for organization</li>
        <li>• Manual order also available</li>
      </ul>
    </div>
  ),

  // View Presets
  viewPresets: (
    <div className="space-y-2">
      <p>Save your favorite view configurations.</p>
      <ul className="space-y-1">
        <li>• Save filter and sort combinations</li>
        <li>• Quick switch between views</li>
        <li>• Share presets across sessions</li>
        <li>• Create presets for different workflows</li>
      </ul>
    </div>
  ),

  // Focus Mode Keyboard Shortcuts
  focusKeyboard: (
    <div className="space-y-2">
      <p className="font-medium">Keyboard Shortcuts</p>
      <ul className="space-y-1">
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">Space</code> - Start/pause timer
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">Shift+Enter</code> - Complete early
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">Enter</code> - Open task details
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">S</code> - Skip to Next
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">N</code> - Skip Task
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">M</code> - Toggle sound
        </li>
        <li>
          <code className="bg-zinc-700 dark:bg-zinc-300 px-1 rounded">Esc</code> - Exit focus mode
        </li>
      </ul>
      <div className="border-t border-zinc-700 dark:border-zinc-300 pt-2 mt-2">
        <p className="font-medium">How completion works:</p>
        <ul className="space-y-1 text-zinc-400 dark:text-zinc-600">
          <li>• Tasks <strong>auto-complete</strong> when timer reaches zero</li>
          <li>• <strong>Complete button</strong>: Finish early &amp; mark done</li>
          <li>• <strong>Skip to Next</strong>: End segment, move to break (doesn&apos;t mark done)</li>
          <li>• <strong>Skip Task</strong>: Skip entirely without progress</li>
        </ul>
      </div>
    </div>
  ),
};
