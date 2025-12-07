"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { usePeople } from "@/hooks/usePeople";
import { useProjects } from "@/hooks/useProjects";
import { useTodos } from "@/hooks/useTodos";
import { PrioritiesTab } from "@/components/settings/PrioritiesTab";
import { LinksTab } from "@/components/settings/LinksTab";
import { MarkersTab } from "@/components/settings/MarkersTab";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { DateTimeTab } from "@/components/settings/DateTimeTab";
import { WorkHoursTab } from "@/components/settings/WorkHoursTab";
import { GanttTab } from "@/components/settings/GanttTab";
import { CalendarTab } from "@/components/settings/CalendarTab";
import { KanbanTab } from "@/components/settings/KanbanTab";
import { AutoAssignTab } from "@/components/settings/AutoAssignTab";
import { BackupTab } from "@/components/settings/BackupTab";
import { StorageTab } from "@/components/settings/StorageTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { ImportTab } from "@/components/settings/ImportTab";

const tabs = {
  General: "general",
  "Date/Time": "datetime",
  "Work Hours": "workhours",
  Gantt: "gantt",
  Kanban: "kanban",
  Calendar: "calendar",
  "Auto-Assign": "autoassign",
  Notifications: "notifications",
  Priorities: "priorities",
  Links: "links",
  Markers: "markers",
  Backup: "backup",
  Import: "import",
  Storage: "storage",
} as const;

type Tab = (typeof tabs)[keyof typeof tabs];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringHintRef = useRef(false);

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
    updateKanbanSettings,
    updateCalendar,
    updateNotificationSettings,
    updateAutoAssignSettings,
  } = useSettings();

  const { people, isLoaded: peopleLoaded } = usePeople();

  const { projects, isLoaded: projectsLoaded } = useProjects();

  const { importTodos: importTodosToStore, isLoaded: todosLoaded } = useTodos();

  const isLoaded = settingsLoaded && peopleLoaded && projectsLoaded && todosLoaded;

  // Check if scrolling is needed and which direction
  useEffect(() => {
    const checkScroll = () => {
      // Don't update hints while hovering
      if (isHoveringHintRef.current) return;

      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const hasOverflow = scrollWidth > clientWidth;

        setShowLeftHint(hasOverflow && scrollLeft > 0);
        setShowRightHint(hasOverflow && scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    // Use requestAnimationFrame to ensure DOM is painted
    const rafId = requestAnimationFrame(() => {
      checkScroll();
    });

    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      cancelAnimationFrame(rafId);
      container?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [isLoaded]); // Re-run when data is loaded

  const handleScrollHoverEnter = (direction: "left" | "right") => {
    isHoveringHintRef.current = true;
    if (scrollContainerRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft += direction === "right" ? 5 : -5;
        }
      }, 20);
    }
  };

  const handleScrollHoverLeave = () => {
    isHoveringHintRef.current = false;
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    // Check scroll position after hover ends
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      setShowLeftHint(hasOverflow && scrollLeft > 0);
      setShowRightHint(hasOverflow && scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  const buttons = Object.entries(tabs).map(([label]) => {
    const tabKey = label as keyof typeof tabs;
    return (
      <button
        key={label}
        onClick={() => setActiveTab(tabs[tabKey])}
        className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
          activeTab === tabs[tabKey]
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
            {(() => {
              switch (activeTab) {
                case "general":
                  return <GeneralTab general={settings.general} onUpdate={updateGeneralSettings} />;
                case "datetime":
                  return <DateTimeTab dateTime={settings.dateTime} onUpdate={updateDateTimeSettings} />;
                case "workhours":
                  return <WorkHoursTab workHours={settings.workHours} onUpdate={updateWorkHoursSettings} />;
                case "gantt":
                  return <GanttTab gantt={settings.gantt} onUpdate={updateGantt} />;
                case "kanban":
                  return <KanbanTab kanban={settings.kanban} onUpdate={updateKanbanSettings} />;
                case "calendar":
                  return <CalendarTab calendar={settings.calendar} onUpdate={updateCalendar} />;
                case "autoassign":
                  return (
                    <AutoAssignTab
                      autoAssign={settings.autoAssign}
                      people={people}
                      projects={projects}
                      priorities={settings.priorities}
                      onUpdate={updateAutoAssignSettings}
                    />
                  );
                case "notifications":
                  return (
                    <NotificationsTab notifications={settings.notifications} onUpdate={updateNotificationSettings} />
                  );
                case "priorities":
                  return (
                    <PrioritiesTab
                      priorities={settings.priorities}
                      onAdd={addPriority}
                      onUpdate={updatePriority}
                      onDelete={deletePriority}
                    />
                  );
                case "links":
                  return (
                    <LinksTab
                      linkPatterns={settings.linkPatterns}
                      onAdd={addLinkPattern}
                      onUpdate={updateLinkPattern}
                      onDelete={deleteLinkPattern}
                    />
                  );
                case "markers":
                  return <MarkersTab markerColors={settings.markerColors} onUpdate={updateMarkerColors} />;
                case "backup":
                  return <BackupTab />;
                case "import":
                  return <ImportTab onImport={importTodosToStore} existingProjects={projects.map((p) => p.name)} />;
                case "storage":
                  return <StorageTab />;
                default: {
                  // Exhaustiveness check
                  const _exhaustiveCheck: never = activeTab;
                  return _exhaustiveCheck;
                }
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
