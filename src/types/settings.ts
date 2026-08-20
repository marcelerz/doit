import { BreakPeriod, getBreakPeriodId } from "./breakPeriod";
import { defaultLinkPatterns, LinkPattern } from "./linkPattern";
import { defaultPriorities, Priority } from "./priority";
import { defaultCategories, ProjectCategory } from "./project";
import { BackupSettings, defaultBackupSettings } from "./backup";
import {
  DurationDay,
  DurationHour,
  DurationMin,
  DurationSec,
  getDurationDay,
  getDurationHour,
  getDurationMin,
  getDurationSec,
  getMonth,
  getShortTime,
  getWeekday,
  Month,
  ShortTime,
  Weekday,
} from "./time";
import { getTimeBlockId } from "./timeBlock";
import { defaultKanbanStates, KanbanState } from "./kanbanState";
import { defaultKanbanViews, KanbanView } from "./kanbanView";
import { defaultKanbanTransitions, KanbanTransition } from "./kanbanTransition";
import { defaultMarkerColors, MarkerColors } from "./markerColors";
import { defaultGantt, Gantt } from "./gantt";
import { Calendar, defaultCalendar } from "./calendar";

// General Tab Settings
const _THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof _THEME_MODES)[number];

export interface GeneralSettings {
  archiveDays: DurationDay; // Number of days before completed tasks are archived
  autoDelete: {
    enabled: boolean; // Enable automatic deletion of old completed/archived tasks
    deleteDays: DurationDay; // Number of days after completion before tasks are deleted
  };
  theme: ThemeMode; // Theme preference
}

export const defaultGeneralSettings: GeneralSettings = {
  archiveDays: getDurationDay(7), // Archive completed tasks after 7 days by default
  autoDelete: {
    enabled: true,
    deleteDays: getDurationDay(90), // Delete after 90 days (3 months) by default
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
  dueSoonHours: DurationHour; // Hours before due date to notify
  checkInterval: DurationMin; // Minutes between notification checks
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: false, // Disabled by default until user enables
  notifyOverdue: true,
  notifyDueToday: true,
  notifyDueSoon: true,
  dueSoonHours: getDurationHour(2),
  checkInterval: getDurationMin(15), // Check every 15 minutes
};

export interface DateTimeSettings {
  morning: ShortTime; // e.g., "08:00"
  noon: ShortTime; // e.g., "12:00"
  afternoon: ShortTime; // e.g., "15:00"
  evening: ShortTime; // e.g., "19:00"
  workWeekStart: Weekday; // 0-6, where 0 = Sunday, 1 = Monday
  workWeekEnd: Weekday; // 0-6, where 0 = Sunday, 6 = Saturday
  fiscalYearStart: Month; // Month (1-12) when fiscal year starts
}

export const defaultDateTimeSettings: DateTimeSettings = {
  morning: getShortTime("08:00"),
  noon: getShortTime("12:00"),
  afternoon: getShortTime("15:00"),
  evening: getShortTime("19:00"),
  workWeekStart: getWeekday(1), // Monday
  workWeekEnd: getWeekday(5), // Friday
  fiscalYearStart: getMonth(1), // January
};

export interface DaySchedule {
  enabled?: boolean; // If false, the day is disabled (no work hours)
  startTime: ShortTime; // e.g., "09:00"
  endTime: ShortTime; // e.g., "17:00"
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
    startTime: getShortTime("09:00"),
    endTime: getShortTime("17:00"),
    breaks: [
      {
        id: getBreakPeriodId("lunch"),
        name: "Lunch",
        startTime: getShortTime("12:00"),
        endTime: getShortTime("13:00"),
        blockType: getTimeBlockId("lunch"),
      },
    ],
  },
  weekdaySchedule: {
    startTime: getShortTime("09:00"),
    endTime: getShortTime("17:00"),
    breaks: [
      {
        id: getBreakPeriodId("lunch"),
        name: "Lunch",
        startTime: getShortTime("12:00"),
        endTime: getShortTime("13:00"),
        blockType: getTimeBlockId("lunch"),
      },
    ],
  },
  weekendSchedule: {
    startTime: getShortTime("10:00"),
    endTime: getShortTime("14:00"),
    breaks: [],
  },
  customSchedules: {},
};

export interface SprintSettings {
  defaultSprintDuration: DurationDay; // Default sprint duration in days (typically 14)
  showBacklogInSprint: boolean; // Show backlog items in sprint view
}

export const defaultSprintSettings: SprintSettings = {
  defaultSprintDuration: getDurationDay(14), // 2 weeks
  showBacklogInSprint: false,
};

