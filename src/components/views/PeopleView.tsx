"use client";

import React, { useMemo, useRef } from "react";
import { PersonItem } from "@/components/items/PersonItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { PersonModel } from "@/models/PersonModel";

interface PeopleViewProps {
  people: PersonModel[];
  taskCountsByPerson: Map<string, number>;
  search: string;
  onSearchChange: (value: string) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  onOpenPerson: (personId: string) => void;
  onDeletePerson: (id: string) => void;
  onArchivePerson: (id: string) => void;
  onUnarchivePerson: (id: string) => void;
  onRequestDeleteConfirm: (id: string, name: string) => void;
  onAddPerson: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function PeopleView({
  people,
  taskCountsByPerson,
  search,
  onSearchChange,
  showArchived,
  onShowArchivedChange,
  onOpenPerson,
  onDeletePerson,
  onArchivePerson,
  onUnarchivePerson,
  onRequestDeleteConfirm,
  onAddPerson,
  searchInputRef,
}: PeopleViewProps) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  // Filter people based on search and archive filter
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      // Filter by archived status
      if (!showArchived && person.isArchived) return false;
      // Filter by search term
      if (search.trim()) {
        return person.matchesSearch(search);
      }
      return true;
    });
  }, [people, search, showArchived]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">People</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {filteredPeople.length} of {people.length} {people.length === 1 ? "person" : "people"}
          </p>
        </div>
        <button
          onClick={onAddPerson}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          data-tutorial="add-person-button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Person
        </button>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search people... (press / to focus)"
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          Show archived
        </label>
      </div>

      {people.length === 0 ? (
        <EmptyState emoji="👥" title="No People" message="No people yet. Add one to get started!" />
      ) : filteredPeople.length === 0 ? (
        <EmptyState emoji="🔍" title="No Results" message="No people match your search." />
      ) : (
        <ul className="space-y-2">
          {filteredPeople.map((person) => (
            <li key={person.id}>
              <PersonItem
                person={person}
                onClick={() => onOpenPerson(person.id)}
                onDelete={onDeletePerson}
                onArchive={onArchivePerson}
                onUnarchive={onUnarchivePerson}
                onRequestDeleteConfirm={onRequestDeleteConfirm}
                taskCount={taskCountsByPerson.get(person.id) || 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
