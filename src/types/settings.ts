export interface Person {
  id: string;
  name: string;
  alternatives: string[];
  color?: string; // Optional - defaults to marker color if not set
  context?: string; // Rich text context
  comments: Comment[];
  activity: ActivityEntry[];
  archived?: boolean;
}

// Project categories for organizing work types (e.g., "Office", "Private", "Client A")
export interface ProjectCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  alternatives: string[];
  color?: string; // Optional - defaults to marker color if not set
  context?: string; // Rich text context
  comments: Comment[];
  activity: ActivityEntry[];
  archived?: boolean;
  category?: string; // Category ID - links to ProjectCategory
}

export interface Priority {
  id: string;
  name: string;
  alternatives: string[];
  color?: string; // Optional - defaults to marker color if not set
  order: number; // Lower number = higher priority
  comments: Comment[];
  activity: ActivityEntry[];
  archived?: boolean;
}

export interface LinkPattern {
  id: string;
  prefix: string; // e.g., "T", "D", "S"
  urlTemplate: string; // e.g., "http://www.google.com/{id}"
  description: string;
  color: string; // Color for the link display
}

export interface Comment {
  commentId: number;
  history: CommentHistoryEntry[];
}

export interface CommentHistoryEntry {
  date: number;
  content: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: number;
  type:
    | "created"
    | "edited"
    | "archived"
    | "unarchived"
    | "deleted"
    | "comment_added"
    | "comment_edited"
    | "comment_deleted";
  description: string;
  metadata?: any;
}

export interface MarkerColors extends Record<string, string> {
  assigned: string; // @
  source: string; // $
  mentioned: string; // (auto-detected)
  project: string; // %
  priority: string; // !!
  dueDate: string; // (auto-detected)
  duration: string; // (auto-detected)
  recurring: string; // ~ (auto-detected)
  dependency: string; // (via field)
  tag: string; // #
  sprint: string; // 🏃 (sprint selector)
}

export const defaultMarkerColors: MarkerColors = {
  assigned: "#cce5ff", // Blue
  source: "#d4fdd4", // Green
  mentioned: "#ffe5b4", // Yellow/Orange
  project: "#e2ccff", // Purple
  priority: "#ffd4d4", // Red
  dueDate: "#fce4ec", // Pink
  duration: "#d4faff", // Cyan
  recurring: "#e1f5e1", // Light green
  dependency: "#fff4e6", // Light orange
  tag: "#ffe4cc", // Light orange
  sprint: "#dbeafe", // Light blue
};

export interface DateTimeSettings {
  morning: string; // e.g., "08:00"
  noon: string; // e.g., "12:00"
  afternoon: string; // e.g., "15:00"
  evening: string; // e.g., "19:00"
  workWeekStart: number; // 0-6, where 0 = Sunday, 1 = Monday
  fiscalYearStart: number; // Month (1-12) when fiscal year starts
}

export type TimeBlockType = "break" | "meeting" | "focus" | "lunch" | "commute" | "personal" | "custom";

export interface TimeBlockTypeConfig {
  id: TimeBlockType | string;
  name: string;
  color: string;
  icon?: string; // emoji or icon identifier
}

export const DEFAULT_BLOCK_TYPES: TimeBlockTypeConfig[] = [
  { id: "break", name: "Break", color: "#d1d5db", icon: "☕" }, // gray-300 (light gray)
  { id: "lunch", name: "Lunch", color: "#d1d5db", icon: "🍴" }, // gray-300 (light gray)
  { id: "meeting", name: "Meeting", color: "#a78bfa", icon: "👥" }, // violet-400
  { id: "focus", name: "Focus Time", color: "#4ade80", icon: "🎯" }, // green-400
  { id: "commute", name: "Commute", color: "#60a5fa", icon: "🚗" }, // blue-400
  { id: "personal", name: "Personal", color: "#f472b6", icon: "🏠" }, // pink-400
];

export interface BreakPeriod {
  id: string;
  name: string;
  startTime: string; // e.g., "12:00"
  endTime: string; // e.g., "13:00"
  blockType?: TimeBlockType | string; // Type of block (break, meeting, focus, etc.)
  color?: string; // Custom color override (if not set, uses blockType color)
  allowedCategories?: string[]; // Category IDs - only schedule tasks from these categories during this block
}

export interface DaySchedule {
  enabled?: boolean; // If false, the day is disabled (no work hours)
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  breaks: BreakPeriod[];
}

