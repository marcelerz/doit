"use client";

import { useState, useEffect, useMemo } from "react";
import { Sprint, SprintId, SprintStatus, getSprintId } from "@/types/sprint";
import { getTimestamp } from "@/types/time";
import { getActivityId, getCommentId, CommentId } from "@/types/types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { createSprintId, createActivityId, createCommentId } from "@/utils/idGenerator";
import { SprintModel, createSprintModel } from "@/models/SprintModel";

// Re-export SprintModel for backward compatibility
export { SprintModel } from "@/models/SprintModel";

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
      createdAt: getTimestamp(now),
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

  const updateSprint = (id: SprintId, updates: Partial<Sprint>) => {
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

  const deleteSprint = (id: SprintId) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  };

  const startSprint = (id: SprintId) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "active" as SprintStatus,
            actualStartDate: today,
            startedAt: getTimestamp(now),
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

  const completeSprint = (id: SprintId) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "completed" as SprintStatus,
            actualEndDate: today,
            completedAt: getTimestamp(now),
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

  const cancelSprint = (id: SprintId) => {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "cancelled" as SprintStatus,
            actualEndDate: today,
            cancelledAt: getTimestamp(now),
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

  const archiveSprint = (id: SprintId) => {
    const now = Date.now();

    setSprints((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            state: "archived",
            archivedAt: getTimestamp(now),
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

  const unarchiveSprint = (id: SprintId) => {
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

  const addSprintComment = (sprintId: SprintId, content: string) => {
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

  const editSprintComment = (sprintId: SprintId, commentId: CommentId, content: string) => {
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

  const deleteSprintComment = (sprintId: SprintId, commentId: CommentId) => {
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
