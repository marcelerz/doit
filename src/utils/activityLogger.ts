/**
 * Activity logging utilities for tracking changes to todos
 */

import { TodoActivityType, TodoMetadata } from "@/types/todo";
import { ActivityEntry } from "@/types/types";
import { getTimestamp } from "@/types/time";
import { generateActivityId } from "@/utils/activityUtils";

/**
 * Create a new activity entry
 */
export function createActivity(
  type: TodoActivityType,
  description: string,
  metadata?: Record<string, unknown>,
): ActivityEntry<TodoActivityType> {
  return {
    id: generateActivityId(),
    timestamp: getTimestamp(Date.now()),
    type,
    description,
    metadata,
  };
}

/**
 * Compare two metadata objects and generate activities for changes
 */
export function generateMetadataActivities(
  oldMetadata: TodoMetadata,
  newMetadata: TodoMetadata,
): ActivityEntry<TodoActivityType>[] {
  const activities: ActivityEntry<TodoActivityType>[] = [];

  // Check assigned people changes
  const addedAssigned = newMetadata.assignedPeople.filter((p) => !oldMetadata.assignedPeople.includes(p));
  const removedAssigned = oldMetadata.assignedPeople.filter((p) => !newMetadata.assignedPeople.includes(p));
  addedAssigned.forEach((person) => {
    activities.push(createActivity("assigned_added", `Assigned to @${person}`));
  });
  removedAssigned.forEach((person) => {
    activities.push(createActivity("assigned_removed", `Unassigned from @${person}`));
  });

  // Check source people changes
  const addedSource = newMetadata.sourcePeople.filter((p) => !oldMetadata.sourcePeople.includes(p));
  const removedSource = oldMetadata.sourcePeople.filter((p) => !newMetadata.sourcePeople.includes(p));
  addedSource.forEach((person) => {
    activities.push(createActivity("source_added", `Added source $${person}`));
  });
  removedSource.forEach((person) => {
    activities.push(createActivity("source_removed", `Removed source $${person}`));
  });

  // Check mentioned people changes
  const addedMentioned = newMetadata.mentionedPeople.filter((p) => !oldMetadata.mentionedPeople.includes(p));
  const removedMentioned = oldMetadata.mentionedPeople.filter((p) => !newMetadata.mentionedPeople.includes(p));
  addedMentioned.forEach((person) => {
    activities.push(createActivity("mentioned_added", `Mentioned ^${person}`));
  });
  removedMentioned.forEach((person) => {
    activities.push(createActivity("mentioned_removed", `Removed mention ^${person}`));
  });

  // Check project changes
  const addedProjects = newMetadata.projects.filter((p) => !oldMetadata.projects.includes(p));
  const removedProjects = oldMetadata.projects.filter((p) => !newMetadata.projects.includes(p));
  addedProjects.forEach((project) => {
    activities.push(createActivity("project_added", `Added to project #${project}`));
  });
  removedProjects.forEach((project) => {
    activities.push(createActivity("project_removed", `Removed from project #${project}`));
  });

  // Check priority changes
  if (oldMetadata.priority !== newMetadata.priority) {
    if (newMetadata.priority && !oldMetadata.priority) {
      activities.push(createActivity("priority_changed", `Set priority to !!${newMetadata.priority}`));
    } else if (!newMetadata.priority && oldMetadata.priority) {
      activities.push(createActivity("priority_removed", `Removed priority !!${oldMetadata.priority}`));
    } else if (newMetadata.priority && oldMetadata.priority) {
      activities.push(
        createActivity(
          "priority_changed",
          `Changed priority from !!${oldMetadata.priority} to !!${newMetadata.priority}`,
        ),
      );
    }
  }

  // Check due date changes
  if (oldMetadata.dueDate !== newMetadata.dueDate) {
    if (newMetadata.dueDate && !oldMetadata.dueDate) {
      activities.push(createActivity("duedate_changed", `Set due date to ~${newMetadata.dueDate}`));
    } else if (!newMetadata.dueDate && oldMetadata.dueDate) {
      activities.push(createActivity("duedate_removed", `Removed due date`));
    } else if (newMetadata.dueDate && oldMetadata.dueDate) {
      activities.push(createActivity("duedate_changed", `Changed due date to ~${newMetadata.dueDate}`));
    }
  }

  // Check duration changes
  if (oldMetadata.duration !== newMetadata.duration) {
    if (newMetadata.duration && !oldMetadata.duration) {
      activities.push(createActivity("duration_changed", `Set duration to *${newMetadata.duration}`));
    } else if (!newMetadata.duration && oldMetadata.duration) {
      activities.push(createActivity("duration_removed", `Removed duration`));
    } else if (newMetadata.duration && oldMetadata.duration) {
      activities.push(createActivity("duration_changed", `Changed duration to *${newMetadata.duration}`));
    }
  }

  // Check recurring changes
  if (oldMetadata.recurring !== newMetadata.recurring) {
    if (newMetadata.recurring && !oldMetadata.recurring) {
      activities.push(createActivity("recurring_changed", `Set recurring to %${newMetadata.recurring}`));
    } else if (!newMetadata.recurring && oldMetadata.recurring) {
      activities.push(createActivity("recurring_removed", `Removed recurring pattern`));
    } else if (newMetadata.recurring && oldMetadata.recurring) {
      activities.push(createActivity("recurring_changed", `Changed recurring to %${newMetadata.recurring}`));
    }
  }

  // Check dependency changes
  const newDeps = newMetadata.dependencies ?? [];
  const oldDeps = oldMetadata.dependencies ?? [];
  const addedDeps = newDeps.filter((d) => !oldDeps.includes(d));
  const removedDeps = oldDeps.filter((d) => !newDeps.includes(d));
  addedDeps.forEach((dep) => {
    activities.push(createActivity("dependency_added", `Added dependency >${dep}`));
  });
  removedDeps.forEach((dep) => {
    activities.push(createActivity("dependency_removed", `Removed dependency >${dep}`));
  });

  // Check tag changes
  const newTags = newMetadata.tags ?? [];
  const oldTags = oldMetadata.tags ?? [];
  const addedTags = newTags.filter((t) => !oldTags.includes(t));
  const removedTags = oldTags.filter((t) => !newTags.includes(t));
  addedTags.forEach((tag) => {
    activities.push(createActivity("tag_added", `Added tag &${tag}`));
  });
  removedTags.forEach((tag) => {
    activities.push(createActivity("tag_removed", `Removed tag &${tag}`));
  });

  // Check context changes
  if (oldMetadata.context !== newMetadata.context) {
    if (newMetadata.context && !oldMetadata.context) {
      activities.push(createActivity("context_changed", `Added context`));
    } else if (!newMetadata.context && oldMetadata.context) {
      activities.push(createActivity("context_changed", `Removed context`));
    } else {
      activities.push(createActivity("context_changed", `Updated context`));
    }
  }

  return activities;
}

// Re-export formatting functions from formatters.ts for backward compatibility
export { formatActivityTime, formatActivityDateTime } from "@/utils/formatters";
