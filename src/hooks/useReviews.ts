"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Review,
  ReviewId,
  ReviewLevel,
  ReviewActivityType,
  ReviewEntry,
  ReviewTaskEntry,
  ReviewChildEntry,
} from "@/types/review";
import { getTag } from "@/types/todo";
import { getTimestamp } from "@/types/time";
import { getProjectId } from "@/types/project";
import { ActivityEntry } from "@/types/types";

import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { waitForStorageInit } from "@/storage/storage";
import { ReviewModel, createReviewModels } from "@/models/ReviewModel";
import { createSettingsModel } from "@/models/SettingsModel";
import { createActivityEntry } from "@/utils/activityUtils";
import { useUndoableActions, UndoableAction } from "./useUndoableActions";
import { useSharedSettings } from "@/storage/settingsStore";
import { renameInRecord, EntityKind } from "@/utils/renameReferences";

/**
 * Create a new activity entry for reviews
 */
function createReviewActivity(
  type: ReviewActivityType,
  description: string,
  metadata?: Record<string, unknown>
): ActivityEntry<ReviewActivityType> {
  return createActivityEntry(type, description, metadata);
}

export type ReviewUndoAction = UndoableAction<"delete" | "archive", Review>;

export function useReviews() {
  const [rawReviews, setRawReviews] = useState<Review[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { settings } = useSharedSettings();

  // Finalize handler for undo actions (called when timeout expires or dismissed)
  const handleFinalize = useCallback((action: ReviewUndoAction) => {
    if (action.type === "delete") {
      // Actually remove the deleted review from storage
      setRawReviews((prev) => prev.filter((review) => review.id !== action.entity.id));
    }
    // Archive actions don't need any finalization - the state is already updated
  }, []);

  // Undo handler for restoring previous state
  const handleUndo = useCallback((action: ReviewUndoAction) => {
    if (action.type === "delete") {
      // Restore the deleted review with its previous state and add undelete activity
      if (action.previousState) {
        const restoredReview: Review = {
          ...action.previousState,
          activity: [...action.previousState.activity, createReviewActivity("undeleted", "Review undeleted")],
        };
        setRawReviews((prev) => [restoredReview, ...prev]);
      }
    } else if (action.type === "archive" && action.previousState) {
      // Restore previous state for archive with appropriate activity
      setRawReviews((prev) =>
        prev.map((review) => {
          if (review.id === action.entity.id) {
            return {
              ...action.previousState!,
              activity: [...action.previousState!.activity, createReviewActivity("unarchived", "Archive undone")],
            };
          }
          return review;
        })
      );
    }
  }, []);

  const { undoActions, fadingOutIds, createUndoAction, undo, dismissUndo } = useUndoableActions<
    "delete" | "archive",
    Review
  >({
    onFinalize: handleFinalize,
    onUndo: handleUndo,
  });

  // Create a SettingsModel from settings for use with ReviewModel
  const settingsModel = useMemo(() => createSettingsModel(settings), [settings]);

  // Create ReviewModel instances from raw reviews
  const reviews = useMemo(() => createReviewModels(rawReviews, settingsModel), [rawReviews, settingsModel]);

  // Load reviews from storage on mount
  useEffect(() => {
    waitForStorageInit().then(async () => {
      const loadedReviews = await loadFromStorage<Review[]>(STORAGE_KEYS.REVIEWS, []);
      // Filter out any deleted reviews
      const cleanedReviews = loadedReviews.filter((review) => review.state !== "deleted");
      setRawReviews(cleanedReviews);

      // If we removed deleted reviews, save the cleaned data
      if (cleanedReviews.length !== loadedReviews.length) {
        saveToStorage(STORAGE_KEYS.REVIEWS, cleanedReviews);
      }

      setIsLoaded(true);
    });
  }, []);

  // Save reviews to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.REVIEWS, rawReviews);
    }
  }, [rawReviews, isLoaded]);

  // Find a review by ID
  const find = useCallback(
    (id: ReviewId): ReviewModel | undefined => {
      return reviews.find((r) => r.id === id);
    },
    [reviews]
  );

  // Add a new review
  const addReview = useCallback(
    (
      level: ReviewLevel,
      periodStart: string,
      periodEnd: string,
      periodLabel: string,
      entries: ReviewEntry[] = []
    ): ReviewId => {
      const now = getTimestamp(Date.now());
      const newReview: Review = {
        id: ReviewModel.createId(),
        level,
        periodStart,
        periodEnd,
        periodLabel,
        state: "pending",
        createdAt: now,
        updatedAt: now,
        title: periodLabel, // Default title to period label
        summary: "",
        entries,
        projects: [],
        tags: [],
        comments: [],
        activity: [createReviewActivity("created", "Review created")],
      };
      setRawReviews((prev) => [newReview, ...prev]);
      return newReview.id;
    },
    []
  );

  // Edit a review (only if pending)
  /**
   * Rewrite project references after that project was renamed.
   *
   * Not routed through editReview, which only accepts pending reviews -- a
   * completed or archived review would otherwise keep the stale name forever.
   */
  const renameEntityReferences = (kind: EntityKind, name: string, nextName: string) => {
    setRawReviews((prev) => prev.map((review) => renameInRecord(review, kind, name, nextName) ?? review));
  };

  const editReview = useCallback(
    (
      id: ReviewId,
      updates: {
        title?: string;
        summary?: string;
        projects?: string[];
        tags?: string[];
      }
    ) => {
      setRawReviews((prev) =>
        prev.map((review) => {
          if (review.id === id && review.state === "pending") {
            const activities: ActivityEntry<ReviewActivityType>[] = [];

            if (updates.title !== undefined && updates.title !== review.title) {
              activities.push(createReviewActivity("title_changed", "Title updated"));
            }
            if (updates.summary !== undefined && updates.summary !== review.summary) {
              activities.push(createReviewActivity("summary_changed", "Summary updated"));
            }

            return {
              ...review,
              title: updates.title !== undefined ? updates.title : review.title,
              summary: updates.summary !== undefined ? updates.summary : review.summary,
              projects: updates.projects !== undefined ? updates.projects.map((p) => getProjectId(p)) : review.projects,
              tags: updates.tags !== undefined ? updates.tags.map((t) => getTag(t)) : review.tags,
              updatedAt: getTimestamp(Date.now()),
              activity: [...review.activity, ...activities],
            };
          }
          return review;
        })
      );
    },
    []
  );

  // Complete a review (mark as completed, no longer editable)
  const completeReview = useCallback((id: ReviewId) => {
    setRawReviews((prev) =>
      prev.map((review) => {
        if (review.id === id && review.state === "pending") {
          const now = getTimestamp(Date.now());
          return {
            ...review,
            state: "completed",
            completedAt: now,
            updatedAt: now,
            activity: [...review.activity, createReviewActivity("completed", "Review completed")],
          };
        }
        return review;
      })
    );
  }, []);

  // Delete a review
  const deleteReview = useCallback(
    (id: ReviewId) => {
      const reviewToDelete = rawReviews.find((r) => r.id === id);
      if (!reviewToDelete) return;

      const previousState = structuredClone(reviewToDelete);
      const now = getTimestamp(Date.now());
      const deletedReview: Review = {
        ...reviewToDelete,
        state: "deleted",
        deletedAt: now,
        updatedAt: now,
        activity: [...reviewToDelete.activity, createReviewActivity("deleted", "Review deleted")],
      };

      // Update the review to deleted state
      setRawReviews((prev) => prev.map((review) => (review.id === id ? deletedReview : review)));

      // Create undo action
      createUndoAction("delete", deletedReview, previousState, id);
    },
    [rawReviews, createUndoAction]
  );

  // Archive a review
  const archiveReview = useCallback(
    (id: ReviewId) => {
      const reviewToArchive = rawReviews.find((r) => r.id === id);
      if (!reviewToArchive) return;

      const previousState = structuredClone(reviewToArchive);
      const now = getTimestamp(Date.now());
      const updatedReview: Review = {
        ...reviewToArchive,
        state: "archived",
        archivedAt: now,
        updatedAt: now,
        deletedAt: undefined,
        activity: [...reviewToArchive.activity, createReviewActivity("archived", "Review archived")],
      };

      setRawReviews((prev) => prev.map((review) => (review.id === id ? updatedReview : review)));

      // Create undo action
      createUndoAction("archive", updatedReview, previousState, id);
    },
    [rawReviews, createUndoAction]
  );

  // Unarchive a review
  const unarchiveReview = useCallback((id: ReviewId) => {
    setRawReviews((prev) =>
      prev.map((review) => {
        if (review.id === id) {
          return {
            ...review,
            state: "completed", // Return to completed state
            archivedAt: undefined,
            deletedAt: undefined,
            updatedAt: getTimestamp(Date.now()),
            activity: [...review.activity, createReviewActivity("unarchived", "Review unarchived")],
          };
        }
        return review;
      })
    );
  }, []);

  // ===== Entry Operations =====

  // Add an entry to a review
  const addEntry = useCallback((reviewId: ReviewId, entry: ReviewEntry) => {
    setRawReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId && review.state === "pending") {
          return {
            ...review,
            entries: [...review.entries, entry],
            updatedAt: getTimestamp(Date.now()),
            activity: [
              ...review.activity,
              createReviewActivity("entry_added", `Added ${entry.type === "task" ? "task" : "review"}: ${entry.title}`),
            ],
          };
        }
        return review;
      })
    );
  }, []);

  // Update an entry in a review
  const updateEntry = useCallback(
    (reviewId: ReviewId, entryIndex: number, updates: Partial<ReviewTaskEntry | ReviewChildEntry>) => {
      setRawReviews((prev) =>
        prev.map((review) => {
          if (review.id === reviewId && review.state === "pending") {
            const newEntries = [...review.entries];
            if (entryIndex >= 0 && entryIndex < newEntries.length) {
              newEntries[entryIndex] = { ...newEntries[entryIndex], ...updates } as ReviewEntry;
            }
            return {
              ...review,
              entries: newEntries,
              updatedAt: getTimestamp(Date.now()),
              activity: [...review.activity, createReviewActivity("entry_edited", "Entry updated")],
            };
          }
          return review;
        })
      );
    },
    []
  );

  // Remove an entry from a review
  const removeEntry = useCallback((reviewId: ReviewId, entryIndex: number) => {
    setRawReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId && review.state === "pending") {
          const removedEntry = review.entries[entryIndex];
          const newEntries = review.entries.filter((_, i) => i !== entryIndex);
          return {
            ...review,
            entries: newEntries,
            updatedAt: getTimestamp(Date.now()),
            activity: [
              ...review.activity,
              createReviewActivity("entry_removed", `Removed ${removedEntry?.type === "task" ? "task" : "review"}`),
            ],
          };
        }
        return review;
      })
    );
  }, []);

  // Toggle entry collapsed state
  const toggleEntryCollapsed = useCallback((reviewId: ReviewId, entryIndex: number) => {
    setRawReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId) {
          const newEntries = [...review.entries];
          if (entryIndex >= 0 && entryIndex < newEntries.length) {
            const entry = newEntries[entryIndex];
            const wasCollapsed = entry.collapsed;
            newEntries[entryIndex] = { ...entry, collapsed: !entry.collapsed };
            return {
              ...review,
              entries: newEntries,
              updatedAt: getTimestamp(Date.now()),
              activity: [
                ...review.activity,
                createReviewActivity(wasCollapsed ? "entry_expanded" : "entry_collapsed", "Entry toggled"),
              ],
            };
          }
        }
        return review;
      })
    );
  }, []);

  // ===== Comment Operations =====




  return {
    renameEntityReferences,
    reviews,
    rawReviews,
    find,
    addReview,
    editReview,
    completeReview,
    deleteReview,
    archiveReview,
    unarchiveReview,
    addEntry,
    updateEntry,
    removeEntry,
    toggleEntryCollapsed,
    isLoaded,
    undoActions,
    fadingOutIds,
    undo,
    dismissUndo,
    settings,
  };
}
