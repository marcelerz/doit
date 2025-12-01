"use client";

import { useState } from "react";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { PeopleTab } from "@/components/settings/PeopleTab";
import { ProjectsTab } from "@/components/settings/ProjectsTab";
import { PrioritiesTab } from "@/components/settings/PrioritiesTab";
import { LinksTab } from "@/components/settings/LinksTab";
import { MarkersTab } from "@/components/settings/MarkersTab";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { DateTimeTab } from "@/components/settings/DateTimeTab";
import { WorkHoursTab } from "@/components/settings/WorkHoursTab";
import { BackupTab } from "@/components/settings/BackupTab";

type Tab = "general" | "datetime" | "workhours" | "people" | "projects" | "priorities" | "links" | "markers" | "backup";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const {
    settings,
    isLoaded,
    addPerson,
    updatePerson,
    deletePerson,
    addProject,
    updateProject,
    deleteProject,
    addPriority,
    updatePriority,
    deletePriority,
    addLinkPattern,
    updateLinkPattern,
    deleteLinkPattern,
    updateMarkerColors,
    updateGeneralSettings,
  } = useSettings();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

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
            Configure general settings, date/time, people, projects, priorities, link patterns, and marker colors for
            your todo app
          </p>
        </header>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "general"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("datetime")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "datetime"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Date/Time
            </button>
            <button
              onClick={() => setActiveTab("workhours")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "workhours"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Work Hours
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "people"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              People
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "projects"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("priorities")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "priorities"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Priorities
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "links"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Links
            </button>
            <button
              onClick={() => setActiveTab("markers")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "markers"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Markers
            </button>
            <button
              onClick={() => setActiveTab("backup")}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === "backup"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              Backup
            </button>
          </div>

          <div className="p-6">
            {activeTab === "general" && <GeneralTab general={settings.general} onUpdate={updateGeneralSettings} />}
            {activeTab === "datetime" && (
              <DateTimeTab
                dateTime={settings.general.dateTime}
                onUpdate={(dateTime) => updateGeneralSettings({ dateTime })}
              />
            )}
            {activeTab === "workhours" && (
              <WorkHoursTab
                workHours={settings.general.workHours}
                onUpdate={(workHours) => updateGeneralSettings({ workHours })}
              />
            )}
            {activeTab === "people" && (
              <PeopleTab people={settings.people} onAdd={addPerson} onUpdate={updatePerson} onDelete={deletePerson} />
            )}
            {activeTab === "projects" && (
              <ProjectsTab
                projects={settings.projects}
                onAdd={addProject}
                onUpdate={updateProject}
                onDelete={deleteProject}
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
          </div>
        </div>
      </div>
    </div>
  );
}
