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
}

export interface LinkPattern {
  id: string;
  prefix: string; // e.g., "T", "D", "S"
  urlTemplate: string; // e.g., "http://www.google.com/{id}"
  description: string;
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
}

export const defaultMarkerColors: MarkerColors = {
  assigned: "#cce5ff", // Blue
  source: "#d4fdd4", // Green
  mentioned: "#ffe5b4", // Yellow/Orange
  project: "#e2ccff", // Purple
  priority: "#ffd4d4", // Red
  dueDate: "#fce4ec", // Pink
  duration: "#d4faff", // Cyan
};

export interface GeneralSettings {
  archiveDays: number; // Number of days before completed tasks are archived
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
    { id: "1", name: "urgent", alternatives: ["asap", "critical"], color: "#ff0000", order: 1 },
    { id: "2", name: "high", alternatives: [], color: "#ff6b00", order: 2 },
    { id: "3", name: "medium", alternatives: ["normal", "med"], color: "#ffa500", order: 3 },
    { id: "4", name: "low", alternatives: [], color: "#ffff00", order: 4 },
  ],
  linkPatterns: [],
  markerColors: defaultMarkerColors,
  general: defaultGeneralSettings,
};