export interface WorkHoursSettings {
  useCommonSchedule: boolean; // If true, use commonSchedule for all days
  commonSchedule: DaySchedule;
  weekdaySchedule: DaySchedule; // For Mon-Fri
  weekendSchedule: DaySchedule; // For Sat-Sun
  customSchedules: {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
  };
}

export const defaultWorkHoursSettings: WorkHoursSettings = {
  useCommonSchedule: true,
  commonSchedule: {
    startTime: "09:00",
    endTime: "17:00",
    breaks: [{ id: "lunch", name: "Lunch", startTime: "12:00", endTime: "13:00", blockType: "lunch" }],
  },
  weekdaySchedule: {
    startTime: "09:00",
    endTime: "17:00",
    breaks: [{ id: "lunch", name: "Lunch", startTime: "12:00", endTime: "13:00", blockType: "lunch" }],
  },
  weekendSchedule: {
    startTime: "10:00",
    endTime: "14:00",
    breaks: [],
  },
  customSchedules: {},
};

// Gantt Tab Settings
export type GanttZoomLevel = "15min" | "30min" | "1hour" | "2hour";
export type SchedulingTechnique = "sequential" | "pomodoro" | "flow";

export interface GanttPreset {
  id: string;
  name: string;
  technique: SchedulingTechnique;
  // Sequential settings
  contextSwitchingTime: number;
  defaultTaskDuration: number;
  durationMultiplier: number;
  // Pomodoro settings
  pomodoroWorkDuration?: number; // Work duration in minutes (default 25)
  pomodoroShortBreak?: number; // Short break in minutes (default 5)
  pomodoroLongBreak?: number; // Long break in minutes (default 15)
  pomodoroLongBreakInterval?: number; // Number of work sessions before long break (default 4)
  // Flow settings
  flowWorkDuration?: number; // Work duration in minutes (default 52)
  flowBreakDuration?: number; // Break duration in minutes (default 17)
  flowContextSwitchingTime?: number; // Context switch between tasks in minutes (default 10)
}

export interface Gantt {
  // Active Technique
  schedulingTechnique: SchedulingTechnique; // Which technique is active

  // Common Settings
  defaultTaskDuration: number; // Default duration in minutes when not specified
  durationMultiplier: number; // Multiplier for task durations during scheduling
  minimumRemainingDuration: number; // Minimum duration left when time is tracked (default 1 min)

  // Sequential Settings
  contextSwitchingTime: number; // Minutes between tasks for context switching

  // Pomodoro Settings
  pomodoroWorkDuration: number; // Work duration in minutes (default 25)
  pomodoroShortBreak: number; // Short break in minutes (default 5)
  pomodoroLongBreak: number; // Long break in minutes (default 15)
  pomodoroLongBreakInterval: number; // Number of work sessions before long break (default 4)
  pomodoroNotifications: boolean; // Show browser notifications for breaks
  pomodoroSound: boolean; // Play sound for break notifications

  // Flow Settings
  flowWorkDuration: number; // Work duration in minutes (default 52)
  flowBreakDuration: number; // Break duration in minutes (default 17)
  flowContextSwitchingTime: number; // Context switch between tasks in minutes (default 10)

  // View Settings
  zoomLevel: GanttZoomLevel; // Timeline zoom level
  showWeekends: boolean; // Show weekend days in week view
  showDependencies: boolean; // Show dependency arrows between tasks
  taskRowHeight: "compact" | "normal" | "comfortable"; // Height of task rows
  showBufferZones: boolean; // Show buffer/overdue indicators
  showNowLine: boolean; // Show current time indicator
  collapseCompleted: boolean; // Collapse completed tasks section

  // Presets
  presets: GanttPreset[];
  activePresetId?: string; // Currently active preset
}

