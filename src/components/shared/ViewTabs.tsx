"use client";

import { FeatureSettings } from "@/types/settings";
import { SprintModel } from "@/hooks/useSprints";
import {
  ListIcon as ListIconComponent,
  KanbanIcon as KanbanIconComponent,
  CalendarIcon,
  LightningIcon,
  ClockIcon,
  GanttIcon as GanttIconComponent,
  UsersIcon,
  FolderIcon,
  ChartBarIcon,
  AcademicCapIcon,
  DocumentIcon,
} from "@/components/shared/Icons";

export type ViewTab =
  | "list"
  | "kanban"
  | "gantt"
  | "calendar"
  | "notes"
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
      <AcademicCapIcon className="w-3.5 h-3.5" />
    </span>
  );
}

// Icons for each view
const ListIcon = () => <ListIconComponent className="w-5 h-5" />;

const KanbanIcon = () => <KanbanIconComponent className="w-5 h-5" />;

const GanttIcon = () => <GanttIconComponent className="w-5 h-5" />;

const CalendarViewIcon = () => <CalendarIcon className="w-5 h-5" />;

const NotesIcon = () => <DocumentIcon className="w-5 h-5" />;

const PeopleIcon = () => <UsersIcon className="w-5 h-5" />;

const ProjectsIcon = () => <FolderIcon className="w-5 h-5" />;

const SprintsIcon = () => <LightningIcon className="w-5 h-5" />;

const StatsIcon = () => <ChartBarIcon className="w-5 h-5" />;

const TimeIcon = () => <ClockIcon className="w-5 h-5" />;

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
      icon: <CalendarViewIcon />,
      testId: "view-tab-calendar",
      featureFlag: "calendarView",
    },
    {
      id: "notes",
      label: "Notes",
      icon: <NotesIcon />,
      testId: "view-tab-notes",
      featureFlag: "notesView",
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
