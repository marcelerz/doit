"use client";

import { useMemo } from "react";
import { getEnabledViews } from "@/types/viewRegistry";
import { FeatureSettings } from "@/types/settings";

export type HelpSection =
  | "getting-started"
  | "quick-start"
  | "views"
  | "input"
  | "filtering"
  | "people-projects"
  | "time-tracking"
  | "keyboard"
  | "settings"
  | "workflows"
  | "productivity"
  | "advanced";

export interface HelpSectionData {
  id: HelpSection;
  title: string;
  icon: string;
}

/** The nav list, in display order. */
export const HELP_SECTIONS: HelpSectionData[] = [
  { id: "getting-started", title: "Getting Started", icon: "🚀" },
  { id: "quick-start", title: "Quick Start Guide", icon: "⚡" },
  { id: "views", title: "Views", icon: "👁️" },
  { id: "input", title: "Smart Input", icon: "✏️" },
  { id: "filtering", title: "Filtering & Sorting", icon: "🔍" },
  { id: "people-projects", title: "People & Projects", icon: "👥" },
  { id: "time-tracking", title: "Time & Focus", icon: "⏱️" },
  { id: "keyboard", title: "Keyboard Shortcuts", icon: "⌨️" },
  { id: "settings", title: "Settings", icon: "🔧" },
  { id: "workflows", title: "Workflows & Tutorials", icon: "📖" },
  { id: "productivity", title: "Productivity Techniques", icon: "💡" },
  { id: "advanced", title: "Advanced Features", icon: "⚙️" },
];

export interface ViewShortcuts {
  /** Views that have a digit key, in order. */
  bound: { key: string; label: string }[];
  /** Views past the ninth, which cannot be bound to a single digit. */
  unbound: string[];
  /** Display form of the bound range, e.g. "1-9". */
  range: string;
}

/** " (3)" for a view that has a digit key, or "" for one that does not. */
export function shortcutFor(shortcuts: ViewShortcuts, label: string): string {
  const match = shortcuts.bound.find((entry) => entry.label === label);
  return match ? ` (${match.key})` : "";
}

/**
 * The digit shortcuts as this user actually has them.
 *
 * The numbers index into getEnabledViews, so which view "5" opens depends on
 * the feature flags. Every mention of them here used to be written out by
 * hand, and had drifted to a list of eight that no longer matched anything.
 */
export function useViewShortcuts(features: FeatureSettings | undefined): ViewShortcuts {
  return useMemo(() => {
    const views = getEnabledViews(features);
    // Only single digits can be bound, so views past the ninth have no key.
    const bound = views.slice(0, 9).map((view, index) => ({ key: String(index + 1), label: view.label }));
    return {
      bound,
      unbound: views.slice(9).map((view) => view.label),
      range: bound.length === 0 ? "" : bound.length === 1 ? "1" : `1-${bound.length}`,
    };
  }, [features]);
}
