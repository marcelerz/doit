"use client";

import { useState, useEffect, useMemo } from "react";
import { Person } from "@/types/settings";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "@/storage/storage";
import { createPersonModels } from "@/models/PersonModel";

export function usePeople() {
  const [rawPeople, setRawPeople] = useState<Person[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Wrap raw people in PersonModel instances for consumers
  const people = useMemo(() => createPersonModels(rawPeople), [rawPeople]);

  // Load people from storage on mount
  useEffect(() => {
    loadFromStorage<Person[]>(STORAGE_KEYS.PEOPLE, []).then((loadedPeople) => {
      setRawPeople(loadedPeople);
      setIsLoaded(true);
    });
  }, []);

  // Save people to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.PEOPLE, rawPeople).catch((error) => {
        console.error("Failed to save people:", error);
      });
    }
  }, [rawPeople, isLoaded]);

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
    setRawPeople((prev) => [...prev, newPerson]);
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setRawPeople((prev) =>
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
    setRawPeople((prev) =>
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
    setRawPeople((prev) =>
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
    setRawPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const addPersonComment = (personId: string, content: string) => {
    const now = Date.now();
    setRawPeople((prev) =>
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
    setRawPeople((prev) =>
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
    setRawPeople((prev) =>
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
