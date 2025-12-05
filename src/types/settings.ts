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

export interface Project {
  id: string;
  name: string;
  alternatives: string[];
  color?: string; // Optional - defaults to marker color if not set
  context?: string; // Rich text context
  comments: Comment[];
  activity: ActivityEntry[];
  archived?: boolean;
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
  project: string; // #
  priority: string; // !!
  dueDate: string; // ~
  duration: string; // *
  recurring: string; // %
  dependency: string; // >
  tag: string; // &
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
};

export interface DateTimeSettings {
  morning: string; // e.g., "08:00"
  noon: string; // e.g., "12:00"
  afternoon: string; // e.g., "15:00"
  evening: string; // e.g., "19:00"
  workWeekStart: number; // 0-6, where 0 = Sunday, 1 = Monday
  fiscalYearStart: number; // Month (1-12) when fiscal year starts
}

export interface BreakPeriod {
  id: string;
  name: string;
  startTime: string; // e.g., "12:00"
  endTime: string; // e.g., "13:00"
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
    breaks: [{ id: "lunch", name: "Lunch", startTime: "12:00", endTime: "13:00" }],
  },
  weekdaySchedule: {
    startTime: "09:00",
    endTime: "17:00",
    breaks: [{ id: "lunch", name: "Lunch", startTime: "12:00", endTime: "13:00" }],
  },
  weekendSchedule: {
    startTime: "10:00",
    endTime: "14:00",
    breaks: [],
  },
  customSchedules: {},
};

// Gantt Tab Settings
export interface Gantt {
  contextSwitchingTime: number; // Minutes between tasks for context switching
  defaultTaskDuration: number; // Default duration in minutes when not specified
  durationMultiplier: number; // Multiplier for task durations during scheduling
}

export const defaultGantt: Gantt = {
  contextSwitchingTime: 15, // 15 minutes between tasks
  defaultTaskDuration: 30, // 30 minutes default
  durationMultiplier: 1.0, // 1.0 = no adjustment
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
export interface GeneralSettings {
  archiveDays: number; // Number of days before completed tasks are archived
  autoDelete: {
    enabled: boolean; // Enable automatic deletion of old completed/archived tasks
    deleteDays: number; // Number of days after completion before tasks are deleted
  };
}

export const defaultGeneralSettings: GeneralSettings = {
  archiveDays: 7, // Archive completed tasks after 7 days by default
  autoDelete: {
    enabled: true,
    deleteDays: 90, // Delete after 90 days (3 months) by default
  },
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
  // Auto-Assign Tab
  autoAssign: AutoAssignSettings;
}

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
  autoAssign: defaultAutoAssignSettings,
};
