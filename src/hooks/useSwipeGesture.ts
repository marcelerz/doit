"use client";

import { useState, useRef, useCallback, CSSProperties, RefObject } from "react";

/**
 * Configuration for swipe gestures
 */
export interface SwipeGestureConfig<ActionType extends string> {
  /** Minimum distance in pixels to trigger an action */
  threshold?: number;
  /** Maximum visual offset in pixels */
  maxSwipe?: number;
  /** Whether swiping is currently disabled */
  disabled?: boolean;
  /** Callback to determine action based on swipe offset */
  getAction: (offset: number) => ActionType | null;
  /** Callback when an action is triggered on swipe end */
  onAction?: (action: ActionType) => void;
}

/**
 * State and handlers returned by useSwipeGesture
 */
export interface SwipeGestureResult<ActionType extends string> {
  /** Ref to attach to the container element */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Touch event handlers */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  /** Current swipe state */
  state: {
    /** Current horizontal swipe offset in pixels */
    offset: number;
    /** Whether user is currently swiping */
    isSwiping: boolean;
    /** Current pending action based on swipe position, or null */
    action: ActionType | null;
  };
  /** Style to apply to the swiped element for translation */
  style: CSSProperties;
  /** Reset swipe state manually */
  reset: () => void;
}

/**
 * Default configuration values
 */
const DEFAULT_THRESHOLD = 80;
const DEFAULT_MAX_SWIPE = 120;

/**
 * Hook for handling horizontal swipe gestures on touch devices.
 * Extracts the common swipe pattern used in TodoItem, NoteItem, and ReviewItem.
 *
 * @template ActionType - String union of possible swipe actions (e.g., "complete" | "archive")
 *
 * @example
 * // In TodoItem:
 * const swipe = useSwipeGesture<"complete" | "archive">({
 *   disabled: isEditing || isSelectionMode,
 *   getAction: (offset) => {
 *     if (offset > 80 && todo.isActive) return "complete";
 *     if (offset < -80 && todo.isCompleted) return "archive";
 *     return null;
 *   },
 *   onAction: (action) => {
 *     if (action === "complete") onToggle(todo.id);
 *     if (action === "archive") onArchive?.(todo.id);
 *   },
 * });
 *
 * return (
 *   <div
 *     ref={swipe.containerRef}
 *     {...swipe.handlers}
 *     style={swipe.style}
 *   >
 *     {swipe.state.action === "complete" && <CompletingIndicator />}
 *     {children}
 *   </div>
 * );
 */
export function useSwipeGesture<ActionType extends string>(
  config: SwipeGestureConfig<ActionType>
): SwipeGestureResult<ActionType> {
  const {
    threshold = DEFAULT_THRESHOLD,
    maxSwipe = DEFAULT_MAX_SWIPE,
    disabled = false,
    getAction,
    onAction,
  } = config;

  // State
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState<ActionType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
      setAction(null);
    },
    [disabled]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart || disabled) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStart.x;
      const diffY = currentY - touchStart.y;

      // If vertical scroll is larger, ignore horizontal swipe
      if (Math.abs(diffY) > Math.abs(diffX)) {
        setOffset(0);
        return;
      }

      // Prevent default scroll behavior when swiping horizontally
      if (Math.abs(diffX) > 10) {
        e.preventDefault();
      }

      // Calculate offset with resistance when exceeding max
      let newOffset = diffX;
      if (Math.abs(newOffset) > maxSwipe) {
        const extra = Math.abs(newOffset) - maxSwipe;
        newOffset = (newOffset > 0 ? 1 : -1) * (maxSwipe + extra * 0.3);
      }

      setOffset(newOffset);

      // Determine action based on offset
      const newAction = getAction(newOffset);
      setAction(newAction);
    },
    [touchStart, disabled, maxSwipe, getAction]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!touchStart) return;

    // Execute action if threshold was met
    if (action && Math.abs(offset) >= threshold && onAction) {
      onAction(action);
    }

    // Reset state
    setOffset(0);
    setTouchStart(null);
    setAction(null);
  }, [touchStart, action, offset, threshold, onAction]);

  // Manual reset function
  const reset = useCallback(() => {
    setOffset(0);
    setTouchStart(null);
    setAction(null);
  }, []);

  // Style for the swiped element
  const style: CSSProperties = {
    transform: offset !== 0 ? `translateX(${offset}px)` : undefined,
    transition: touchStart ? "none" : "transform 0.2s ease-out",
  };

  return {
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    state: {
      offset,
      isSwiping: touchStart !== null,
      action,
    },
    style,
    reset,
  };
}

/**
 * Pre-configured swipe actions for common patterns
 */

/**
 * Create a standard swipe action getter for list items.
 * Swipe right: primary action (complete/pin)
 * Swipe left: secondary action (archive/delete)
 *
 * @param threshold - Minimum distance to trigger action
 * @param config - Configuration for primary and secondary actions
 */
export function createListItemSwipeActions<Primary extends string, Secondary extends string>(
  threshold: number,
  config: {
    primaryAction: Primary;
    primaryEnabled: boolean;
    secondaryAction: Secondary;
    secondaryEnabled: boolean;
  }
): (offset: number) => Primary | Secondary | null {
  return (offset: number) => {
    if (offset > threshold && config.primaryEnabled) {
      return config.primaryAction;
    }
    if (offset < -threshold && config.secondaryEnabled) {
      return config.secondaryAction;
    }
    return null;
  };
}
