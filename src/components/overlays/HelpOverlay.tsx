"use client";

import { useState } from "react";
import { FeatureSettings } from "@/types/settings";
import { HELP_SECTIONS, HelpSection, useViewShortcuts } from "./help/shortcuts";
import { GettingStartedSection } from "./help/GettingStartedSection";
import { QuickStartSection } from "./help/QuickStartSection";
import { ViewsSection } from "./help/ViewsSection";
import { InputSection } from "./help/InputSection";
import { FilteringSection } from "./help/FilteringSection";
import { PeopleProjectsSection } from "./help/PeopleProjectsSection";
import { TimeTrackingSection } from "./help/TimeTrackingSection";
import { KeyboardSection } from "./help/KeyboardSection";
import { SettingsSection } from "./help/SettingsSection";
import { WorkflowsSection } from "./help/WorkflowsSection";
import { ProductivityTechniquesSection } from "./help/ProductivityTechniquesSection";
import { AdvancedSection } from "./help/AdvancedSection";
import { Modal } from "@/components/shared/Modal";
import { CloseIcon } from "@/components/shared/Icons";

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTutorial?: () => void;
  /** Which views this user has enabled; the digit shortcuts index into them. */
  features?: FeatureSettings;
}

export function HelpOverlay({ isOpen, onClose, onRestartTutorial, features }: HelpOverlayProps) {
  const [activeSection, setActiveSection] = useState<HelpSection>("getting-started");
  const shortcuts = useViewShortcuts(features);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" label="Help">
      <div className="flex flex-col h-[80vh] max-h-[800px]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                ❓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Help & Documentation</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Learn how to use Doit effectively</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 mt-4">
            {HELP_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="mr-1">{section.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "getting-started" && <GettingStartedSection onRestartTutorial={onRestartTutorial} />}
          {activeSection === "quick-start" && <QuickStartSection />}
          {activeSection === "views" && <ViewsSection shortcuts={shortcuts} />}
          {activeSection === "input" && <InputSection />}
          {activeSection === "filtering" && <FilteringSection />}
          {activeSection === "people-projects" && <PeopleProjectsSection />}
          {activeSection === "time-tracking" && <TimeTrackingSection />}
          {activeSection === "keyboard" && <KeyboardSection shortcuts={shortcuts} />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "workflows" && <WorkflowsSection />}
          {activeSection === "productivity" && <ProductivityTechniquesSection />}
          {activeSection === "advanced" && <AdvancedSection />}
        </div>
      </div>
    </Modal>
  );
}
