"use client";

import { useState } from "react";
import { AutoAssignSettings, defaultAutoAssignSettings } from "@/types/settings";
import { Priority } from "@/types/priority";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { InfoTooltip, tooltipContent } from "@/components/shared/InfoTooltip";

interface AutoAssignTabProps {
  autoAssign: AutoAssignSettings;
  people: PersonModel[];
  projects: ProjectModel[];
  priorities: Priority[];
  onUpdate: (settings: Partial<AutoAssignSettings>) => void;
}

export function AutoAssignTab({ autoAssign, people, projects, priorities, onUpdate }: AutoAssignTabProps) {
  // Dropdown state for each field
  const [showAssignedDropdown, setShowAssignedDropdown] = useState(false);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [prioritySearch, setPrioritySearch] = useState("");
  const [showDueDateDropdown, setShowDueDateDropdown] = useState(false);
  const [dueDateSearch, setDueDateSearch] = useState("");
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [durationSearch, setDurationSearch] = useState("");
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [recurringSearch, setRecurringSearch] = useState("");

  const getDurationSuggestions = (input: string): string[] => {
    const allSuggestions = [
      "15m",
      "30m",
      "45m",
      "1h",
      "1.5h",
      "2h",
      "3h",
      "4h",
      "5h",
      "6h",
      "7h",
      "10h",
      "1d",
      "2d",
      "3d",
      "5d",
      "1w",
      "2w",
      "3w",
      "1m",
      "2m",
      "3m",
    ];

    if (input.trim() === "") return allSuggestions;

    const lowerInput = input.toLowerCase();
    return allSuggestions.filter((s) => s.toLowerCase().includes(lowerInput));
  };

  const getDueDateSuggestions = (input: string): string[] => {
    const allSuggestions = [
      "today",
      "tomorrow",
      "next week",
      "next month",
      "next monday",
      "next tuesday",
      "next wednesday",
      "next thursday",
      "next friday",
      "next saturday",
      "next sunday",
      "in 2 days",
      "in 3 days",
      "in 5 days",
      "in 1 week",
      "in 2 weeks",
      "in 3 weeks",
      "in 1 month",
      "in 2 months",
      "in 3 months",
      "in 6 months",
    ];

    if (input.trim() === "") return allSuggestions;

    const lowerInput = input.toLowerCase();
    return allSuggestions.filter((s) => s.toLowerCase().includes(lowerInput));
  };

  const getRecurringSuggestions = (input: string): string[] => {
    const allSuggestions = [
      "daily (current time)",
      "weekly (current time)",
      "monthly (current time)",
      "yearly (current time)",
      "every day (BOD)",
      "every weekday (BOD)",
      "every week (BOD)",
      "every 2 weeks (BOD)",
      "every month (BOD)",
      "every year (BOD)",
      "every monday (BOD)",
      "every tuesday (BOD)",
      "every wednesday (BOD)",
      "every thursday (BOD)",
      "every friday (BOD)",
      "every saturday (BOD)",
      "every sunday (BOD)",
    ];

    if (input.trim() === "") return allSuggestions;

    const lowerInput = input.toLowerCase();
    return allSuggestions.filter((s) => s.toLowerCase().includes(lowerInput));
  };

  const handleAutoAssignFieldChange = (field: keyof AutoAssignSettings, value: string) => {
    if (field === "enabled") return; // Skip boolean field

    onUpdate({
      ...autoAssign,
      [field]: value || undefined, // Set to undefined if empty
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>Auto-Assign Metadata</span>
          <InfoTooltip content={tooltipContent.autoAssign} />
        </h2>
        <button
          onClick={() => onUpdate(defaultAutoAssignSettings)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Automatically assign default values to new todos when markers are not explicitly provided.
      </p>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-4">
          {/* Assigned Person */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Default Assigned Person{" "}
              <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">@</code>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.assignedPerson && (
                <button
                  onClick={() => handleAutoAssignFieldChange("assignedPerson", "")}
                  className="text-xs px-2 py-1 rounded border bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  @{autoAssign.assignedPerson} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowAssignedDropdown(!showAssignedDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.assignedPerson ? "Change" : "+"}
                </button>
                {showAssignedDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowAssignedDropdown(false);
                        setAssignedSearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={assignedSearch}
                        onChange={(e) => setAssignedSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setShowAssignedDropdown(false);
                            setAssignedSearch("");
                          }
                        }}
                        placeholder="Search people..."
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {people
                          .filter(
                            (p) => assignedSearch === "" || p.name.toLowerCase().includes(assignedSearch.toLowerCase()),
                          )
                          .slice(0, 10)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                handleAutoAssignFieldChange("assignedPerson", p.name);
                                setAssignedSearch("");
                                setShowAssignedDropdown(false);
                              }}
                              className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              @{p.name}
                            </button>
                          ))}
                        {people.filter(
                          (p) => assignedSearch === "" || p.name.toLowerCase().includes(assignedSearch.toLowerCase()),
                        ).length === 0 && (
                          <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                            No people found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Source Person */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Default Source Person <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">$</code>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.sourcePerson && (
                <button
                  onClick={() => handleAutoAssignFieldChange("sourcePerson", "")}
                  className="text-xs px-2 py-1 rounded border bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  ${autoAssign.sourcePerson} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.sourcePerson ? "Change" : "+"}
                </button>
                {showSourceDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowSourceDropdown(false);
                        setSourceSearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setShowSourceDropdown(false);
                            setSourceSearch("");
                          }
                        }}
                        placeholder="Search people..."
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {people
                          .filter(
                            (p) => sourceSearch === "" || p.name.toLowerCase().includes(sourceSearch.toLowerCase()),
                          )
                          .slice(0, 10)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                handleAutoAssignFieldChange("sourcePerson", p.name);
                                setSourceSearch("");
                                setShowSourceDropdown(false);
                              }}
                              className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              ${p.name}
                            </button>
                          ))}
                        {people.filter(
                          (p) => sourceSearch === "" || p.name.toLowerCase().includes(sourceSearch.toLowerCase()),
                        ).length === 0 && (
                          <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                            No people found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Default Project <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">%</code>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.project && (
                <button
                  onClick={() => handleAutoAssignFieldChange("project", "")}
                  className="text-xs px-2 py-1 rounded border bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  %{autoAssign.project} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.project ? "Change" : "+"}
                </button>
                {showProjectDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowProjectDropdown(false);
                        setProjectSearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setShowProjectDropdown(false);
                            setProjectSearch("");
                          }
                        }}
                        placeholder="Search projects..."
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {projects
                          .filter(
                            (p) => projectSearch === "" || p.name.toLowerCase().includes(projectSearch.toLowerCase()),
                          )
                          .slice(0, 10)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                handleAutoAssignFieldChange("project", p.name);
                                setProjectSearch("");
                                setShowProjectDropdown(false);
                              }}
                              className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              %{p.name}
                            </button>
                          ))}
                        {projects.filter(
                          (p) => projectSearch === "" || p.name.toLowerCase().includes(projectSearch.toLowerCase()),
                        ).length === 0 && (
                          <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                            No projects found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Default Priority <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">!!</code>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.priority && (
                <button
                  onClick={() => handleAutoAssignFieldChange("priority", "")}
                  className="text-xs px-2 py-1 rounded border bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  !!{autoAssign.priority} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.priority ? "Change" : "+"}
                </button>
                {showPriorityDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowPriorityDropdown(false);
                        setPrioritySearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={prioritySearch}
                        onChange={(e) => setPrioritySearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setShowPriorityDropdown(false);
                            setPrioritySearch("");
                          }
                        }}
                        placeholder="Search priorities..."
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {priorities
                          .sort((a, b) => a.order - b.order)
                          .filter(
                            (p) => prioritySearch === "" || p.name.toLowerCase().includes(prioritySearch.toLowerCase()),
                          )
                          .slice(0, 10)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                handleAutoAssignFieldChange("priority", p.name);
                                setPrioritySearch("");
                                setShowPriorityDropdown(false);
                              }}
                              className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              !!{p.name}
                            </button>
                          ))}
                        {priorities
                          .sort((a, b) => a.order - b.order)
                          .filter(
                            (p) => prioritySearch === "" || p.name.toLowerCase().includes(prioritySearch.toLowerCase()),
                          ).length === 0 && (
                          <div className="text-xs px-3 py-2 text-zinc-500 dark:text-zinc-400 italic">
                            No priorities found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Default Due Date</label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.dueDate && (
                <button
                  onClick={() => handleAutoAssignFieldChange("dueDate", "")}
                  className="text-xs px-2 py-1 rounded border bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                >
                  {autoAssign.dueDate} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowDueDateDropdown(!showDueDateDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.dueDate ? "Change" : "+"}
                </button>
                {showDueDateDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowDueDateDropdown(false);
                        setDueDateSearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={dueDateSearch}
                        onChange={(e) => setDueDateSearch(e.target.value)}
                        onKeyDown={(e) => {
                          const suggestions = getDueDateSuggestions(dueDateSearch);
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const valueToUse = suggestions.length > 0 ? suggestions[0] : dueDateSearch.trim();
                            if (valueToUse) {
                              handleAutoAssignFieldChange("dueDate", valueToUse);
                              setDueDateSearch("");
                              setShowDueDateDropdown(false);
                            }
                          } else if (e.key === "Escape") {
                            setShowDueDateDropdown(false);
                            setDueDateSearch("");
                          }
                        }}
                        placeholder="e.g., today, tomorrow, next week"
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {getDueDateSuggestions(dueDateSearch).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              handleAutoAssignFieldChange("dueDate", suggestion);
                              setDueDateSearch("");
                              setShowDueDateDropdown(false);
                            }}
                            className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Default Duration</label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.duration && (
                <button
                  onClick={() => handleAutoAssignFieldChange("duration", "")}
                  className="text-xs px-2 py-1 rounded border bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  {autoAssign.duration} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.duration ? "Change" : "+"}
                </button>
                {showDurationDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowDurationDropdown(false);
                        setDurationSearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={durationSearch}
                        onChange={(e) => setDurationSearch(e.target.value)}
                        onKeyDown={(e) => {
                          const suggestions = getDurationSuggestions(durationSearch);
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const valueToUse = suggestions.length > 0 ? suggestions[0] : durationSearch.trim();
                            if (valueToUse) {
                              handleAutoAssignFieldChange("duration", valueToUse);
                              setDurationSearch("");
                              setShowDurationDropdown(false);
                            }
                          } else if (e.key === "Escape") {
                            setShowDurationDropdown(false);
                            setDurationSearch("");
                          }
                        }}
                        placeholder="e.g., 2h, 30m, 1d"
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {getDurationSuggestions(durationSearch).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              handleAutoAssignFieldChange("duration", suggestion);
                              setDurationSearch("");
                              setShowDurationDropdown(false);
                            }}
                            className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Default Recurring</label>
            <div className="flex flex-wrap gap-1.5">
              {autoAssign.recurring && (
                <button
                  onClick={() => handleAutoAssignFieldChange("recurring", "")}
                  className="text-xs px-2 py-1 rounded border bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  {autoAssign.recurring} ✕
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowRecurringDropdown(!showRecurringDropdown)}
                  className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-bold"
                >
                  {autoAssign.recurring ? "Change" : "+"}
                </button>
                {showRecurringDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setShowRecurringDropdown(false);
                        setRecurringSearch("");
                      }}
                    />
                    <div className="absolute z-20 mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded shadow-lg">
                      <input
                        type="text"
                        value={recurringSearch}
                        onChange={(e) => setRecurringSearch(e.target.value)}
                        onKeyDown={(e) => {
                          const suggestions = getRecurringSuggestions(recurringSearch);
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const valueToUse = suggestions.length > 0 ? suggestions[0] : recurringSearch.trim();
                            if (valueToUse) {
                              handleAutoAssignFieldChange("recurring", valueToUse);
                              setRecurringSearch("");
                              setShowRecurringDropdown(false);
                            }
                          } else if (e.key === "Escape") {
                            setShowRecurringDropdown(false);
                            setRecurringSearch("");
                          }
                        }}
                        placeholder="e.g., daily, weekly, every monday"
                        autoFocus
                        className="w-full text-xs px-3 py-2 border-b border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {getRecurringSuggestions(recurringSearch).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              handleAutoAssignFieldChange("recurring", suggestion);
                              setRecurringSearch("");
                              setShowRecurringDropdown(false);
                            }}
                            className="w-full text-left text-xs px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">ℹ️ How it works</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          {[
            "Auto-assignment default values are applied only if markers are not provided",
            "Explicitly provided markers always override auto-assignment defaults",
            "Leave fields empty if you don't want automatic assignment for that metadata type",
          ].map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