export const defaultGanttPresets: GanttPreset[] = [
  // Sequential presets
  {
    id: "sequential-focus",
    name: "Focus Mode",
    technique: "sequential",
    contextSwitchingTime: 5,
    defaultTaskDuration: 25,
    durationMultiplier: 1.0,
  },
  {
    id: "sequential-planning",
    name: "Planning Mode",
    technique: "sequential",
    contextSwitchingTime: 15,
    defaultTaskDuration: 45,
    durationMultiplier: 1.5,
  },
  {
    id: "sequential-realistic",
    name: "Realistic Mode",
    technique: "sequential",
    contextSwitchingTime: 20,
    defaultTaskDuration: 60,
    durationMultiplier: 2.0,
  },
  // Pomodoro presets
  {
    id: "pomodoro-standard",
    name: "Standard (25/5/15/4)",
    technique: "pomodoro",
    contextSwitchingTime: 0,
    defaultTaskDuration: 25,
    durationMultiplier: 1.0,
    pomodoroWorkDuration: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroLongBreakInterval: 4,
  },
  {
    id: "pomodoro-long",
    name: "Long Sessions (50/10/30/4)",
    technique: "pomodoro",
    contextSwitchingTime: 0,
    defaultTaskDuration: 50,
    durationMultiplier: 1.0,
    pomodoroWorkDuration: 50,
    pomodoroShortBreak: 10,
    pomodoroLongBreak: 30,
    pomodoroLongBreakInterval: 4,
  },
  // Flow presets
  {
    id: "flow-5217",
    name: "52/17 Method (52/17/10)",
    technique: "flow",
    contextSwitchingTime: 0,
    defaultTaskDuration: 52,
    durationMultiplier: 1.0,
    flowWorkDuration: 52,
    flowBreakDuration: 17,
    flowContextSwitchingTime: 10,
  },
  {
    id: "flow-ultradian",
    name: "Ultradian Rhythm (90/20/10)",
    technique: "flow",
    contextSwitchingTime: 0,
    defaultTaskDuration: 90,
    durationMultiplier: 1.0,
    flowWorkDuration: 90,
    flowBreakDuration: 20,
    flowContextSwitchingTime: 10,
  },
];

export const defaultGantt: Gantt = {
  schedulingTechnique: "sequential", // Sequential by default
  contextSwitchingTime: 15, // 15 minutes between tasks
  defaultTaskDuration: 30, // 30 minutes default
  durationMultiplier: 1.0, // 1.0 = no adjustment
  minimumRemainingDuration: 1, // 1 minute minimum to keep tasks visible
  // Pomodoro defaults
  pomodoroWorkDuration: 25, // Standard Pomodoro work duration
  pomodoroShortBreak: 5, // Standard short break
  pomodoroLongBreak: 15, // Standard long break
  pomodoroLongBreakInterval: 4, // Long break every 4 sessions
  pomodoroNotifications: true, // Notifications enabled by default
  pomodoroSound: true, // Sound enabled by default
  // Flow defaults (52/17 method)
  flowWorkDuration: 52,
  flowBreakDuration: 17,
  flowContextSwitchingTime: 10,
  // View settings
  zoomLevel: "1hour",
  showWeekends: true,
  showDependencies: true,
  taskRowHeight: "normal",
  showBufferZones: true,
  showNowLine: true,
  collapseCompleted: false,
  presets: defaultGanttPresets,
  activePresetId: undefined,
};

// Calendar Tab Settings
export type CalendarView = "month" | "week" | "agenda";
export type CalendarDotColorBy = "state" | "priority" | "project";

export interface Calendar {
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  defaultView: CalendarView;
  showWeekNumbers: boolean;
  taskDotLimit: number; // How many dots to show per day (1-10)
  dotColorBy: CalendarDotColorBy;
  showOverdueBadge: boolean; // Highlight overdue tasks
  showRecurringIndicator: boolean; // Show indicator for recurring tasks
  showTaskCount: boolean; // Show task count badge on days
}

export const defaultCalendar: Calendar = {
  weekStartDay: 0, // Sunday
  defaultView: "month",
  showWeekNumbers: false,
  taskDotLimit: 4,
  dotColorBy: "state",
  showOverdueBadge: true,
  showRecurringIndicator: true,
  showTaskCount: false,
};

export const defaultDateTimeSettings: DateTimeSettings = {
  morning: "08:00",
  noon: "12:00",
  afternoon: "15:00",
  evening: "19:00",
  workWeekStart: 1, // Monday
  fiscalYearStart: 1, // January
};

// General Tab Settings
export type ThemeMode = "light" | "dark" | "system";

export interface GeneralSettings {
  archiveDays: number; // Number of days before completed tasks are archived
  autoDelete: {
    enabled: boolean; // Enable automatic deletion of old completed/archived tasks
    deleteDays: number; // Number of days after completion before tasks are deleted
  };
  theme: ThemeMode; // Theme preference
}

export const defaultGeneralSettings: GeneralSettings = {
  archiveDays: 7, // Archive completed tasks after 7 days by default
  autoDelete: {
    enabled: true,
    deleteDays: 90, // Delete after 90 days (3 months) by default
  },
  theme: "system", // Default to system preference
};