export interface KanbanSettings {
  states: KanbanState[];
  allowedTransitions: KanbanTransition[]; // Which state transitions are allowed
  views: KanbanView[];
  activeViewId: string; // Currently selected view
  showEmptyColumns: boolean; // Show columns with no tasks
  showTaskCount: boolean; // Show count in column headers
  cardDisplayFields: string[]; // Which metadata fields to show on cards
}

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
  confirmationRepeatInterval: DurationSec; // Seconds between reminder sounds (default 30)
  confirmationMaxRepeats: number; // Max times to repeat before auto-proceeding (0 = infinite, default 5)

  // Auto Time Tracking
  autoTimeTracking: boolean; // Automatically track time for tasks in focus mode
  trackActualVsEstimated: boolean; // Store actual time vs estimated for analytics

  // Timer Controls
  defaultExtendMinutes: DurationMin; // Default time to add when extending (default 5)
  extendOptions: DurationMin[]; // Quick extend options in minutes (default [5, 10, 15, 30])
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
  confirmationRepeatInterval: getDurationSec(30),
  confirmationMaxRepeats: 5,

  // Auto Time Tracking
  autoTimeTracking: true,
  trackActualVsEstimated: true,

  // Timer Controls
  defaultExtendMinutes: getDurationMin(5),
  extendOptions: [getDurationMin(5), getDurationMin(10), getDurationMin(15), getDurationMin(30)],
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
  notesView: boolean;
  sprintsView: boolean;
  reviewsView: boolean;
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
  notesView: true,
  sprintsView: true,
  reviewsView: true,
  statsView: true,
  templates: true,
  batchProcessing: true,
  reordering: true,
  exports: true,
  focusMode: true,
  timeTracking: true,
};

// Notes Settings
export interface NoteTemplateItem {
  id: string; // Unique ID (e.g., "priorities", "custom_1704067200000")
  label: string; // Display label (editable by user)
  enabled: boolean; // Whether to include in generated content
}

// Helper for generating IDs for custom items
export const generateTemplateItemId = (): string => `custom_${Date.now()}`;

export interface NotesSettings {
  defaultPinNewNotes: boolean;
  showArchivedByDefault: boolean;
  sortOrder: "modified" | "created" | "title";
  // Template configuration for quick note creation
  oneOnOneTemplate: NoteTemplateItem[];
  meetingNoteTemplate: NoteTemplateItem[];
}

// Default 1:1 Note template sections
export const defaultOneOnOneTemplate: NoteTemplateItem[] = [
  { id: "priorities", label: "Priorities", enabled: true },
  { id: "wins", label: "Wins", enabled: true },
  { id: "challenges", label: "Challenges", enabled: true },
  { id: "blockers", label: "Blockers", enabled: true },
  { id: "support_needed", label: "Support Needed", enabled: true },
  { id: "career_growth", label: "Career Growth", enabled: true },
  { id: "follow_ups", label: "Follow-Ups", enabled: true },
];

// Default Meeting Note template sections
export const defaultMeetingNoteTemplate: NoteTemplateItem[] = [
  { id: "meeting_type", label: "Meeting Type", enabled: true },
  { id: "facilitator", label: "Facilitator", enabled: true },
  { id: "attendees", label: "Attendees", enabled: true },
  { id: "purpose", label: "Purpose of this Meeting", enabled: true },
  { id: "project_status", label: "Project Status", enabled: true },
  { id: "progress", label: "Progress", enabled: true },
  { id: "risks", label: "Risks", enabled: true },
  { id: "decisions", label: "Decisions Made", enabled: true },
  { id: "changes", label: "Changes", enabled: true },
  { id: "follow_ups", label: "Follow-Ups", enabled: true },
  { id: "next_steps", label: "Next Steps", enabled: true },
  { id: "appendix", label: "Appendix", enabled: true },
];

export const defaultNotesSettings: NotesSettings = {
  defaultPinNewNotes: false,
  showArchivedByDefault: false,
  sortOrder: "modified",
  oneOnOneTemplate: defaultOneOnOneTemplate,
  meetingNoteTemplate: defaultMeetingNoteTemplate,
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
  // Notes Tab - Notes view settings
  notes: NotesSettings;
  // Feature Toggles - Enable/disable features to simplify interface
  features: FeatureSettings;
  // Backup Tab - Backup settings
  backup: BackupSettings;
}

export const defaultSettings: Settings = {
  priorities: defaultPriorities,
  linkPatterns: defaultLinkPatterns,
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
  notes: defaultNotesSettings,
  features: defaultFeatureSettings,
  backup: defaultBackupSettings,
};
