"use client";

import { useState, useEffect } from "react";
import { Person } from "@/types/settings";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/utils/storage";

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load people from storage on mount
  useEffect(() => {
    const loadedPeople = loadFromStorage<Person[]>(STORAGE_KEYS.PEOPLE, []);
    setPeople(loadedPeople);
    setIsLoaded(true);
  }, []);

  // Save people to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.PEOPLE, people);
    }
  }, [people, isLoaded]);

  const addPerson = (person: Omit<Person, "id" | "comments" | "activity">) => {
    const now = Date.now();
    const newPerson: Person = {
      ...person,
      id: now.toString(),
      comments: [],
      activity: [
        {
          id: `${now}-created`,
          timestamp: now,
          type: "created",
          description: `Person created`,
        },
      ],
    };
    setPeople((prev) => [...prev, newPerson]);
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedPerson = { ...p, ...updates };
          // Add activity entry for edit with specific details
          if (
            updates.name !== undefined ||
            updates.alternatives !== undefined ||
            updates.color !== undefined ||
            updates.context !== undefined
          ) {
            const now = Date.now();
            const changes: string[] = [];
            if (updates.name !== undefined && updates.name !== p.name) {
              changes.push(`name from "${p.name}" to "${updates.name}"`);
            }
            if (
              updates.alternatives !== undefined &&
              JSON.stringify(updates.alternatives) !== JSON.stringify(p.alternatives)
            ) {
              const oldAlts = p.alternatives.length > 0 ? p.alternatives.join(", ") : "none";
              const newAlts = updates.alternatives.length > 0 ? updates.alternatives.join(", ") : "none";
              changes.push(`alternatives from ${oldAlts} to ${newAlts}`);
            }
            if (updates.color !== undefined && updates.color !== p.color) {
              changes.push(`color from ${p.color} to ${updates.color}`);
            }
            if (updates.context !== p.context) {
              if (updates.context && !p.context) {
                changes.push("context added");
              } else if (!updates.context && p.context) {
                changes.push("context removed");
              } else if (updates.context && p.context) {
                changes.push("context updated");
              }
            }

            if (changes.length > 0) {
              updatedPerson.activity = [
                ...(p.activity || []),
                {
                  id: `${now}-edited`,
                  timestamp: now,
                  type: "edited",
                  description: `Updated ${changes.join("; ")}`,
                },
              ];
            }
          }
          return updatedPerson;
        }
        return p;
      }),
    );
  };

  const archivePerson = (id: string) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const now = Date.now();
          return {
            ...p,
            archived: true,
            activity: [
              ...(p.activity || []),
              {
                id: `${now}-archived`,
                timestamp: now,
                type: "archived",
                description: `Person archived`,
              },
            ],
          };
        }
        return p;
      }),
    );
  };

  const unarchivePerson = (id: string) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const now = Date.now();
          return {
            ...p,
            archived: false,
            activity: [
              ...(p.activity || []),
              {
                id: `${now}-unarchived`,
                timestamp: now,
                type: "unarchived",
                description: `Person unarchived`,
              },
            ],
          };
        }
        return p;
      }),
    );
  };

  const deletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const addPersonComment = (personId: string, content: string) => {
    const now = Date.now();
    setPeople((prev) =>
      prev.map((person) => {
        if (person.id === personId) {
          const newComment = {
            commentId: now,
            history: [{ date: now, content }],
          };
          return {
            ...person,
            comments: [...person.comments, newComment],
          };
        }
        return person;
      }),
    );
  };

  const editPersonComment = (personId: string, commentId: number, content: string) => {
    const now = Date.now();
    setPeople((prev) =>
      prev.map((person) => {
        if (person.id === personId) {
          return {
            ...person,
            comments: person.comments.map((comment) =>
              comment.commentId === commentId
                ? { ...comment, history: [...comment.history, { date: now, content }] }
                : comment,
            ),
          };
        }
        return person;
      }),
    );
  };

  const deletePersonComment = (personId: string, commentId: number) => {
    setPeople((prev) =>
      prev.map((person) => {
        if (person.id === personId) {
          return {
            ...person,
            comments: person.comments.filter((c) => c.commentId !== commentId),
          };
        }
        return person;
      }),
    );
  };

  return {
    people,
    isLoaded,
    addPerson,
    updatePerson,
    deletePerson,
    archivePerson,
    unarchivePerson,
    addPersonComment,
    editPersonComment,
    deletePersonComment,
  };
}