// Auto-Assign Tab Settings
export interface AutoAssignSettings {
  enabled: boolean;
  assignedPerson?: string; // Default person to assign (@)
  sourcePerson?: string; // Default source person ($)
  project?: string; // Default project (%)
  priority?: string; // Default priority (!!)
  dueDate?: string; // Default due date (^)
  duration?: string; // Default duration (*)
  recurring?: string; // Default recurring pattern (~)
}

export const defaultAutoAssignSettings: AutoAssignSettings = {
  enabled: true, // Always enabled by default
  assignedPerson: undefined,
  sourcePerson: undefined,
  project: undefined,
  priority: "medium", // Default to medium priority
  dueDate: "today",
  duration: "30m", // Default to 30 minutes
  recurring: undefined,
};

// Notification Settings
export interface NotificationSettings {
  enabled: boolean;
  notifyOverdue: boolean;
  notifyDueToday: boolean;
  notifyDueSoon: boolean;
  dueSoonHours: number; // Hours before due date to notify
  checkInterval: number; // Minutes between notification checks
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: false, // Disabled by default until user enables
  notifyOverdue: true,
  notifyDueToday: true,
  notifyDueSoon: true,
  dueSoonHours: 2,
  checkInterval: 15, // Check every 15 minutes
};

// Sprint Settings for Scrum planning
export type SprintStatus = "planning" | "active" | "completed" | "cancelled";
export type SprintState = "active" | "archived";

export interface Sprint {
  id: string;
  name: string;
  goal?: string; // Sprint goal description
  color?: string; // Optional - defaults to marker color if not set
  durationDays: number; // Sprint duration in days
  plannedStartDate?: string; // Planned start date (ISO date string)
  actualStartDate?: string; // Actual start date when sprint was started
  actualEndDate?: string; // Actual end date when sprint was completed/cancelled
  status: SprintStatus;
  state: SprintState; // For archiving sprints
  createdAt: number;
  startedAt?: number; // Timestamp when sprint was started
  completedAt?: number; // Timestamp when sprint was completed
  cancelledAt?: number; // Timestamp when sprint was cancelled
  archivedAt?: number; // Timestamp when sprint was archived
  comments: Array<{
    commentId: number;
    history: Array<{ date: number; content: string }>;
  }>;
  activity: Array<{
    id: string;
    timestamp: number;
    type:
      | "created"
      | "edited"
      | "updated"
      | "archived"
      | "unarchived"
      | "comment_added"
      | "comment_edited"
      | "comment_deleted"
      | "started"
      | "completed"
      | "cancelled";
    description: string;
  }>;
}

export interface SprintSettings {
  defaultSprintDuration: number; // Default sprint duration in days (typically 14)
  showBacklogInSprint: boolean; // Show backlog items in sprint view
}

export const defaultSprintSettings: SprintSettings = {
  defaultSprintDuration: 14, // 2 weeks
  showBacklogInSprint: false,
};

// Kanban Tab Settings
export interface KanbanState {
  id: string;
  name: string;
  color: string;
  icon?: string; // emoji
  order: number;
  isSystem?: boolean; // System states (completed, archived) cannot be deleted
  mapsToTodoState?: "active" | "completed" | "archived"; // Maps to underlying TodoState
}

export interface KanbanTransition {
  fromStateId: string;
  toStateId: string;
}

export interface KanbanView {
  id: string;
  name: string;
  description?: string;
  stateIds: string[]; // Which states to show in this view (in order)
  isDefault?: boolean;
}

export interface KanbanSettings {
  states: KanbanState[];
  allowedTransitions: KanbanTransition[]; // Which state transitions are allowed
  views: KanbanView[];
  activeViewId: string; // Currently selected view
  showEmptyColumns: boolean; // Show columns with no tasks
  showTaskCount: boolean; // Show count in column headers
  cardDisplayFields: string[]; // Which metadata fields to show on cards
}

// Default Kanban states
export const defaultKanbanStates: KanbanState[] = [
  { id: "backlog", name: "Backlog", color: "#94a3b8", icon: "📥", order: 0, mapsToTodoState: "active" },
  { id: "todo", name: "To Do", color: "#60a5fa", icon: "📋", order: 1, mapsToTodoState: "active" },
  { id: "in-progress", name: "In Progress", color: "#fbbf24", icon: "🔄", order: 2, mapsToTodoState: "active" },
  { id: "review", name: "Review", color: "#a78bfa", icon: "👀", order: 3, mapsToTodoState: "active" },
  {
    id: "completed",
    name: "Done",
    color: "#4ade80",
    icon: "✅",
    order: 4,
    isSystem: true,
    mapsToTodoState: "completed",
  },
  {
    id: "rejected",
    name: "Rejected",
    color: "#f87171",
    icon: "🚫",
    order: 5,
    isSystem: true,
    mapsToTodoState: "completed",
  },
  {
    id: "archived",
    name: "Archived",
    color: "#9ca3af",
    icon: "📦",
    order: 6,
    isSystem: true,
    mapsToTodoState: "archived",
  },
];

