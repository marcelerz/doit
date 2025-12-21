"use client";

import { useState, useEffect, useMemo } from "react";
import { Sprint, SprintStatus, getSprintId } from "@/types/sprint";
import { getTimestamp } from "@/types/time";
import { getActivityId, getCommentId } from "@/types/types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storageInit";
import { createSprintId, createActivityId, createCommentId } from "@/utils/idGenerator";

export interface SprintModel extends Sprint {
  // Computed properties
  isActive: boolean;
  isArchived: boolean;
  isPlanning: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  hasComments: boolean;
  commentCount: number;
  hasActivity: boolean;
  activityCount: number;
  displayName: string;
  statusLabel: string;
  statusColor: string;
  plannedEndDate: string | undefined;
  daysRemaining: number | null;
  daysElapsed: number | null;
  progress: number; // 0-100 percentage of time elapsed
  raw: Sprint;
  // Validation
  canStart: (allSprints: SprintModel[]) => boolean;
  canComplete: () => boolean;
  canCancel: () => boolean;
  canArchive: () => boolean;
  canUnarchive: () => boolean;
  canDelete: () => boolean;
}

const statusColors: Record<SprintStatus, string> = {
  planning: "#60a5fa", // blue
  active: "#4ade80", // green
  completed: "#9ca3af", // gray
  cancelled: "#f87171", // red
};

const statusLabels: Record<SprintStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

