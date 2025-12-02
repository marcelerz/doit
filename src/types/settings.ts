export interface Person {
  id: string;
  name: string;
  alternatives: string[];
  imageUrl?: string;
  color: string;
  comments: Comment[];
}

export interface Project {
  id: string;
  name: string;
  alternatives: string[];
  imageUrl?: string;
  color: string;
  comments: Comment[];
}

export interface Priority {
  id: string;
  name: string;
  alternatives: string[];
  color: string;
  order: number; // Lower number = higher priority
  comments: Comment[];
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

export interface MarkerColors extends Record<string, string> {
  assigned: string; // @
  source: string; // $
  mentioned: string; // ^
  project: string; // #
  priority: string; // !!
  dueDate: string; // ~
  duration: string; // *
  recurring: string; // %
  dependency: string; // >
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
};

export interface DateTimeSettings {
  startOfDay: string; // e.g., "09:00"
  endOfDay: string; // e.g., "17:00"
  morning: string; // e.g., "08:00"
  noon: string; // e.g., "12:00"
  afternoon: string; // e.g., "14:00"
  evening: string; // e.g., "18:00"
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
  contextSwitchingTime: number; // Minutes between tasks for context switching
  defaultTaskDuration: number; // Default duration in minutes when not specified
  defaultGanttColor: string; // Default color for Gantt tasks without project (hex)
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
  contextSwitchingTime: 5, // 5 minutes between tasks
  defaultTaskDuration: 30, // 30 minutes default
  defaultGanttColor: "#6366f1", // Indigo-500
};

export const defaultDateTimeSettings: DateTimeSettings = {
  startOfDay: "09:00",
  endOfDay: "17:00",
  morning: "08:00",
  noon: "12:00",
  afternoon: "14:00",
  evening: "18:00",
  workWeekStart: 1, // Monday
  fiscalYearStart: 1, // January
};

export interface GeneralSettings {
  archiveDays: number; // Number of days before completed tasks are archived
  autoDelete: {
    enabled: boolean; // Enable automatic deletion of old completed/archived tasks
    deleteDays: number; // Number of days after completion before tasks are deleted
  };
  dateTime: DateTimeSettings;
  workHours: WorkHoursSettings;
  autoAssign: {
    enabled: boolean;
    assignedPerson?: string; // Default person to assign (@)
    sourcePerson?: string; // Default source person ($)
    mentionedPerson?: string; // Default mentioned person (^)
    project?: string; // Default project (#)
    priority?: string; // Default priority (!!)
    dueDate?: string; // Default due date (~)
    duration?: string; // Default duration (*)
  };
}

export const defaultGeneralSettings: GeneralSettings = {
  archiveDays: 7, // Archive completed tasks after 7 days by default
  autoDelete: {
    enabled: false,
    deleteDays: 90, // Delete after 90 days (3 months) by default
  },
  dateTime: defaultDateTimeSettings,
  workHours: defaultWorkHoursSettings,
  autoAssign: {
    enabled: false,
  },
};

export interface Settings {
  people: Person[];
  projects: Project[];
  priorities: Priority[];
  linkPatterns: LinkPattern[];
  markerColors: MarkerColors;
  general: GeneralSettings;
}

export const defaultSettings: Settings = {
  people: [],
  projects: [],
  priorities: [
    { id: "1", name: "urgent", alternatives: ["asap", "critical"], color: "#ff0000", order: 1, comments: [] },
    { id: "2", name: "high", alternatives: [], color: "#ff6b00", order: 2, comments: [] },
    { id: "3", name: "medium", alternatives: ["normal", "med"], color: "#ffa500", order: 3, comments: [] },
    { id: "4", name: "low", alternatives: [], color: "#ffff00", order: 4, comments: [] },
  ],
  linkPatterns: [],
  markerColors: defaultMarkerColors,
  general: defaultGeneralSettings,
};
