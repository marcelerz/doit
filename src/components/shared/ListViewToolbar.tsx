"use client";

import { useRef, useState, useEffect } from "react";
import { FeatureSettings } from "@/types/settings";
import { TodoTemplate } from "@/types/todoTemplate";
import { SearchHistoryEntry, SearchHistoryId } from "@/types/types";
import { TodoFilters, GroupBy, SortField, SortDirection, ViewPreset } from "@/hooks/useListViewState";
import { SearchHistoryDropdown } from "@/components/shared/SearchHistory";
import { ExportFormat } from "@/utils/export";
import {
  FilterIcon,
  MoreVerticalIcon,
  DownloadIcon,
  TemplateIcon,
  ClipboardCheckIcon,
  DragDotsIcon,
  DocumentIcon,
  TableIcon,
  CodeIcon,
} from "@/components/shared/Icons";

export interface ListViewToolbarProps {
  // Filters state
  filters: TodoFilters;
  setFilters: React.Dispatch<React.SetStateAction<TodoFilters>>;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: boolean;

  // Sort/Group state
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  groupBy: GroupBy;
  setGroupBy: (group: GroupBy) => void;

  // View presets
  viewPresets: ViewPreset[];
  activePreset: string;
  onLoadPreset: (preset: ViewPreset) => void;
  onOpenSavePreset: () => void;

  // Search history
  searchHistory: SearchHistoryEntry[];
  addToSearchHistory: (query: string) => void;
  removeFromSearchHistory: (id: SearchHistoryId) => void;
  clearSearchHistory: () => void;

  // Feature flags
  features: FeatureSettings | undefined;
  templates: TodoTemplate[];
  todosCount: number;

  // Mode toggles
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  isDragMode: boolean;
  toggleDragMode: () => void;

  // Actions
  onShowTemplatesManager: () => void;
  onExport: (format: ExportFormat) => void;