// Default transitions - most states can move to adjacent states or to completed
export const defaultKanbanTransitions: KanbanTransition[] = [
  // From Backlog
  { fromStateId: "backlog", toStateId: "todo" },
  { fromStateId: "backlog", toStateId: "in-progress" },
  { fromStateId: "backlog", toStateId: "rejected" },
  { fromStateId: "backlog", toStateId: "archived" },
  // From To Do
  { fromStateId: "todo", toStateId: "backlog" },
  { fromStateId: "todo", toStateId: "in-progress" },
  { fromStateId: "todo", toStateId: "completed" },
  { fromStateId: "todo", toStateId: "rejected" },
  // From In Progress
  { fromStateId: "in-progress", toStateId: "todo" },
  { fromStateId: "in-progress", toStateId: "review" },
  { fromStateId: "in-progress", toStateId: "completed" },
  // From Review
  { fromStateId: "review", toStateId: "in-progress" },
  { fromStateId: "review", toStateId: "completed" },
  // From Completed
  { fromStateId: "completed", toStateId: "archived" },
  { fromStateId: "completed", toStateId: "todo" }, // Reopen
  // From Rejected
  { fromStateId: "rejected", toStateId: "archived" },
  { fromStateId: "rejected", toStateId: "backlog" }, // Reconsider
  // From Archived
  { fromStateId: "archived", toStateId: "todo" }, // Unarchive
];

// Default Kanban views
export const defaultKanbanViews: KanbanView[] = [
  {
    id: "all",
    name: "All Tasks",
    description: "Full workflow view",
    stateIds: ["backlog", "todo", "in-progress", "review", "completed", "rejected"],
    isDefault: true,
  },
  {
    id: "active-work",
    name: "Active Work",
    description: "Focus on current work",
    stateIds: ["todo", "in-progress", "review", "completed"],
  },
  {
    id: "intake",
    name: "Intake",
    description: "Triage and prioritize new tasks",
    stateIds: ["backlog", "todo", "rejected"],
  },
  {
    id: "retrospective",
    name: "Retrospective",
    description: "Review completed and rejected work",
    stateIds: ["completed", "rejected", "archived"],
  },
];

export const defaultKanbanSettings: KanbanSettings = {
  states: defaultKanbanStates,
  allowedTransitions: defaultKanbanTransitions,
  views: defaultKanbanViews,
  activeViewId: "all",
  showEmptyColumns: true,
  showTaskCount: true,
  cardDisplayFields: ["assignedPeople", "priority", "dueDate", "projects"],
};

// Focus View Settings - Timer, sounds, and tracking for focus mode
export interface FocusSettings {
  // Sound Confirmation
  requireConfirmation: boolean; // Require user to confirm break start / work start
  confirmationRepeatInterval: number; // Seconds between reminder sounds (default 30)
  confirmationMaxRepeats: number; // Max times to repeat before auto-proceeding (0 = infinite, default 5)

  // Auto Time Tracking
  autoTimeTracking: boolean; // Automatically track time for tasks in focus mode
  trackActualVsEstimated: boolean; // Store actual time vs estimated for analytics

  // Timer Controls
  defaultExtendMinutes: number; // Default time to add when extending (default 5)
  extendOptions: number[]; // Quick extend options in minutes (default [5, 10, 15, 30])
  showEarlyCompletePrompt: boolean; // Ask to record actual time when completing early
  autoExtendOnOvertime: boolean; // Auto-extend duration when tracked time exceeds estimate (default true)
  useTrackedTimeForDuration: boolean; // Subtract already-tracked time from duration (default true)

  // Notifications & Sound Settings
  notificationsEnabled: boolean; // Browser notifications for breaks/task events
  soundEnabled: boolean; // Master sound toggle
  soundVolume: number; // Volume level 0-1 (default 0.3)

