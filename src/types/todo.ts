export interface TodoMetadata {
  assignedPeople: string[]; // @ marker
  sourcePeople: string[]; // $ marker
  mentionedPeople: string[]; // ^ marker
  projects: string[]; // # marker
  priority?: string; // !! marker
  dueDate?: string; // ~ marker
  duration?: string; // * marker
}

export interface Comment {
  commentId: number;
  history: CommentHistoryEntry[];
}

export interface CommentHistoryEntry {
  date: number;
  content: string;
}

export interface Todo {
  id: string;
  text: string; // Full text with markers
  plainText: string; // Text without markers
  completed: boolean;
  createdAt: number;
  completedAt?: number; // Timestamp when task was marked as completed
  archived?: boolean; // Whether the task is archived (auto-set based on completion date)
  metadata: TodoMetadata;
  comments: Comment[];
}
