import React from "react";
import { MarkerColors, LinkPattern, Person, Project, Priority } from "@/types/settings";

interface MarkedTextProps {
  text: string;
  completed?: boolean;
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  availablePeople?: Person[];
  availableProjects?: Project[];
  availablePriorities?: Priority[];
}

export function MarkedText({
  text,
  completed = false,
  markerColors,
  linkPatterns = [],
  availablePeople = [],
  availableProjects = [],
  availablePriorities = [],
}: MarkedTextProps) {
  // Parse the text and create elements with markers highlighted
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Helper function to convert hex color to Tailwind-style classes or inline styles
  const getColorStyle = (hexColor?: string) => {
    if (!hexColor) return {};
    return {
      backgroundColor: hexColor,
      color: "#333",
    };
  };

  // Helper to find person color by name or alternative
  const findPersonColor = (name: string): string | undefined => {
    const person = availablePeople.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() ||
        p.alternatives.some((alt) => alt.toLowerCase() === name.toLowerCase()),
    );
    return person?.color;
  };

  // Helper to find project color by name or alternative
  const findProjectColor = (name: string): string | undefined => {
    const project = availableProjects.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() ||
        p.alternatives.some((alt) => alt.toLowerCase() === name.toLowerCase()),
    );
    return project?.color;
  };

  // Helper to find priority color by name or alternative
  const findPriorityColor = (name: string): string | undefined => {
    const priority = availablePriorities.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() ||
        p.alternatives.some((alt) => alt.toLowerCase() === name.toLowerCase()),
    );
    return priority?.color;
  };

  // Define all marker patterns with their types
  const markerPatterns = [
    { regex: /@[\w-_]+/g, type: "assigned" as const },
    { regex: /#[\w-_]+/g, type: "project" as const },
    { regex: /\$[\w-_]+/g, type: "source" as const },
    { regex: /\^[\w-_]+/g, type: "mentioned" as const },
    { regex: /!![\w-_]+/g, type: "priority" as const },
    { regex: /~([^@#$^*~\n]+?)(?=\s+[@#$^*~!]|\s{2,}|\s+[^0-9:apmAPM,.]|$)/g, type: "dueDate" as const },
    { regex: /\*[\w-_]+/g, type: "duration" as const },
  ];

  // Find all matches across all patterns
  const allMatches: {
    start: number;
    end: number;
    text: string;
    type: keyof MarkerColors | "link";
    url?: string;
    color?: string;
    name?: string;
  }[] = [];

  markerPatterns.forEach(({ regex, type }) => {
    const matches = text.matchAll(regex);
    for (const match of matches) {
      if (match.index !== undefined) {
        // Extract the name without the marker symbol
        const markerSymbols: Record<string, string> = {
          assigned: "@",
          project: "#",
          source: "$",
          mentioned: "^",
          priority: "!!",
          dueDate: "~",
          duration: "*",
        };
        const symbol = markerSymbols[type] || "";

        // For dueDate with capturing group, match[0] is the full match including ~
        // For other patterns, match[0] is also the full match
        const fullText = match[0];
        const name = type === "dueDate" && match[1] ? match[1] : fullText.slice(symbol.length);

        allMatches.push({
          start: match.index,
          end: match.index + fullText.length,
          text: fullText,
          type,
          name,
        });
      }
    }
  });

  // Find link pattern matches
  linkPatterns.forEach((linkPattern) => {
    // Create regex for this link pattern: prefix followed by at least 4 digits
    // e.g., "T" becomes /T\d{4,}/g
    const linkRegex = new RegExp(`${linkPattern.prefix}\\d{4,}`, "gi");
    const matches = text.matchAll(linkRegex);

    for (const match of matches) {
      if (match.index !== undefined) {
        // Extract the ID part (everything after the prefix)
        const id = match[0].slice(linkPattern.prefix.length);
        // Replace {id} in the URL template with the actual ID
        const url = linkPattern.urlTemplate.replace("{id}", id);

        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: "link",
          url,
          color: linkPattern.color,
        });
      }
    }
  });

  // Sort matches by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Build the parts array
  allMatches.forEach((match, idx) => {
    // Add text before the marker
    if (match.start > lastIndex) {
      parts.push(text.slice(lastIndex, match.start));
    }

    // Handle link patterns
    if (match.type === "link" && match.url) {
      parts.push(
        <a
          key={`link-${idx}`}
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Opens in new tab"
          className="inline-block px-1.5 py-0.5 mx-0.5 text-sm rounded font-bold underline hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
          style={{
            color: match.color || "#3b82f6",
          }}
        >
          {match.text}
        </a>,
      );
    } else {
      // Add the marker as a badge with custom color
      let bgColor: string | undefined;

      // Use individual colors for people, projects, and priorities
      if (match.type === "assigned" || match.type === "source" || match.type === "mentioned") {
        bgColor = match.name ? findPersonColor(match.name) : undefined;
        // Fallback to marker color if person not found
        if (!bgColor) bgColor = markerColors?.[match.type];
      } else if (match.type === "project") {
        bgColor = match.name ? findProjectColor(match.name) : undefined;
        if (!bgColor) bgColor = markerColors?.[match.type];
      } else if (match.type === "priority") {
        bgColor = match.name ? findPriorityColor(match.name) : undefined;
        if (!bgColor) bgColor = markerColors?.[match.type];
      } else {
        // For dueDate and duration, use marker colors
        bgColor = markerColors?.[match.type as keyof MarkerColors];
      }

      parts.push(
        <span
          key={`marker-${idx}`}
          className="inline-block px-1.5 py-0.5 mx-0.5 text-sm rounded font-medium"
          style={getColorStyle(bgColor)}
        >
          {match.text}
        </span>,
      );
    }

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <span className={completed ? "line-through text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"}>
      {parts.length > 0 ? parts : text}
    </span>
  );
}
