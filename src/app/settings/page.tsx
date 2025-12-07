"use client";

import { useState } from "react";
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
import { SprintsTab } from "@/components/settings/SprintsTab";
import { AutoAssignTab } from "@/components/settings/AutoAssignTab";
import { BackupTab } from "@/components/settings/BackupTab";
import { StorageTab } from "@/components/settings/StorageTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { ImportTab } from "@/components/settings/ImportTab";

// Organized tab groups for sidebar navigation
const tabGroups = [
  {
    name: "General",
    tabs: [
      { key: "general", label: "General" },
      { key: "notifications", label: "Notifications" },
    ],
  },
  {
    name: "Time & Scheduling",
    tabs: [
      { key: "datetime", label: "Date/Time" },
      { key: "workhours", label: "Work Hours" },
    ],
  },
  {
    name: "Views",
    tabs: [
      { key: "gantt", label: "Gantt", feature: "ganttView" },
      { key: "kanban", label: "Kanban", feature: "kanbanView" },
      { key: "calendar", label: "Calendar", feature: "calendarView" },
      { key: "sprints", label: "Sprints", feature: "sprintsView" },
    ],
  },
  {
    name: "Organization",
    tabs: [
      { key: "categories", label: "Categories" },
      { key: "priorities", label: "Priorities" },
      { key: "autoassign", label: "Auto-Assign" },
    ],
  },
  {
    name: "Appearance",
    tabs: [
      { key: "markers", label: "Markers" },
      { key: "links", label: "Links" },
    ],
  },
  {
    name: "Data",
    tabs: [
      { key: "backup", label: "Backup" },
      { key: "import", label: "Import" },
      { key: "storage", label: "Storage" },
    ],
  },
] as const;

type Tab =
  | "general"
  | "datetime"
  | "workhours"
  | "gantt"
  | "kanban"
  | "sprints"
  | "calendar"
  | "categories"
  | "autoassign"
  | "notifications"
  | "priorities"
  | "links"
  | "markers"
  | "backup"
  | "import"
  | "storage";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    updateSprintSettings,
    updateCalendar,
    updateNotificationSettings,
    updateAutoAssignSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    updateFeatureSettings,
  } = useSettings();

  const { people, isLoaded: peopleLoaded } = usePeople();

  const { projects, isLoaded: projectsLoaded } = useProjects();

  const { importTodos: importTodosToStore, isLoaded: todosLoaded } = useTodos();

  const isLoaded = settingsLoaded && peopleLoaded && projectsLoaded && todosLoaded;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Check if a tab should be visible based on feature settings
  const isTabVisible = (tab: { key: string; feature?: string }) => {
    if (tab.feature && settings.features) {
      return settings.features[tab.feature as keyof typeof settings.features];
    }
    return true;
  };

  // Get current tab label for mobile header
  const getCurrentTabLabel = () => {
    for (const group of tabGroups) {
      for (const tab of group.tabs) {
        if (tab.key === activeTab) {
          return `${tab.label}`;
        }
      }
    }
    return "Settings";
  };

  const handleTabClick = (tabKey: Tab) => {
    setActiveTab(tabKey);
    setIsMobileSidebarOpen(false);
  };

  const renderSidebar = () => (
    <nav className="space-y-4">
      {tabGroups.map((group) => {
        const visibleTabs = group.tabs.filter(isTabVisible);
        if (visibleTabs.length === 0) return null;

        return (
          <div key={group.name}>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-3">
              {group.name}
            </div>
            <div className="space-y-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key as Tab)}
                  className={`w-full text-left pl-6 pr-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-medium">{getCurrentTabLabel()}</span>
          </button>
          <Link
            href="/"
            className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-zinc-900 shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Settings</h2>
            </div>
            <div className="p-4">{renderSidebar()}</div>
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 p-6">
          <div className="sticky top-6">
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Todos
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Settings</h1>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
              {renderSidebar()}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 lg:pl-0">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6">
            {(() => {
              switch (activeTab) {
                case "general":
                  return (
                    <GeneralTab
                      general={settings.general}
                      features={settings.features}
                      onUpdate={updateGeneralSettings}
                      onUpdateFeatures={updateFeatureSettings}
                    />
                  );
                case "datetime":
                  return <DateTimeTab dateTime={settings.dateTime} onUpdate={updateDateTimeSettings} />;
                case "workhours":
                  return <WorkHoursTab workHours={settings.workHours} onUpdate={updateWorkHoursSettings} />;
                case "gantt":
                  return <GanttTab gantt={settings.gantt} onUpdate={updateGantt} />;
                case "kanban":
                  return <KanbanTab kanban={settings.kanban} onUpdate={updateKanbanSettings} />;
                case "sprints":
                  return <SprintsTab sprints={settings.sprints} onUpdate={updateSprintSettings} />;
                case "calendar":
                  return <CalendarTab calendar={settings.calendar} onUpdate={updateCalendar} />;
                case "categories":
                  return (
                    <CategoriesTab
                      categories={settings.categories}
                      onAdd={addCategory}
                      onUpdate={updateCategory}
                      onDelete={deleteCategory}
                    />
                  );
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
        </main>
      </div>
    </div>
  );
}