function createSprintModel(sprint: Sprint): SprintModel {
  const isActive = sprint.state === "active";
  const isArchived = sprint.state === "archived";
  const isPlanning = sprint.status === "planning";
  const isCompleted = sprint.status === "completed";
  const isCancelled = sprint.status === "cancelled";
  const isRunning = sprint.status === "active";

  // Calculate planned end date from start date + duration
  let plannedEndDate: string | undefined;
  const startDate = sprint.actualStartDate || sprint.plannedStartDate;
  if (startDate && sprint.durationDays) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + sprint.durationDays);
    plannedEndDate = start.toISOString().split("T")[0];
  }

  // Calculate days remaining (for active sprints)
  let daysRemaining: number | null = null;
  let daysElapsed: number | null = null;
  let progress = 0;

  if (isRunning && sprint.actualStartDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(sprint.actualStartDate);
    start.setHours(0, 0, 0, 0);

    daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = sprint.durationDays - daysElapsed;
    progress = Math.min(100, Math.max(0, (daysElapsed / sprint.durationDays) * 100));
  }

  return {
    ...sprint,
    isActive,
    isArchived,
    isPlanning,
    isCompleted,
    isCancelled,
    hasComments: sprint.comments?.length > 0,
    commentCount: sprint.comments?.length || 0,
    hasActivity: sprint.activity?.length > 0,
    activityCount: sprint.activity?.length || 0,
    displayName: sprint.name,
    statusLabel: statusLabels[sprint.status],
    statusColor: statusColors[sprint.status],
    plannedEndDate,
    daysRemaining,
    daysElapsed,
    progress,
    raw: sprint,
    canStart: (allSprints: SprintModel[]) => {
      // Can only start if no other sprint is currently running
      const hasActiveSprint = allSprints.some((s) => s.status === "active" && s.id !== sprint.id);
      return isPlanning && !isArchived && !hasActiveSprint;
    },
    canComplete: () => isRunning && !isArchived,
    canCancel: () => (isPlanning || isRunning) && !isArchived,
    canArchive: () => (isCompleted || isCancelled) && !isArchived,
    canUnarchive: () => isArchived,
    canDelete: () => isPlanning && !isArchived, // Can only delete planning sprints
  };
}

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sprints from storage on mount
  useEffect(() => {
    const load = async () => {
      await waitForStorageInit();
      const loaded = await loadFromStorage<Sprint[]>(STORAGE_KEYS.SPRINTS, []);
      // Migrate old sprints that might not have new fields
      const migrated = loaded.map((s) => ({
        ...s,
        state: s.state || "active",
        durationDays: s.durationDays || 14,
        comments: s.comments || [],
        activity: s.activity || [],
      }));
      setSprints(migrated);
      setIsLoaded(true);
    };
    load();
  }, []);

  // Save sprints to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.SPRINTS, sprints).catch((error) => {
        console.error("Failed to save sprints:", error);
      });
    }
  }, [sprints, isLoaded]);

  // Convert to models
  const sprintModels = useMemo(() => {
    return sprints.map(createSprintModel);
  }, [sprints]);

  // Get active (non-archived) sprints
  const activeSprints = useMemo(() => {
    return sprintModels.filter((s) => s.state === "active");
  }, [sprintModels]);

  // Get archived sprints
  const archivedSprints = useMemo(() => {
    return sprintModels.filter((s) => s.state === "archived");
  }, [sprintModels]);

  // Get the currently running sprint
  const runningSprint = useMemo(() => {
    return sprintModels.find((s) => s.status === "active" && s.state === "active");
  }, [sprintModels]);

  // Get next planned sprint (first planning sprint by creation date)
  const nextPlannedSprint = useMemo(() => {
    return activeSprints.filter((s) => s.status === "planning").sort((a, b) => a.createdAt - b.createdAt)[0];
  }, [activeSprints]);

  const addSprint = (sprint: Omit<Sprint, "id" | "createdAt" | "state" | "status" | "comments" | "activity">) => {
    const now = Date.now();
    const newSprint: Sprint = {
      ...sprint,
      id: getSprintId(createSprintId()),
      status: "planning",
      state: "active",
      createdAt: now,
      comments: [],
      activity: [
        {
          id: getActivityId(createActivityId()),
          timestamp: getTimestamp(now),
          type: "created",
          description: "Sprint created",
        },
      ],
    };
    setSprints((prev) => [...prev, newSprint]);
    return newSprint.id;
  };

  const updateSprint = (id: string, updates: Partial<Sprint>) => {
    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const now = Date.now();
          return {
            ...s,
            ...updates,
            activity: [
              ...(s.activity || []),
              {
                id: getActivityId(createActivityId()),
                timestamp: getTimestamp(now),
                type: "updated",
                description: "Sprint updated",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const deleteSprint = (id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  };

  const startSprint = (id: string) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "active" as SprintStatus,
            actualStartDate: today,
            startedAt: now,
            activity: [
              ...(s.activity || []),
              {
                id: getActivityId(createActivityId()),
                timestamp: getTimestamp(now),
                type: "started",
                description: "Sprint started",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const completeSprint = (id: string) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "completed" as SprintStatus,
            actualEndDate: today,
            completedAt: now,
            activity: [
              ...(s.activity || []),
              {
                id: getActivityId(createActivityId()),
                timestamp: getTimestamp(now),
                type: "completed",
                description: "Sprint completed",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const cancelSprint = (id: string) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "cancelled" as SprintStatus,
            actualEndDate: today,
            cancelledAt: now,
            activity: [
              ...(s.activity || []),
              {
                id: getActivityId(createActivityId()),
                timestamp: getTimestamp(now),
                type: "cancelled",
                description: "Sprint cancelled",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const archiveSprint = (id: string) => {
    const now = Date.now();

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            state: "archived",
            archivedAt: now,
            activity: [
              ...(s.activity || []),
              {
                id: getActivityId(createActivityId()),
                timestamp: getTimestamp(now),
                type: "archived",
                description: "Sprint archived",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const unarchiveSprint = (id: string) => {
    const now = Date.now();

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            state: "active",
            archivedAt: undefined,
            activity: [
              ...(s.activity || []),
              {
                id: getActivityId(createActivityId()),
                timestamp: getTimestamp(now),
                type: "unarchived",
                description: "Sprint unarchived",
              },
            ],
          };
        }
        return s;
      }),
    );
  };

  const addSprintComment = (sprintId: string, content: string) => {
    const now = Date.now();
    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === sprintId) {
          const newComment = {
            commentId: getCommentId(createCommentId()),
            history: [{ timestamp: getTimestamp(now), content }],
          };
          return {
            ...s,
            comments: [...(s.comments || []), newComment],
          };
        }
        return s;
      }),
    );
  };

  const editSprintComment = (sprintId: string, commentId: string, content: string) => {
    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === sprintId) {
          return {
            ...s,
            comments: (s.comments || []).map((c) =>
              c.commentId === commentId
                ? { ...c, history: [...c.history, { timestamp: getTimestamp(Date.now()), content }] }
                : c,
            ),
          };
        }
        return s;
      }),
    );
  };

  const deleteSprintComment = (sprintId: string, commentId: string) => {
    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === sprintId) {
          return {
            ...s,
            comments: (s.comments || []).filter((c) => c.commentId !== commentId),
          };
        }
        return s;
      }),
    );
  };

  return {
    sprints: sprintModels,
    activeSprints,
    archivedSprints,
    runningSprint,
    nextPlannedSprint,
    isLoaded,
    addSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    cancelSprint,
    archiveSprint,
    unarchiveSprint,
    addSprintComment,
    editSprintComment,
    deleteSprintComment,
  };
}
