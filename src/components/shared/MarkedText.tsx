import React from "react";
import { escapeRegex } from "@/utils/linkPatternUtils";
import { sanitizeUrl, sanitizeCssColor } from "@/utils/sanitize";
import { MarkerColors } from "@/types/markerColors";
import { LinkPattern } from "@/types/linkPattern";
import { Priority } from "@/types/priority";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";
import { DateTimeSettings, WorkHoursSettings } from "@/types/settings";
import {
  detectMentionedPeople,
  detectMentionedProjects,
  detectSourcePeople,
  detectPriorities,
  detectDatesInText,
  detectDurationPatterns,
} from "@/utils/autoDetection";

interface MarkedTextProps {
  text: string;
  completed?: boolean;
  markerColors?: MarkerColors;
  linkPatterns?: LinkPattern[];
  availablePeople?: PersonModel[];
  availableProjects?: ProjectModel[];
  availablePriorities?: Priority[];
  dateTimeSettings?: DateTimeSettings;
  workHoursSettings?: WorkHoursSettings;
}

export function MarkedText({
  text,
  completed = false,
  markerColors,
  linkPatterns = [],
  availablePeople = [],
  availableProjects = [],
  availablePriorities = [],
  dateTimeSettings,
  workHoursSettings,
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

  // Define all marker patterns with their types (removed dueDate, duration, recurring, dependency)
  // Match SmartInput patterns: use lookahead (?=\s|$) to match only if followed by space or end
  // For people (@, $), projects (%), and priorities (!!), match known names only
  // For tags (#), match any non-whitespace, non-marker characters
  const markerPatterns: { regex: RegExp; type: keyof MarkerColors }[] = [];

  // Build patterns for people markers (@ and $) - match known names only
  const peopleMarkers = [
    { type: "assigned" as const, symbol: "@" },
    { type: "source" as const, symbol: "$" },
  ];

  for (const { type, symbol } of peopleMarkers) {
    const allNames = availablePeople.flatMap((p) => [p.name, ...p.alternatives]);
    if (allNames.length > 0) {
      const sortedNames = allNames.sort((a, b) => b.length - a.length);
      const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const namesPattern = sortedNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const regex = new RegExp(`${escapedSymbol}(${namesPattern})(?=\\s|$)`, "gi");
      markerPatterns.push({ regex, type });
    }
  }

  // Build pattern for project marker (%) - match known projects only
  const allProjects = availableProjects.flatMap((p) => [p.name, ...p.alternatives]);
  if (allProjects.length > 0) {
    const sortedProjects = allProjects.sort((a, b) => b.length - a.length);
    const namesPattern = sortedProjects.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(`%(${namesPattern})(?=\\s|$)`, "gi");
    markerPatterns.push({ regex, type: "project" as const });
  }

  // Build pattern for priority marker (!!) - match known priorities only
  const allPriorities = availablePriorities.flatMap((p) => [p.name, ...p.alternatives]);
  if (allPriorities.length > 0) {
    const sortedPriorities = allPriorities.sort((a, b) => b.length - a.length);
    const namesPattern = sortedPriorities.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(`!!(${namesPattern})(?=\\s|$)`, "gi");
    markerPatterns.push({ regex, type: "priority" as const });
  }

  // Build pattern for tag marker (#) - freeform text (same as SmartInput)
  // Match any characters except whitespace and marker symbols, followed by space or end
  const tagPattern = new RegExp(`#([^\\s@%$!#>&]+?)(?=\\s|$)`, "gi");
  markerPatterns.push({ regex: tagPattern, type: "tag" as const });

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
          project: "%",
          source: "$",
          priority: "!!",
          tag: "#",
        };
        const symbol = markerSymbols[type] || "";

        // Extract name without marker symbol
        const fullText = match[0];
        const name = fullText.slice(symbol.length);

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
    // The prefix is user-entered and must be escaped, as the three sibling
    // patterns in this file already are. A prefix of "[" throws
    // SyntaxError: Unterminated character class while rendering every todo,
    // and a nested quantifier gives catastrophic backtracking. The form field
    // has a pattern= guard, but imported settings bypass it entirely.
    const linkRegex = new RegExp(`${escapeRegex(linkPattern.prefix)}\\d{4,}`, "gi");
    const matches = text.matchAll(linkRegex);

    for (const match of matches) {
      if (match.index !== undefined) {
        // Extract the ID part (everything after the prefix)
        const id = match[0].slice(linkPattern.prefix.length);
        // Replace {id} in the URL template with the actual ID. The template is
        // user-entered and reaches an href below, so a `javascript:` scheme has
        // to be rejected here rather than relied on React to block.
        const url = sanitizeUrl(linkPattern.urlTemplate.replace("{id}", id));
        if (url === null) continue;

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

  // Auto-detect source people BEFORE mentioned people, matching the order in
  // SmartInput. Source is the more specific match (it needs a context word), and
  // if the two disagree the rendered chip contradicts the stored metadata.
  const detectedSourcePeople = detectSourcePeople(text, availablePeople);
  const explicitSourceRanges = allMatches
    .filter((m) => m.type === "source")
    .map((m) => ({ start: m.start, end: m.end }));

  for (const detected of detectedSourcePeople) {
    // Skip if this position overlaps with an explicit $ marker
    const overlapsExplicit = explicitSourceRanges.some(
      (range) => !(detected.end <= range.start || detected.start >= range.end),
    );

    if (overlapsExplicit) {
      continue;
    }

    // Skip if this position overlaps with any existing match
    const overlapsOther = allMatches.some((m) => !(detected.end <= m.start || detected.start >= m.end));

    if (overlapsOther) {
      continue;
    }

    // Add as source
    allMatches.push({
      start: detected.start,
      end: detected.end,
      text: detected.text,
      type: "source",
      name: detected.personName,
    });
  }

  // Auto-detect mentioned people (skip areas covered by @ or $ markers)
  const detectedPeople = detectMentionedPeople(text, availablePeople);
  const explicitPeopleRanges = allMatches
    .filter((m) => m.type === "assigned" || m.type === "source")
    .map((m) => ({ start: m.start, end: m.end }));

  for (const detected of detectedPeople) {
    // Skip if this position overlaps with an explicit @ or $ marker
    const overlapsExplicit = explicitPeopleRanges.some(
      (range) => !(detected.end <= range.start || detected.start >= range.end),
    );

    if (overlapsExplicit) {
      continue;
    }

    // Skip if this position overlaps with any existing match (dates, tags, etc. take precedence)
    const overlapsOther = allMatches.some((m) => !(detected.end <= m.start || detected.start >= m.end));

    if (overlapsOther) {
      continue;
    }

    // Add as mentioned person
    allMatches.push({
      start: detected.start,
      end: detected.end,
      text: detected.text,
      type: "mentioned",
      name: detected.personName,
    });
  }

  // Auto-detect mentioned projects (skip areas covered by % markers)
  const detectedProjects = detectMentionedProjects(text, availableProjects);
  const explicitProjectRanges = allMatches
    .filter((m) => m.type === "project")
    .map((m) => ({ start: m.start, end: m.end }));

  for (const detected of detectedProjects) {
    // Skip if this position overlaps with an explicit % marker
    const overlapsExplicit = explicitProjectRanges.some(
      (range) => !(detected.end <= range.start || detected.start >= range.end),
    );

    if (overlapsExplicit) {
      continue;
    }

    // Skip if this position overlaps with any existing match (dates, tags, people, etc. take precedence)
    const overlapsOther = allMatches.some((m) => !(detected.end <= m.start || detected.start >= m.end));

    if (overlapsOther) {
      continue;
    }

    // Add as project
    allMatches.push({
      start: detected.start,
      end: detected.end,
      text: detected.text,
      type: "project",
      name: detected.projectName,
    });
  }

  // Auto-detect priorities (skip areas covered by !! markers)
  const detectedPriorities = detectPriorities(text, availablePriorities);
  const explicitPriorityRanges = allMatches
    .filter((m) => m.type === "priority")
    .map((m) => ({ start: m.start, end: m.end }));

  for (const detected of detectedPriorities) {
    // Skip if this position overlaps with an explicit !! marker
    const overlapsExplicit = explicitPriorityRanges.some(
      (range) => !(detected.end <= range.start || detected.start >= range.end),
    );

    if (overlapsExplicit) {
      continue;
    }

    // Skip if this position overlaps with any existing match
    const overlapsOther = allMatches.some((m) => !(detected.end <= m.start || detected.start >= m.end));

    if (overlapsOther) {
      continue;
    }

    // Add as priority
    allMatches.push({
      start: detected.start,
      end: detected.end,
      text: detected.text,
      type: "priority",
      name: detected.priorityName,
    });
  }

  // Auto-detect dates (if settings are provided)
  const detectedDates = detectDatesInText(text, new Date(), dateTimeSettings, workHoursSettings);
  for (const detected of detectedDates) {
    // Skip if this position overlaps with any existing match
    const overlapsOther = allMatches.some((m) => !(detected.end <= m.start || detected.start >= m.end));

    if (overlapsOther) {
      continue;
    }

    // Add as dueDate
    allMatches.push({
      start: detected.start,
      end: detected.end,
      text: detected.text,
      type: "dueDate",
    });
  }

  // Auto-detect durations
  const detectedDurations = detectDurationPatterns(text);
  for (const detected of detectedDurations) {
    // Skip if this position overlaps with any existing match
    const overlapsOther = allMatches.some((m) => !(detected.end <= m.start || detected.start >= m.end));

    if (overlapsOther) {
      continue;
    }

    // Add as duration
    allMatches.push({
      start: detected.start,
      end: detected.end,
      text: detected.text,
      type: "duration",
    });
  }

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
            color: sanitizeCssColor(match.color) ?? "#3b82f6",
          }}
        >
          {match.text}
        </a>,
      );
    } else {
      // Add the marker as a badge with custom color
      let bgColor: string | undefined;
      const displayText = match.text;

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
      } else if (match.type === "dueDate") {
        bgColor = markerColors?.dueDate;
      } else if (match.type === "duration") {
        bgColor = markerColors?.duration;
      } else {
        // Use marker color for other types
        bgColor = markerColors?.[match.type as keyof MarkerColors];
      }

      parts.push(
        <span
          key={`marker-${idx}`}
          className="inline-block px-1.5 py-0.5 mx-0.5 text-sm rounded font-medium"
          style={getColorStyle(bgColor)}
        >
          {displayText}
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
