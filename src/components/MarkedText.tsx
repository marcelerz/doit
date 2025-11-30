import React from "react";
import { MarkerColors, LinkPattern } from "@/types/settings";

interface MarkedTextProps {
  text: string;
  completed?: boolean;
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
}

export function MarkedText({ text, completed = false, markerColors, linkPatterns = [] }: MarkedTextProps) {
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

  // Define all marker patterns with their types
  const markerPatterns = [
    { regex: /@[\w-_]+/g, type: "assigned" as const },
    { regex: /#[\w-_]+/g, type: "project" as const },
    { regex: /\$[\w-_]+/g, type: "source" as const },
    { regex: /\^[\w-_]+/g, type: "mentioned" as const },
    { regex: /!![\w-_]+/g, type: "priority" as const },
    { regex: /~[\w-_]+/g, type: "dueDate" as const },
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
  }[] = [];

  markerPatterns.forEach(({ regex, type }) => {
    const matches = text.matchAll(regex);
    for (const match of matches) {
      if (match.index !== undefined) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type,
        });
      }
    }
  });

  // Find link pattern matches
  linkPatterns.forEach((linkPattern) => {
    // Create regex for this link pattern: prefix followed by numbers
    // e.g., "T" becomes /T\d+/g
    const linkRegex = new RegExp(`${linkPattern.prefix}\\d+`, "gi");
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
      const bgColor = markerColors?.[match.type as keyof MarkerColors];
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
