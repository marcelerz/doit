"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for the element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: string; // Optional action hint like "Click here" or "Try typing"
  spotlightPadding?: number; // Padding around the highlighted element
}

// Main app tutorial steps (first load)
export const mainTutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Doit! 👋",
    description:
      "Let's take a quick tour to help you get started. This interactive tutorial will walk you through the main features of the app.",
    position: "center",
  },
  {
    id: "input",
    title: "Create Tasks Here ✏️",
    description:
      'Click the Add button (or press N) to open the task input. Then type your task and press Enter. Try natural language like "Call John tomorrow" or "Meeting at 3pm".',
    targetSelector: '[data-tutorial="add-button"]',
    position: "bottom",
    action: "Click to add your first task!",
    spotlightPadding: 8,
  },
  {
    id: "markers",
    title: "Use Smart Markers 🏷️",
    description:
      "In the task input, add metadata with markers:\n• @name - assign to person\n• %project - link to project\n• !!priority - set priority\n• #tag - add tags\n\nDates like 'tomorrow' are auto-detected!",
    targetSelector: '[data-tutorial="add-button"]',
    position: "bottom",
    spotlightPadding: 8,
  },
  {
    id: "views",
    title: "Multiple Views 👁️",
    description:
      "Switch between different views:\n• List - Traditional task list\n• Kanban - Drag & drop board\n• Gantt - Timeline view\n• Calendar - Monthly calendar\n\nPress keys 1-8 to switch quickly!",
    targetSelector: '[data-tutorial="view-tabs"]',
    position: "bottom",
    action: "Try clicking different tabs",
    spotlightPadding: 8,
  },
  {
    id: "filters",
    title: "Search & Filter 🔍",
    description:
      "Use the search bar (press /) to find tasks quickly. Click the filter button (press F) to filter by person, project, priority, due date, and more.",
    targetSelector: '[data-tutorial="search-bar"]',
    position: "bottom",
    action: "Try searching or click the filter button!",
    spotlightPadding: 8,
  },
  {
    id: "people-projects",
    title: "People & Projects 👥",
    description:
      "Create people and projects to organize your tasks. Click on People (5) or Projects (6) tabs to add them. Then use @name and %project in your tasks.",
    targetSelector: '[data-tutorial="view-tabs"]',
    position: "bottom",
    spotlightPadding: 8,
  },
  {
    id: "task-details",
    title: "Click for Details 📝",
    description:
      "Click on any task to open its detail view. There you can:\n• Add comments and notes\n• Set due dates and durations\n• Add subtasks\n• Set dependencies\n• Track time",
    targetSelector: '[data-tutorial="todo-list"]',
    position: "top",
    action: "Click on a task to see more",
    spotlightPadding: 12,
  },
  {
    id: "keyboard",
    title: "Keyboard Shortcuts ⌨️",
    description:
      "Work faster with shortcuts:\n• N - New task\n• / - Search\n• F - Filters\n• S - Selection mode\n• ? - Help\n• 1-8 - Switch views\n• ⌘/Ctrl+Z - Undo",
    position: "center",
  },
  {
    id: "settings",
    title: "Customize in Settings ⚙️",
    description:
      "Click the gear icon to access Settings. Customize priorities, work hours, time blocks, Kanban columns, and much more. You can also backup your data there.",
    targetSelector: '[data-tutorial="settings-button"]',
    position: "left",
    spotlightPadding: 8,
  },
  {
    id: "help",
    title: "Need Help? ❓",
    description:
      "Press ? anytime to open the Help panel with detailed guides and tutorials. You can also restart this tour from the Help menu.",
    targetSelector: '[data-tutorial="help-button"]',
    position: "left",
    spotlightPadding: 8,
  },
  {
    id: "complete",
    title: "You're Ready! 🎉",
    description:
      "That's it! You now know the basics of Doit. Start creating tasks and organizing your work.\n\nWould you like to see this tutorial again on your next visit?",
    position: "center",
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (showAgain: boolean) => void;
  steps?: TutorialStep[];
  showRememberChoice?: boolean; // Show "show again" option on last step
  tutorialId?: string; // Unique ID for this tutorial (used for SVG mask)
}