  // Refs
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ListViewToolbar({
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  groupBy,
  setGroupBy,
  viewPresets,
  activePreset,
  onLoadPreset,
  onOpenSavePreset,
  searchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  features,
  templates,
  todosCount,
  isSelectionMode,
  toggleSelectionMode,
  isDragMode,
  toggleDragMode,
  onShowTemplatesManager,
  onExport,
  searchInputRef,
}: ListViewToolbarProps) {
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setIsExportMenuOpen(false);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* View Presets Row */}
      {viewPresets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Views:</span>
          {viewPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onLoadPreset(preset)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                activePreset === preset.name
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {preset.name}
            </button>
          ))}
          {activePreset === "custom" && hasActiveFilters && (
            <span className="px-3 py-1.5 rounded-lg font-medium text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Custom
            </span>
          )}
        </div>
      )}

      {/* Top Row: Search + Show Filters Toggle + Group By + Sort By + Save */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Search Input with History */}
        <div
          className="relative w-[140px] sm:w-[180px] lg:w-[250px] xl:w-[300px] flex-shrink-0"
          data-tutorial="search-bar"
        >
          <input
            ref={searchInputRef}
            data-testid="search-input"
            type="text"
            placeholder="Search... (/)"
            value={filters.searchText}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
            onFocus={() => {
              if (filters.searchText === "" && searchHistory.length > 0) {
                setShowSearchHistory(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on history items
              setTimeout(() => setShowSearchHistory(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filters.searchText.trim()) {
                addToSearchHistory(filters.searchText.trim());
                setShowSearchHistory(false);
              } else if (e.key === "Escape") {
                setShowSearchHistory(false);
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {/* Search History Dropdown */}
          <SearchHistoryDropdown
            history={searchHistory}
            onSelect={(query) => {
              setFilters((prev) => ({ ...prev, searchText: query }));
              addToSearchHistory(query);
              setShowSearchHistory(false);
            }}
            onRemove={removeFromSearchHistory}
            onClear={clearSearchHistory}
            isVisible={showSearchHistory && filters.searchText === ""}
          />
        </div>

        {/* Show Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg font-medium transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
            showFilters || hasActiveFilters
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          }`}
          title={showFilters ? "Hide filters" : "Show filters"}
          data-tutorial="filter-button"
        >
          <FilterIcon className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
              {Object.values(filters).filter((v) => v && (typeof v === "string" ? v : v.size > 0)).length}
            </span>
          )}
        </button>

        {/* Group By - hidden on small screens, shown in More menu */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0" data-tutorial="group-sort">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap hidden lg:inline">
            Group:
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-2 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            title="Group by"
          >
            <option value="none">No Group</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="project">Project</option>
            <option value="category">Category</option>
            <option value="assigned">Assigned</option>
            <option value="sprint">Sprint</option>
          </select>
        </div>

        {/* Sort By - hidden on small screens, shown in More menu */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap hidden lg:inline">
            Sort:
          </label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-2 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            title="Sort by"
          >
            <option value="manual">Manual</option>
            <option value="created">Created</option>
            <option value="dueDate">Due Date</option>
            <option value="duration">Duration</option>
            <option value="priority">Priority</option>
            <option value="assigned">Assigned</option>
            <option value="source">Source</option>
            <option value="mentioned">Mentioned</option>
            <option value="project">Project</option>
            <option value="timeSpent">Time Spent</option>
            <option value="title">Title</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className={`px-2 py-2 rounded-lg font-mono text-sm transition-all ${
              sortDirection === "desc"
                ? "bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? "abc" : "cba"}
          </button>
        </div>

        {/* Save View Button */}
        <button
          onClick={onOpenSavePreset}
          className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex-shrink-0"
          title="Save current view"
          data-tutorial="save-preset"
        >
          <DownloadIcon className="w-5 h-5" />
        </button>

        {/* Vertical Separator - hidden on medium screens */}
        <div className="hidden lg:block w-px h-6 bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />

        {/* Templates Button - hidden on medium screens */}
        {features?.templates && templates.length > 0 && (
          <button
            onClick={onShowTemplatesManager}
            className="hidden lg:flex p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
            title="Templates"
          >
            <TemplateIcon className="w-5 h-5" />
          </button>
        )}

        {/* Selection Mode Button - hidden on medium screens */}
        {features?.batchProcessing && (
          <button
            onClick={toggleSelectionMode}
            data-testid="selection-mode-button"
            className={`hidden lg:flex p-2 rounded-lg transition-colors flex-shrink-0 ${
              isSelectionMode
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
            title={isSelectionMode ? "Exit Selection Mode" : "Selection Mode"}
          >
            <ClipboardCheckIcon className="w-5 h-5" />
          </button>
        )}

        {/* Reorder Mode Button - hidden on medium screens */}
        {features?.reordering && (
          <button
            onClick={toggleDragMode}
            className={`hidden lg:flex p-2 rounded-lg transition-colors flex-shrink-0 ${
              isDragMode
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            }`}
            title={isDragMode ? "Exit Reorder Mode" : "Reorder Mode"}
          >
            <DragDotsIcon className="w-5 h-5" />
          </button>
        )}

        {/* Export Dropdown - hidden on medium screens */}
        {features?.exports && (
          <div ref={exportMenuRef} className="hidden lg:block relative flex-shrink-0">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isExportMenuOpen
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title="Export"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                <button
                  onClick={() => handleExport("markdown")}
                  className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <DocumentIcon className="w-4 h-4" />
                  Markdown (.md)
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <TableIcon className="w-4 h-4" />
                  CSV (.csv)
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <CodeIcon className="w-4 h-4" />
                  JSON (.json)
                </button>
                <div className="px-4 py-1 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-700 mt-1">
                  {hasActiveFilters ? "Exports filtered todos" : "Exports all todos"}
                </div>
              </div>
            )}
          </div>
        )}

        {/* More Options Menu - shown when extra toolbar options are hidden */}
        {todosCount > 0 && (
          <div ref={moreMenuRef} className="lg:hidden relative flex-shrink-0">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isMoreMenuOpen || isSelectionMode || isDragMode
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title="More options"
            >
              <MoreVerticalIcon className="w-5 h-5" />
            </button>

            {/* More Options Dropdown */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50">
                {/* Group By - shown on small screens only */}
                <div className="sm:hidden px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Group by</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="w-full px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">No Group</option>
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="project">Project</option>
                    <option value="category">Category</option>
                    <option value="assigned">Assigned</option>
                    <option value="sprint">Sprint</option>
                  </select>
                </div>

                {/* Sort By - shown on small screens only */}
                <div className="sm:hidden px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Sort by</label>
                  <div className="flex gap-1">
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="flex-1 px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Manual</option>
                      <option value="created">Created</option>
                      <option value="dueDate">Due Date</option>
                      <option value="duration">Duration</option>
                      <option value="priority">Priority</option>
                      <option value="assigned">Assigned</option>
                      <option value="source">Source</option>
                      <option value="mentioned">Mentioned</option>
                      <option value="project">Project</option>
                      <option value="timeSpent">Time Spent</option>
                      <option value="title">Title</option>
                    </select>
                    <button
                      onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                      className={`px-2 py-1.5 rounded font-mono text-sm transition-all ${
                        sortDirection === "desc"
                          ? "bg-amber-200 dark:bg-amber-600 text-amber-900 dark:text-amber-100"
                          : "bg-zinc-100 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300"
                      }`}
                      title={sortDirection === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortDirection === "asc" ? "abc" : "cba"}
                    </button>
                  </div>
                </div>

                {/* Templates - shown when toolbar button is hidden */}
                {features?.templates && templates.length > 0 && (
                  <button
                    onClick={() => {
                      onShowTemplatesManager();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <TemplateIcon className="w-4 h-4" />
                    Templates
                  </button>
                )}

                {/* Selection Mode - shown when toolbar button is hidden */}
                {features?.batchProcessing && (
                  <button
                    onClick={() => {
                      toggleSelectionMode();
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      isSelectionMode
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <ClipboardCheckIcon className="w-4 h-4" />
                    {isSelectionMode ? "Exit Selection Mode" : "Selection Mode"}
                  </button>
                )}

                {/* Drag Reorder - shown when toolbar button is hidden */}
                {features?.reordering && (
                  <button
                    onClick={() => {
                      toggleDragMode();
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      isDragMode
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <DragDotsIcon className="w-4 h-4" />
                    {isDragMode ? "Exit Reorder Mode" : "Reorder Mode"}
                  </button>
                )}

                {/* Divider before export options */}
                {features?.exports && (
                  <>
                    <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                    <div className="px-4 py-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">Export</div>
                    <button
                      onClick={() => handleExport("markdown")}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <DocumentIcon className="w-4 h-4" />
                      Markdown (.md)
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <TableIcon className="w-4 h-4" />
                      CSV (.csv)
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <CodeIcon className="w-4 h-4" />
                      JSON (.json)
                    </button>
                    <div className="px-4 py-1 text-xs text-zinc-400 dark:text-zinc-500">
                      {hasActiveFilters ? "Exports filtered todos" : "Exports all todos"}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
