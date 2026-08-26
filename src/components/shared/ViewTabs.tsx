"use client";

import { FeatureSettings } from "@/types/settings";
import { ViewTab, getEnabledViews } from "@/types/viewRegistry";
import { SprintModel } from "@/models/SprintModel";
import {
  TodoListIcon as TodoListIconComponent,
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
  ClipboardDocumentCheckIcon,
} from "@/components/shared/Icons";


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
const TodosIcon = () => <TodoListIconComponent className="w-5 h-5" />;

const KanbanIcon = () => <KanbanIconComponent className="w-5 h-5" />;

const GanttIcon = () => <GanttIconComponent className="w-5 h-5" />;

const CalendarViewIcon = () => <CalendarIcon className="w-5 h-5" />;

const NotesIcon = () => <DocumentIcon className="w-5 h-5" />;

const ReviewsIcon = () => <ClipboardDocumentCheckIcon className="w-5 h-5" />;

const PeopleIcon = () => <UsersIcon className="w-5 h-5" />;

const ProjectsIcon = () => <FolderIcon className="w-5 h-5" />;

const SprintsIcon = () => <LightningIcon className="w-5 h-5" />;

const StatsIcon = () => <ChartBarIcon className="w-5 h-5" />;

const TimeIcon = () => <ClockIcon className="w-5 h-5" />;

/** Icons live here because this is the only place that renders them. */
const VIEW_ICONS: Record<ViewTab, React.ReactNode> = {
  list: <TodosIcon />,
  kanban: <KanbanIcon />,
  gantt: <GanttIcon />,
  calendar: <CalendarViewIcon />,
  notes: <NotesIcon />,
  people: <PeopleIcon />,
  projects: <ProjectsIcon />,
  sprints: <SprintsIcon />,
  reviews: <ReviewsIcon />,
  stats: <StatsIcon />,
  timereports: <TimeIcon />,
};

export function ViewTabs({ activeView, onViewChange, features, runningSprint, onOpenTutorial }: ViewTabsProps) {
  const getTabClassName = (isActive: boolean) =>
    `px-2 lg:px-3 py-2 font-medium transition-colors border-b-2 ${
      isActive
        ? "text-blue-600 dark:text-blue-400 border-blue-600"
        : "text-zinc-600 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-zinc-100"
    }`;

  const tabs = getEnabledViews(features);

  return (
    <div className="mb-6 overflow-x-auto -mx-2 sm:-mx-0 px-2 sm:px-0" data-tutorial="view-tabs">
      <div
        role="tablist"
        aria-label="Views"
        className="flex gap-1 sm:gap-2 border-b border-zinc-200 dark:border-zinc-800 min-w-max"
      >
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              data-testid={tab.testId}
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(tab.id)}
              className={getTabClassName(isActive)}
              title={`${tab.label} view`}
            >
              <div className="flex items-center gap-1 lg:gap-2">
                {VIEW_ICONS[tab.id]}
                {/* Labels used to appear only at lg, so every tablet and phone
                    got a row of unlabelled icons with no way to tell List from
                    Kanban from Notes -- title= never fires on touch. They now
                    show at every width, smaller below lg; the bar already
                    scrolls horizontally, so the ones that no longer fit are
                    reached the same way they were before. */}
                <span className="max-lg:text-xs">{tab.label}</span>
                {isActive && <ViewTutorialButton view={tab.id} onOpenTutorial={onOpenTutorial} />}
                {tab.id === "sprints" && runningSprint && (
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