export function TutorialOverlay({
  isOpen,
  onClose,
  onComplete,
  steps = mainTutorialSteps,
  showRememberChoice = true,
  tutorialId = "main",
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate spotlight position for the current step
  const updateSpotlight = useCallback(() => {
    if (!step.targetSelector) {
      setSpotlightRect(null);
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      const padding = step.spotlightPadding || 8;
      setSpotlightRect(
        new DOMRect(rect.x - padding, rect.y - padding, rect.width + padding * 2, rect.height + padding * 2),
      );
    } else {
      setSpotlightRect(null);
    }
  }, [step]);

  // Calculate tooltip position
  const updateTooltipPosition = useCallback(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;

    let x = 0;
    let y = 0;

    if (!spotlightRect || step.position === "center") {
      // Center in viewport
      x = (viewportWidth - tooltipRect.width) / 2;
      y = (viewportHeight - tooltipRect.height) / 2;
    } else {
      const spotlightCenterX = spotlightRect.x + spotlightRect.width / 2;
      const spotlightCenterY = spotlightRect.y + spotlightRect.height / 2;

      switch (step.position) {
        case "bottom":
          x = spotlightCenterX - tooltipRect.width / 2;
          y = spotlightRect.bottom + margin;
          break;
        case "top":
          x = spotlightCenterX - tooltipRect.width / 2;
          y = spotlightRect.top - tooltipRect.height - margin;
          break;
        case "left":
          x = spotlightRect.left - tooltipRect.width - margin;
          y = spotlightCenterY - tooltipRect.height / 2;
          break;
        case "right":
          x = spotlightRect.right + margin;
          y = spotlightCenterY - tooltipRect.height / 2;
          break;
        default:
          x = spotlightCenterX - tooltipRect.width / 2;
          y = spotlightRect.bottom + margin;
      }
    }

    // Clamp to viewport
    x = Math.max(margin, Math.min(x, viewportWidth - tooltipRect.width - margin));
    y = Math.max(margin, Math.min(y, viewportHeight - tooltipRect.height - margin));

    setTooltipPosition({ x, y });
  }, [spotlightRect, step.position]);

  // Update positions on step change
  useEffect(() => {
    if (!isOpen) return;

    setIsAnimating(true);
    const timer1 = setTimeout(() => {
      updateSpotlight();
    }, 50);

    const timer2 = setTimeout(() => {
      updateTooltipPosition();
      setIsAnimating(false);
    }, 150);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, currentStep, updateSpotlight, updateTooltipPosition]);

  // Update on resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updateSpotlight();
      updateTooltipPosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isOpen, updateSpotlight, updateTooltipPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (!isLastStep) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (!isFirstStep) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLastStep, isFirstStep, onClose]);

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLastStep) {
      // Don't close yet, handled by final buttons
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onComplete(false);
  };

  const handleShowAgain = () => {
    onComplete(true);
  };

  const handleDontShowAgain = () => {
    onComplete(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <mask id={`spotlight-mask-${tutorialId}`}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="8"
                ry="8"
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask={`url(#spotlight-mask-${tutorialId})`}
          className="transition-all duration-300"
        />
      </svg>

      {/* Spotlight border highlight */}
      {spotlightRect && (
        <div
          className="absolute border-2 border-blue-400 rounded-lg pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: spotlightRect.x,
            top: spotlightRect.y,
            width: spotlightRect.width,
            height: spotlightRect.height,
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)",
            zIndex: 2,
          }}
        />
      )}

      {/* Clickable backdrop to close */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        onClick={(e) => {
          // Only close if clicking directly on backdrop, not on spotlighted element
          if (e.target === e.currentTarget) {
            // Don't auto-close on backdrop click during tutorial
          }
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`absolute bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6 max-w-md transition-all duration-300 ${
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          zIndex: 10,
        }}
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === currentStep
                  ? "w-6 bg-blue-500"
                  : index < currentStep
                  ? "w-3 bg-blue-300 dark:bg-blue-700"
                  : "w-3 bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          Step {currentStep + 1} of {steps.length}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">{step.title}</h3>

        {/* Description */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line mb-4">{step.description}</p>

        {/* Action hint */}
        {step.action && (
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
            <span className="text-lg">👆</span>
            <span>{step.action}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          {isLastStep && showRememberChoice ? (
            // Final step with remember choice - show "Show Again" / "Don't Show Again" buttons
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleDontShowAgain}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Got it! Don&apos;t show again
              </button>
              <button
                onClick={handleShowAgain}
                className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors"
              >
                Show tutorial on next visit
              </button>
            </div>
          ) : isLastStep ? (
            // Final step without remember choice - just a Done button
            <div className="flex justify-end w-full">
              <button
                onClick={() => onComplete(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Done!
              </button>
            </div>
          ) : (
            // Regular navigation
            <>
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrevious}
                    className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  Skip tutorial
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  Next
                  <span className="text-blue-200">→</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Keyboard hint */}
        {!isLastStep && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 text-center">
            Use ← → arrow keys or Enter to navigate
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// Backwards compatibility - export main steps as tutorialSteps
export const tutorialSteps = mainTutorialSteps;
