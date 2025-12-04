"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { PrioritiesTab } from "@/components/settings/PrioritiesTab";
import { LinksTab } from "@/components/settings/LinksTab";
import { MarkersTab } from "@/components/settings/MarkersTab";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { DateTimeTab } from "@/components/settings/DateTimeTab";
import { WorkHoursTab } from "@/components/settings/WorkHoursTab";
import { GanttTab } from "@/components/settings/GanttTab";
import { AutoAssignTab } from "@/components/settings/AutoAssignTab";
import { BackupTab } from "@/components/settings/BackupTab";
import { StorageTab } from "@/components/settings/StorageTab";

type Tab =
  | "general"
  | "datetime"
  | "workhours"
  | "gantt"
  | "autoassign"
  | "priorities"
  | "links"
  | "markers"
  | "backup"
  | "storage";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if scrolling is needed and which direction
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const hasOverflow = scrollWidth > clientWidth;

        setShowLeftHint(hasOverflow && scrollLeft > 0);
        setShowRightHint(hasOverflow && scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const handleScrollHoverEnter = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft += direction === "right" ? 5 : -5;
        }
      }, 20);
    }
  };

  const handleScrollHoverLeave = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };
  const {
    settings,
    isLoaded: settingsLoaded,
    addPriority,
    updatePriority,
    deletePriority,
    addLinkPattern,
    updateLinkPattern,
    deleteLinkPattern,
    updateMarkerColors,
    updateGeneralSettings,
    updateDateTimeSettings,
    updateWorkHoursSettings,
    updateGantt,
    updateAutoAssignSettings,
  } = useSettings();

  const { people, isLoaded: peopleLoaded, addPerson, updatePerson, deletePerson } = usePeople();

  const { projects, isLoaded: projectsLoaded, addProject, updateProject, deleteProject } = useProjects();

  const isLoaded = settingsLoaded && peopleLoaded && projectsLoaded;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  const tabs: Record<string, Tab> = {
    General: "general",
    "Date/Time": "datetime",
    "Work Hours": "workhours",
    Gantt: "gantt",
    "Auto-Assign": "autoassign",
    Priorities: "priorities",
    Links: "links",
    Markers: "markers",
    Backup: "backup",
    Storage: "storage",
  };

  const buttons = Object.entries(tabs).map(([label]) => {
    return (
      <button
        onClick={() => setActiveTab(tabs[label])}
        className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
          activeTab === tabs[label]
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        }`}
      >
        {label}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
            >
              ← Back to Todos
            </Link>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Configure general settings, date/time, priorities, link patterns, and marker colors for your todo app
          </p>
        </header>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide touch-pan-x"
              style={{
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {buttons}
            </div>

            {/* Scroll hint overlay on the left */}
            {showLeftHint && (
              <div
                className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent pointer-events-auto flex items-center justify-start pl-2 z-10"
                onMouseEnter={() => handleScrollHoverEnter("left")}
                onMouseLeave={handleScrollHoverLeave}
              >
                <div className="text-zinc-600 dark:text-zinc-300 drop-shadow-md">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Scroll hint overlay on the right */}
            {showRightHint && (
              <div
                className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-auto flex items-center justify-end pr-2 z-10"
                onMouseEnter={() => handleScrollHoverEnter("right")}
                onMouseLeave={handleScrollHoverLeave}
              >
                <div className="text-zinc-600 dark:text-zinc-300 drop-shadow-md">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            {activeTab === "general" && <GeneralTab general={settings.general} onUpdate={updateGeneralSettings} />}
            {activeTab === "datetime" && <DateTimeTab dateTime={settings.dateTime} onUpdate={updateDateTimeSettings} />}
            {activeTab === "workhours" && (
              <WorkHoursTab workHours={settings.workHours} onUpdate={updateWorkHoursSettings} />
            )}
            {activeTab === "gantt" && <GanttTab gantt={settings.gantt} onUpdate={updateGantt} />}
            {activeTab === "autoassign" && (
              <AutoAssignTab
                autoAssign={settings.autoAssign}
                people={people}
                projects={projects}
                priorities={settings.priorities}
                onUpdate={updateAutoAssignSettings}
              />
            )}
            {activeTab === "priorities" && (
              <PrioritiesTab
                priorities={settings.priorities}
                onAdd={addPriority}
                onUpdate={updatePriority}
                onDelete={deletePriority}
              />
            )}
            {activeTab === "links" && (
              <LinksTab
                linkPatterns={settings.linkPatterns}
                onAdd={addLinkPattern}
                onUpdate={updateLinkPattern}
                onDelete={deleteLinkPattern}
              />
            )}
            {activeTab === "markers" && (
              <MarkersTab markerColors={settings.markerColors} onUpdate={updateMarkerColors} />
            )}
            {activeTab === "backup" && <BackupTab />}
            {activeTab === "storage" && <StorageTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