  // Ambient Sound Settings
  ambientSoundEnabled: boolean; // Enable ambient sounds during focus
  ambientWorkSound: string; // Sound file for work phase (empty = none)
  ambientBreakSound: string; // Sound file for break phase (empty = none)
  ambientVolume: number; // Volume level 0-1 (default 0.3)

  // Display Settings
  showNextTask: boolean; // Show preview of next task during breaks
  showSessionStats: boolean; // Show session statistics (tasks done, time worked)
  showKeyboardHints: boolean; // Show keyboard shortcut hints
}

export const defaultFocusSettings: FocusSettings = {
  // Sound Confirmation
  requireConfirmation: false,
  confirmationRepeatInterval: 30,
  confirmationMaxRepeats: 5,

  // Auto Time Tracking
  autoTimeTracking: true,
  trackActualVsEstimated: true,

  // Timer Controls
  defaultExtendMinutes: 5,
  extendOptions: [5, 10, 15, 30],
  showEarlyCompletePrompt: true,
  autoExtendOnOvertime: true,
  useTrackedTimeForDuration: true,

  // Notifications & Sound Settings
  notificationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.3,

  // Ambient Sound Settings
  ambientSoundEnabled: false,
  ambientWorkSound: "",
  ambientBreakSound: "",
  ambientVolume: 0.3,

  // Display Settings
  showNextTask: true,
  showSessionStats: true,
  showKeyboardHints: true,
};

// Feature Toggles - Allow users to simplify the interface by disabling features
export interface FeatureSettings {
  // Views
  ganttView: boolean;
  calendarView: boolean;
  kanbanView: boolean;
  sprintsView: boolean;
  statsView: boolean;
  // Features
  templates: boolean;
  batchProcessing: boolean;
  reordering: boolean;
  exports: boolean;
  focusMode: boolean;
  timeTracking: boolean;
}

export const defaultFeatureSettings: FeatureSettings = {
  // All features enabled by default
  ganttView: true,
  calendarView: true,
  kanbanView: true,
  sprintsView: true,
  statsView: true,
  templates: true,
  batchProcessing: true,
  reordering: true,
  exports: true,
  focusMode: true,
  timeTracking: true,
};

export interface Settings {
  // Priorities Tab
  priorities: Priority[];
  // Links Tab
  linkPatterns: LinkPattern[];
  // Markers Tab
  markerColors: MarkerColors;
  // General Tab
  general: GeneralSettings;
  // Date/Time Tab
  dateTime: DateTimeSettings;
  // Work Hours Tab
  workHours: WorkHoursSettings;
  // Gantt Tab
  gantt: Gantt;
  // Calendar Tab
  calendar: Calendar;
  // Auto-Assign Tab
  autoAssign: AutoAssignSettings;
  // Notifications Tab
  notifications: NotificationSettings;
  // Kanban Tab
  kanban: KanbanSettings;
  // Sprints Tab - Scrum sprint planning
  sprints: SprintSettings;
  // Categories Tab - Project categories for organizing work types
  categories: ProjectCategory[];
  // Focus Tab - Focus mode timer and tracking settings
  focus: FocusSettings;
  // Feature Toggles - Enable/disable features to simplify interface
  features: FeatureSettings;
}

// Default project categories
export const defaultCategories: ProjectCategory[] = [
  { id: "work", name: "Work", color: "#3b82f6", description: "Office and work-related tasks" },
  { id: "personal", name: "Personal", color: "#22c55e", description: "Personal and home tasks" },
];

export const defaultSettings: Settings = {
  priorities: [
    {
      id: "1",
      name: "urgent",
      alternatives: ["asap", "critical"],
      order: 1,
      comments: [],
      activity: [],
    },
    { id: "2", name: "high", alternatives: [], order: 2, comments: [], activity: [] },
    {
      id: "3",
      name: "medium",
      alternatives: ["normal", "med"],
      order: 3,
      comments: [],
      activity: [],
    },
    { id: "4", name: "low", alternatives: [], order: 4, comments: [], activity: [] },
  ],
  linkPatterns: [],
  markerColors: defaultMarkerColors,
  general: defaultGeneralSettings,
  dateTime: defaultDateTimeSettings,
  workHours: defaultWorkHoursSettings,
  gantt: defaultGantt,
  calendar: defaultCalendar,
  autoAssign: defaultAutoAssignSettings,
  notifications: defaultNotificationSettings,
  kanban: defaultKanbanSettings,
  sprints: defaultSprintSettings,
  categories: defaultCategories,
  focus: defaultFocusSettings,
  features: defaultFeatureSettings,
};
