"use client";

import { Comment } from "@/types/todo";
import { formatActivityTime, formatActivityDateTime } from "@/utils/activityLogger";

// Generic activity entry that works for todos, people, projects, and sprints
interface GenericActivityEntry {
  id: string;
  timestamp: number;
  type: string;
  description: string;
  metadata?: unknown;
}

interface ActivityProps {
  activities: GenericActivityEntry[];
  comments: Comment[];
}

// Union type for combined timeline items
type TimelineItem = { type: "activity"; data: GenericActivityEntry } | { type: "comment"; data: Comment };

export function Activity({ activities, comments }: ActivityProps) {
  // Combine activities and comments into a single timeline
  const timelineItems: TimelineItem[] = [
    ...activities.map((activity): TimelineItem => ({ type: "activity", data: activity })),
    ...comments.flatMap((comment): TimelineItem[] =>
      comment.history.map((entry, idx) => ({
        type: "comment",
        data: {
          ...comment,
          history: [entry],
          isEdit: idx > 0,
        } as Comment,
      })),
    ),
  ];

  // Sort by timestamp (most recent first)
  const sortedItems = timelineItems.sort((a, b) => {
    const aTime = a.type === "activity" ? a.data.timestamp : (a.data as Comment).history[0].date;
    const bTime = b.type === "activity" ? b.data.timestamp : (b.data as Comment).history[0].date;
    return bTime - aTime;
  });

  // Group by date
  const groupedItems: { [date: string]: TimelineItem[] } = {};
  sortedItems.forEach((item) => {
    const timestamp = item.type === "activity" ? item.data.timestamp : (item.data as Comment).history[0].date;
    const date = new Date(timestamp).toLocaleDateString();
    if (!groupedItems[date]) {
      groupedItems[date] = [];
    }
    groupedItems[date].push(item);
  });

  // Get activity icon based on type (using same icons as the app)
  const getActivityIcon = (type: string): string => {
    switch (type) {
      case "created":
        return "✨";
      case "completed":
        return "✅";
      case "uncompleted":
        return "⤴️";
      case "archived":
        return "📦";
      case "unarchived":
        return "📤";
      case "deleted":
        return "🗑️";
      case "undeleted":
        return "↩️";
      case "edited":
        return "✏️";
      case "comment_added":
      case "comment_edited":
      case "comment_deleted":
        return "💭";
      case "assigned_added":
      case "assigned_removed":
        return "👤";
      case "source_added":
      case "source_removed":
        return "💼";
      case "mentioned_added":
      case "mentioned_removed":
        return "💬";
      case "project_added":
      case "project_removed":
        return "📁";
      case "priority_changed":
      case "priority_removed":
        return "🔥";
      case "duedate_changed":
      case "duedate_removed":
        return "📅";
      case "duration_changed":
      case "duration_removed":
        return "⏱️";
      case "recurring_changed":
      case "recurring_removed":
        return "🔄";
      case "dependency_added":
      case "dependency_removed":
        return "⛓️";
      case "tag_added":
      case "tag_removed":
        return "🏷️";
      case "context_changed":
        return "📝";
      case "started":
        return "🚀";
      case "cancelled":
        return "❌";
      case "workflow_state_changed":
        return "🔀";
      default:
        return "•";
    }
  };

  return (
    <div className="space-y-4">
      {sortedItems.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">No activity yet</p>
      ) : (
        Object.entries(groupedItems).map(([date, items]) => (
          <div key={date}>
            <h5 className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 mb-2 sticky top-0 bg-white dark:bg-zinc-900 py-1">
              {date === new Date().toLocaleDateString() ? "Today" : date}
            </h5>
            <div className="space-y-1">
              {items.map((item) => {
                if (item.type === "activity") {
                  const activity = item.data as GenericActivityEntry;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="flex-shrink-0 text-base leading-none mt-0.5" title={activity.type}>
                        {getActivityIcon(activity.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-700 dark:text-zinc-300">{activity.description}</span>
                        {activity.metadata !== undefined && activity.metadata !== null && (
                          <span className="ml-1 text-zinc-500 dark:text-zinc-500">
                            {typeof activity.metadata === "string"
                              ? activity.metadata
                              : String(JSON.stringify(activity.metadata))}
                          </span>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-500 ml-2"
                        title={formatActivityDateTime(activity.timestamp)}
                      >
                        {formatActivityTime(activity.timestamp)}
                      </span>
                    </div>
                  );
                } else {
                  // Comment item
                  const comment = item.data as Comment & { isEdit?: boolean };
                  const entry = comment.history[0];
                  return (
                    <div
                      key={`comment-${comment.commentId}-${entry.date}`}
                      className="flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <span className="flex-shrink-0 text-base leading-none mt-0.5" title="comment">
                        💭
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {comment.isEdit ? "Comment edited" : "Comment added"}
                        </span>
                        <div
                          className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer"
                          dangerouslySetInnerHTML={{ __html: entry.content }}
                        />
                      </div>
                      <span
                        className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-500 ml-2"
                        title={formatActivityDateTime(entry.date)}
                      >
                        {formatActivityTime(entry.date)}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
