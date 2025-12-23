"use client";

import { FeatureSettings } from "@/types/settings";
import { SprintModel } from "@/hooks/useSprints";

export type ViewTab =
  | "list"
  | "kanban"
  | "gantt"
  | "calendar"
  | "people"
  | "projects"
  | "sprints"
  | "stats"
  | "timereports";

interface ViewTabConfig {
  id: ViewTab;
  label: string;
  icon: React.ReactNode;
  testId?: string;
  featureFlag?: keyof FeatureSettings;
  showIndicator?: boolean;
}

export interface ViewTabsProps {
  activeView: ViewTab;
  onViewChange: (view: ViewTab) => void;
  features: FeatureSettings | undefined;
  runningSprint: SprintModel | null | undefined;
  onOpenTutorial: (view: string) => void;
}

// Tutorial button component for views
function ViewTutorialButton({
  view,
  className = "",
  onOpenTutorial,
}: {
  view: string;
  className?: string;
  onOpenTutorial: (view: string) => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onOpenTutorial(view);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onOpenTutorial(view);
        }
      }}
      className={`p-0.5 rounded text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer ${className}`}
      title={`Learn about this view`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
        />
      </svg>
    </span>
  );
}

// Icons for each view
const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const KanbanIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
    />
  </svg>
);

const GanttIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h10M4 12h16M4 18h12" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PeopleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ProjectsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const SprintsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const StatsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const TimeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export function ViewTabs({ activeView, onViewChange, features, runningSprint, onOpenTutorial }: ViewTabsProps) {
  const getTabClassName = (isActive: boolean) =>
    `px-2 lg:px-3 py-2 font-medium transition-colors border-b-2 ${
      isActive
        ? "text-blue-600 dark:text-blue-400 border-blue-600"
        : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
    }`;

  const tabs: ViewTabConfig[] = [
    { id: "list", label: "List", icon: <ListIcon />, testId: "view-tab-list" },
    { id: "kanban", label: "Kanban", icon: <KanbanIcon />, testId: "view-tab-kanban", featureFlag: "kanbanView" },
    { id: "gantt", label: "Gantt", icon: <GanttIcon />, testId: "view-tab-gantt", featureFlag: "ganttView" },
    {
      id: "calendar",
      label: "Calendar",
      icon: <CalendarIcon />,
      testId: "view-tab-calendar",
      featureFlag: "calendarView",
    },
    { id: "people", label: "People", icon: <PeopleIcon />, testId: "view-tab-people" },
    { id: "projects", label: "Projects", icon: <ProjectsIcon />, testId: "view-tab-projects" },
    {
      id: "sprints",
      label: "Sprints",
      icon: <SprintsIcon />,
      featureFlag: "sprintsView",
      showIndicator: !!runningSprint,
    },
    { id: "stats", label: "Stats", icon: <StatsIcon />, featureFlag: "statsView" },
    { id: "timereports", label: "Time", icon: <TimeIcon />, featureFlag: "timeTracking" },
  ];

  return (
    <div className="mb-6 overflow-x-auto -mx-2 sm:-mx-0 px-2 sm:px-0" data-tutorial="view-tabs">
      <div className="flex gap-1 sm:gap-2 border-b border-zinc-200 dark:border-zinc-800 min-w-max">
        {tabs.map((tab) => {
          // Check if tab should be shown based on feature flag
          if (tab.featureFlag && !features?.[tab.featureFlag]) {
            return null;
          }

          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              data-testid={tab.testId}
              onClick={() => onViewChange(tab.id)}
              className={getTabClassName(isActive)}
              title={`${tab.label} view`}
            >
              <div className="flex items-center gap-1 lg:gap-2">
                {tab.icon}
                <span className="hidden lg:inline">{tab.label}</span>
                {isActive && <ViewTutorialButton view={tab.id} onOpenTutorial={onOpenTutorial} />}
                {tab.showIndicator && (
                  <span className="hidden lg:inline w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
