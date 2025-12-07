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

  // Pomodoro
  pomodoro: (
    <div className="space-y-2">
      <p>Time management technique with breaks.</p>
      <ul className="space-y-1">
        <li>• Short breaks between tasks</li>
        <li>• Long breaks after N tasks</li>
        <li>• Audio and visual notifications</li>
        <li>• Presets: Pomodoro, Deep Work, etc.</li>
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
};
