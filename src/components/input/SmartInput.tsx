import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Person, Project, Priority, DateTimeSettings, WorkHoursSettings } from "@/types/settings";
import {
  detectDatesInText,
  detectedDateToISO,
  detectMentionedPeople,
  detectMentionedProjects,
  detectSourcePeople,
  detectPriorities,
  detectDurationPatterns,
} from "@/utils/autoDetection";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

export interface TokenMatch {
  type: string;
  value: string; // parsed value, e.g. "marcel" (not "@marcel")
  raw: string; // raw matched string, e.g. "@marcel"
  start: number;
  end: number;
  // For auto-detected dates (without ~)
  isAutoDetected?: boolean;
  detectedDateIndex?: number; // Which detected date is active (0-based)
  allDetectedDates?: string[]; // All ISO dates found at this location
  autoDetectedType?: "simple" | "range" | "recurring"; // What kind of auto-detection: simple date, date range, or recurring pattern
}

export interface SmartEditableInputProps {
  markerColors?: Record<string, string>; // e.g. { assigned: "#cce5ff", project: "#e2ccff" }
  onTokensChange?: (tokens: TokenMatch[], rawText: string, plainText: string) => void;
  placeholder?: string;
  onEnterPress?: () => void;
  availablePeople?: PersonModel[]; // List of valid people with alternatives
  availableProjects?: ProjectModel[]; // List of valid projects with alternatives
  availablePriorities?: Priority[]; // List of valid priorities with alternatives
  onAddPerson?: (name: string) => void; // Callback to add a new person
  onAddProject?: (name: string) => void; // Callback to add a new project
  onAddPriority?: (name: string) => void; // Callback to add a new priority
  dateTimeSettings?: DateTimeSettings; // Settings for parsing shorthand dates
  workHoursSettings?: WorkHoursSettings; // Work hours for computing BOD/EOD
}

export interface SmartEditableInputHandle {
  clear: () => void;
  setValue: (text: string) => void;
  focus: () => void;
}

const SmartEditableInput = forwardRef<SmartEditableInputHandle, SmartEditableInputProps>(
  (
    {
      markerColors = {},
      onTokensChange,
      placeholder,
      onEnterPress,
      availablePeople = [],
      availableProjects = [],
      availablePriorities = [],
      onAddPerson,
      onAddProject,
      onAddPriority,
      dateTimeSettings,
      workHoursSettings,
    },
    ref,
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);
    // Track which detected date is active at each position (key is "start-end", value is index)
    const [activeDateIndices, setActiveDateIndices] = useState<Record<string, number>>({});
    const [autocomplete, setAutocomplete] = useState<{
      show: boolean;
      options: string[];
      selected: number;
      type: string;
      marker: string;
      searchText: string;
      showAddNew: boolean;
      position: { top: number; left: number };
    }>({
      show: false,
      options: [],
      selected: 0,
      type: "",
      marker: "",
      searchText: "",
      showAddNew: false,
      position: { top: 0, left: 0 },
    });

    // Close autocomplete when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Check if click is outside the component
        if (editableRef.current && !editableRef.current.contains(target) && !target.closest(".autocomplete-dropdown")) {
          setAutocomplete((prev) => ({ ...prev, show: false }));
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          if (editableRef.current) {
            editableRef.current.innerHTML = "";
            if (onTokensChange) {
              onTokensChange([], "", "");
            }
          }
        },
        setValue: (text: string) => {
          if (editableRef.current) {
            const { fragment, tokens, plainText } = renderTokensFromText(text);
            editableRef.current.innerHTML = "";
            editableRef.current.appendChild(fragment);
            if (onTokensChange) {
              onTokensChange(tokens, text, plainText);
            }
          }
        },
        focus: () => {
          if (editableRef.current) {
            editableRef.current.focus();
          }
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [availablePeople, availableProjects, availablePriorities, dateTimeSettings, workHoursSettings, activeDateIndices],
    );

    // Re-render content ONLY when activeDateIndices change (for date deactivation)
    // We don't need to re-render for people/projects/priorities changes since they're handled during input
    useEffect(() => {
      if (editableRef.current && editableRef.current.textContent) {
        const currentText = editableRef.current.textContent;
        const { fragment, tokens, plainText } = renderTokensFromText(currentText);
        editableRef.current.innerHTML = "";
        editableRef.current.appendChild(fragment);
        if (onTokensChange) {
          onTokensChange(tokens, currentText, plainText);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDateIndices]);
    const buildTokenRegex = (): { type: string; symbol: string; regex: RegExp }[] => {
      const patterns: { type: string; symbol: string; regex: RegExp }[] = [];

      // Build patterns for people markers (@ and $, but NOT ^)
      const peopleMarkers = [
        { type: "assigned", symbol: "@" },
        { type: "source", symbol: "$" },
      ];

      for (const { type, symbol } of peopleMarkers) {
        // Create a pattern that matches the symbol followed by any known person name or alternative
        const allNames = availablePeople.flatMap((p) => [p.name, ...p.alternatives]);
        if (allNames.length > 0) {
          // Sort by length (longest first) to match longer names before shorter ones
          const sortedNames = allNames.sort((a, b) => b.length - a.length);
          const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Escape special regex characters in names and join with |
          const namesPattern = sortedNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
          const regex = new RegExp(`${escapedSymbol}(${namesPattern})(?=\\s|$)`, "gi");
          patterns.push({ type, symbol, regex });
        }
      }

      // Build pattern for project marker (%)
      const allProjects = availableProjects.flatMap((p) => [p.name, ...p.alternatives]);
      if (allProjects.length > 0) {
        const sortedProjects = allProjects.sort((a, b) => b.length - a.length);
        const namesPattern = sortedProjects.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const regex = new RegExp(`%(${namesPattern})(?=\\s|$)`, "gi");
        patterns.push({ type: "project", symbol: "%", regex });
      }

      // Build pattern for priority marker (!!)
      const allPriorities = availablePriorities.flatMap((p) => [p.name, ...p.alternatives]);
      if (allPriorities.length > 0) {
        const sortedPriorities = allPriorities.sort((a, b) => b.length - a.length);
        const namesPattern = sortedPriorities.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const regex = new RegExp(`!!(${namesPattern})(?=\\s|$)`, "gi");
        patterns.push({ type: "priority", symbol: "!!", regex });
      }

      // Build pattern for tag marker (#) - freeform text
      const tagPattern = `#([^\\s@%$!#>&]+?)(?=\\s|$)`;
      patterns.push({
        type: "tag",
        symbol: "#",
        regex: new RegExp(tagPattern, "gi"),
      });

      return patterns;
    };

    // Helper to find person/project/priority by name or alternative
    const findPersonByNameOrAlternative = (input: string): Person | undefined => {
      const lowerInput = input.toLowerCase();
      return availablePeople.find(
        (p) => p.name.toLowerCase() === lowerInput || p.alternatives.some((alt) => alt.toLowerCase() === lowerInput),
      );
    };

    const findProjectByNameOrAlternative = (input: string): Project | undefined => {
      const lowerInput = input.toLowerCase();
      return availableProjects.find(
        (p) => p.name.toLowerCase() === lowerInput || p.alternatives.some((alt) => alt.toLowerCase() === lowerInput),
      );
    };

    const findPriorityByNameOrAlternative = (input: string): Priority | undefined => {
      const lowerInput = input.toLowerCase();
      return availablePriorities.find(
        (p) => p.name.toLowerCase() === lowerInput || p.alternatives.some((alt) => alt.toLowerCase() === lowerInput),
      );
    };

    const filterPeopleBySearch = (search: string): Person[] => {
      const lowerSearch = search.toLowerCase();
      if (search === "") return availablePeople;
      return availablePeople.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.alternatives.some((alt) => alt.toLowerCase().includes(lowerSearch)),
      );
    };

    const filterProjectsBySearch = (search: string): Project[] => {
      const lowerSearch = search.toLowerCase();
      if (search === "") return availableProjects;
      return availableProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.alternatives.some((alt) => alt.toLowerCase().includes(lowerSearch)),
      );
    };

    const filterPrioritiesBySearch = (search: string): Priority[] => {
      const lowerSearch = search.toLowerCase();
      if (search === "") return availablePriorities;
      return availablePriorities.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.alternatives.some((alt) => alt.toLowerCase().includes(lowerSearch)),
      );
    };

    const renderTokensFromText = (
      text: string,
    ): { fragment: DocumentFragment; tokens: TokenMatch[]; plainText: string } => {
      const fragment = document.createDocumentFragment();
      const tokens: TokenMatch[] = [];
      const tokenDefs = buildTokenRegex();

      // First, extract explicit marker-based tokens
      for (const { type, symbol, regex } of tokenDefs) {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text))) {
          const raw = match[0];
          // Extract value by removing the symbol prefix
          let value = raw.slice(symbol.length);

          // For people markers, resolve alternatives to canonical name
          if (["assigned", "source"].includes(type)) {
            const person = findPersonByNameOrAlternative(value);
            if (person) {
              value = person.name; // Use canonical name
            }
          }
          // For project marker, resolve alternatives to canonical name
          else if (type === "project") {
            const project = findProjectByNameOrAlternative(value);
            if (project) {
              value = project.name; // Use canonical name
            }
          }
          // For priority marker, resolve alternatives to canonical name
          else if (type === "priority") {
            const priority = findPriorityByNameOrAlternative(value);
            if (priority) {
              value = priority.name; // Use canonical name
            }
          }

          tokens.push({ type, value, raw, start: match.index, end: match.index + raw.length });
        }
      }

      // Second, detect standalone duration patterns BEFORE chrono dates
      // This prevents patterns like "46m" from being interpreted as times
      const detectedDurations = detectDurationPatterns(text);

      for (const detected of detectedDurations) {
        // Check if this position overlaps with any existing token
        const overlapsExisting = tokens.some((t) => !(detected.end <= t.start || detected.start >= t.end));

        if (!overlapsExisting) {
          tokens.push({
            type: "duration",
            value: detected.value,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
          });
        }
      }

      // Third, detect dates using chrono-node (auto-detection only, no explicit markers)
      // Note: Duration patterns are already filtered out in detectDatesInText
      const detectedDates = detectDatesInText(text, new Date(), dateTimeSettings, workHoursSettings);

      for (const detected of detectedDates) {
        // Check if this date has been deactivated
        const posKey = `${detected.start}-${detected.end}`;
        const isDeactivated = activeDateIndices[posKey] === -1;

        // Skip if deactivated
        if (isDeactivated) {
          continue;
        }

        const activeIndex = activeDateIndices[posKey] || 0;

        // Convert detected date to ISO format
        const isoDate = detectedDateToISO(detected);

        // If this is a recurring pattern with duration (e.g., "every monday at 9am to 5pm")
        if (detected.recurring && detected.durationMinutes && detected.durationMinutes > 0) {
          // Add dueDate token (first occurrence with time)
          tokens.push({
            type: "dueDate",
            value: isoDate,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            detectedDateIndex: activeIndex,
            allDetectedDates: [isoDate],
            autoDetectedType: "recurring",
          });

          // Add duration token (same position)
          const days = Math.floor(detected.durationMinutes / 1440);
          const hours = Math.floor((detected.durationMinutes % 1440) / 60);
          const mins = detected.durationMinutes % 60;

          let durationStr = "";
          if (days > 0) durationStr += `${days}d`;
          if (hours > 0) durationStr += `${hours}h`;
          if (mins > 0 || durationStr === "") durationStr += `${mins}m`;

          tokens.push({
            type: "duration",
            value: durationStr,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            autoDetectedType: "recurring",
          });

          // Add recurring token (same position)
          tokens.push({
            type: "recurring",
            value: detected.recurring.raw,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            autoDetectedType: "recurring",
          });
        }
        // If this is a recurring pattern (without duration), create BOTH a dueDate and recurring token
        else if (detected.recurring) {
          // Add dueDate token (first occurrence)
          tokens.push({
            type: "dueDate",
            value: isoDate,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            detectedDateIndex: activeIndex,
            allDetectedDates: [isoDate],
            autoDetectedType: "recurring", // Track what it was recognized as
          });

          // Add recurring token (same position, will be rendered together)
          tokens.push({
            type: "recurring",
            value: detected.recurring.raw,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            autoDetectedType: "recurring",
          });
        }
        // If this is a range with a duration, create BOTH a dueDate and duration token
        else if (detected.durationMinutes && detected.durationMinutes > 0) {
          // Add dueDate token (start of range)
          tokens.push({
            type: "dueDate",
            value: isoDate,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            detectedDateIndex: activeIndex,
            allDetectedDates: [isoDate],
            autoDetectedType: "range",
          });

          // Add duration token (same position, will be rendered together)
          // Convert minutes to appropriate format (days, hours, minutes)
          const days = Math.floor(detected.durationMinutes / 1440);
          const hours = Math.floor((detected.durationMinutes % 1440) / 60);
          const mins = detected.durationMinutes % 60;

          let durationStr = "";
          if (days > 0) durationStr += `${days}d`;
          if (hours > 0) durationStr += `${hours}h`;
          if (mins > 0 || durationStr === "") durationStr += `${mins}m`;

          tokens.push({
            type: "duration",
            value: durationStr,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            autoDetectedType: "range",
          });
        } else {
          tokens.push({
            type: "dueDate",
            value: isoDate,
            raw: detected.text,
            start: detected.start,
            end: detected.end,
            isAutoDetected: true,
            detectedDateIndex: activeIndex,
            allDetectedDates: [isoDate],
            autoDetectedType: "simple",
          });
        }
      }

      // Third, detect mentioned people using auto-detection (skip areas covered by @ or $ markers)
      const detectedPeople = detectMentionedPeople(text, availablePeople);

      // Get all ranges already covered by explicit @ or $ markers
      const explicitPeopleRanges = tokens
        .filter((t) => t.type === "assigned" || t.type === "source")
        .map((t) => ({ start: t.start, end: t.end }));

      for (const detected of detectedPeople) {
        // Skip if this position overlaps with an explicit @ or $ marker
        const overlapsExplicit = explicitPeopleRanges.some(
          (range) => !(detected.end <= range.start || detected.start >= range.end),
        );

        if (overlapsExplicit) {
          continue;
        }

        // Skip if this position overlaps with any date token (dates take precedence)
        const overlapsDate = tokens.some(
          (t) =>
            (t.type === "dueDate" || t.type === "recurring") && !(detected.end <= t.start || detected.start >= t.end),
        );

        if (overlapsDate) {
          continue;
        }

        tokens.push({
          type: "mentioned",
          value: detected.personName, // Use canonical name
          raw: detected.text, // Original text as it appears
          start: detected.start,
          end: detected.end,
          isAutoDetected: true,
        });
      }

      // Fourth, detect mentioned projects using auto-detection (skip areas covered by % markers)
      const detectedProjects = detectMentionedProjects(text, availableProjects);

      // Get all ranges already covered by explicit % markers
      const explicitProjectRanges = tokens
        .filter((t) => t.type === "project")
        .map((t) => ({ start: t.start, end: t.end }));

      for (const detected of detectedProjects) {
        // Skip if this position overlaps with an explicit % marker
        const overlapsExplicit = explicitProjectRanges.some(
          (range) => !(detected.end <= range.start || detected.start >= range.end),
        );

        if (overlapsExplicit) {
          continue;
        }

        // Skip if this position overlaps with any date token (dates take precedence)
        const overlapsDate = tokens.some(
          (t) =>
            (t.type === "dueDate" || t.type === "recurring") && !(detected.end <= t.start || detected.start >= t.end),
        );

        if (overlapsDate) {
          continue;
        }

        // Skip if this position overlaps with any person token (people take precedence)
        const overlapsPerson = tokens.some(
          (t) =>
            (t.type === "assigned" || t.type === "source" || t.type === "mentioned") &&
            !(detected.end <= t.start || detected.start >= t.end),
        );

        if (overlapsPerson) {
          continue;
        }

        tokens.push({
          type: "project",
          value: detected.projectName, // Use canonical name
          raw: detected.text, // Original text as it appears
          start: detected.start,
          end: detected.end,
          isAutoDetected: true,
        });
      }

      // Fifth, detect source people using auto-detection (skip areas covered by $ markers)
      const detectedSourcePeople = detectSourcePeople(text, availablePeople);

      // Get all ranges already covered by explicit $ markers
      const explicitSourceRanges = tokens
        .filter((t) => t.type === "source")
        .map((t) => ({ start: t.start, end: t.end }));

      for (const detected of detectedSourcePeople) {
        // Skip if this position overlaps with an explicit $ marker
        const overlapsExplicit = explicitSourceRanges.some(
          (range) => !(detected.end <= range.start || detected.start >= range.end),
        );

        if (overlapsExplicit) {
          continue;
        }

        // Skip if this position overlaps with any existing token (dates, people, projects take precedence)
        const overlapsExisting = tokens.some((t) => !(detected.end <= t.start || detected.start >= t.end));

        if (overlapsExisting) {
          continue;
        }

        tokens.push({
          type: "source",
          value: detected.personName, // Use canonical name
          raw: detected.text, // Original text as it appears
          start: detected.start,
          end: detected.end,
          isAutoDetected: true,
        });
      }

      // Sixth, detect priorities using auto-detection (skip areas covered by !! markers)
      const detectedPriorities = detectPriorities(text, availablePriorities);

      // Get all ranges already covered by explicit !! markers
      const explicitPriorityRanges = tokens
        .filter((t) => t.type === "priority")
        .map((t) => ({ start: t.start, end: t.end }));

      for (const detected of detectedPriorities) {
        // Skip if this position overlaps with an explicit !! marker
        const overlapsExplicit = explicitPriorityRanges.some(
          (range) => !(detected.end <= range.start || detected.start >= range.end),
        );

        if (overlapsExplicit) {
          continue;
        }

        // Skip if this position overlaps with any existing token
        const overlapsExisting = tokens.some((t) => !(detected.end <= t.start || detected.start >= t.end));

        if (overlapsExisting) {
          continue;
        }

        tokens.push({
          type: "priority",
          value: detected.priorityName, // Use canonical name
          raw: detected.text, // Original text as it appears
          start: detected.start,
          end: detected.end,
          isAutoDetected: true,
        });
      }

      tokens.sort((a, b) => a.start - b.start);

      let pos = 0;
      let plainText = "";
      const processedIndices = new Set<number>();

      // Types to exclude from plainText when auto-detected
      const autoDetectedTypesToRemove = new Set(["dueDate", "duration", "recurring", "dependency"]);

      // Explicit marker types to remove from plainText (keep @ and $ for people)
      const explicitMarkerTypesToRemove = new Set([
        "dueDate",
        "duration",
        "recurring",
        "dependency",
        "priority",
        "project",
        "tag",
      ]);

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Skip if we already processed this token as part of a co-located group
        if (processedIndices.has(i)) {
          continue;
        }

        if (token.start > pos) {
          const textPart = text.slice(pos, token.start);
          fragment.append(document.createTextNode(textPart));
          plainText += textPart;
        }

        // Collect all tokens at the same position (co-located tokens like dueDate + duration + recurring)
        const coLocatedTokens = [token];
        const coLocatedIndices = [i];
        let j = i + 1;
        while (j < tokens.length && tokens[j].start === token.start && tokens[j].end === token.end) {
          coLocatedTokens.push(tokens[j]);
          coLocatedIndices.push(j);
          j++;
        }

        // Mark all co-located tokens as processed
        coLocatedIndices.forEach((idx) => processedIndices.add(idx));

        // Helper function to get token color (custom or fallback)
        const getTokenColor = (tok: TokenMatch): string => {
          // For people tokens, try to get custom color
          if (tok.type === "assigned" || tok.type === "source" || tok.type === "mentioned") {
            const person = availablePeople.find((p) => p.name === tok.value || p.alternatives.includes(tok.value));
            return person?.color || markerColors["assigned"] || "#e3f2fd";
          }

          // For project tokens, try to get custom color
          if (tok.type === "project") {
            const project = availableProjects.find((p) => p.name === tok.value || p.alternatives.includes(tok.value));
            return project?.color || markerColors["project"] || "#f3e5f5";
          }

          // For priority tokens, try to get custom color
          if (tok.type === "priority") {
            const priority = availablePriorities.find(
              (p) => p.name === tok.value || p.alternatives.includes(tok.value),
            );
            return priority?.color || markerColors["priority"] || "#ffebee";
          }

          // For auto-detected date/duration/recurring, use marker colors
          if (tok.isAutoDetected && tok.autoDetectedType) {
            if (tok.type === "recurring") return markerColors["recurring"] || "#e0f2f1";
            if (tok.type === "duration") return markerColors["duration"] || "#fff4e6";
            if (tok.type === "dueDate") return markerColors["dueDate"] || "#fce4ec";
          }

          // Fallback to marker color or default
          const fallbackColors: Record<string, string> = {
            dueDate: "#fce4ec",
            duration: "#fff4e6",
            recurring: "#e0f2f1",
            dependency: "#fff8e1",
            assigned: "#e3f2fd",
            source: "#f1f8e9",
            mentioned: "#fff9c4",
            project: "#f3e5f5",
            priority: "#ffebee",
            tag: "#e0f7fa",
          };
          return markerColors[tok.type as keyof typeof markerColors] || fallbackColors[tok.type] || "#f5f5f5";
        };

        // For co-located tokens (e.g., dueDate + duration + recurring at same position),
        // use the primary token's color (recurring > duration > dueDate)
        const primaryToken = [...coLocatedTokens].sort((a, b) => {
          const priority: Record<string, number> = { recurring: 3, duration: 2, dueDate: 1 };
          return (priority[b.type] || 0) - (priority[a.type] || 0);
        })[0];
        const color = getTokenColor(primaryToken);

        // Create a wrapper span for the token
        const wrapper = document.createElement("span");
        wrapper.textContent = text.slice(token.start, token.end);
        wrapper.style.backgroundColor = color;
        wrapper.style.padding = "2px 4px";
        wrapper.style.borderRadius = "4px";
        wrapper.style.opacity = "0.8";

        // Add dotted underline for auto-detected tokens
        if (token.isAutoDetected) {
          wrapper.style.textDecoration = "underline dotted";
          wrapper.style.cursor = "pointer";
          wrapper.title = "Click to deactivate auto-detection";
          wrapper.dataset.autoDetected = "true";
          wrapper.dataset.position = `${token.start}-${token.end}`;

          wrapper.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const posKey = wrapper.dataset.position!;
            setActiveDateIndices((prev) => ({
              ...prev,
              [posKey]: -1,
            }));
          });
        }

        fragment.appendChild(wrapper);

        // For plainText: exclude certain tokens based on type and whether they're auto-detected
        // Auto-detected date/duration/recurring/dependency should be removed
        // Explicit markers (!!, %, #) should also be removed
        // BUT keep @ and $ markers for people (assigned and source)
        const shouldExcludeFromPlainText = coLocatedTokens.every((tok) => {
          // Remove if auto-detected and in removal list
          if (tok.isAutoDetected && autoDetectedTypesToRemove.has(tok.type)) {
            return true;
          }
          // Remove if explicit marker that should be removed
          if (!tok.isAutoDetected && explicitMarkerTypesToRemove.has(tok.type)) {
            return true;
          }
          return false;
        });

        if (!shouldExcludeFromPlainText) {
          // Include this token in plainText
          plainText += text.slice(token.start, token.end);
        }

        pos = token.end;
      }

      if (pos < text.length) {
        const textPart = text.slice(pos);
        fragment.append(document.createTextNode(textPart));
        plainText += textPart;
      }

      plainText = plainText.replace(/\s+/g, " ").trim();

      return { fragment, tokens, plainText };
    };

    const handleInput = () => {
      const div = editableRef.current;
      if (!div) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      // Save the caret position as a character offset
      const range = sel.getRangeAt(0);

      // Calculate character offset by walking the DOM
      let caretOffset = 0;
      const walkNodes = (node: Node): boolean => {
        if (node === range.startContainer) {
          caretOffset += range.startOffset;
          return true; // Found it
        }
        if (node.nodeType === Node.TEXT_NODE) {
          caretOffset += node.textContent?.length || 0;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          for (const child of Array.from(node.childNodes)) {
            if (walkNodes(child)) return true;
          }
        }
        return false;
      };
      walkNodes(div);

      // Get the raw text content
      const fullText = div.textContent || "";

      // Look for marker symbols starting from the end backwards
      // Note: # (tag) is excluded from autocomplete since tags are freeform text
      const peopleMarkers = ["@", "$"];
      const projectMarker = "%";
      const priorityMarker = "!!";
      const allMarkers = [...peopleMarkers, projectMarker, priorityMarker];

      // Find the last marker before the caret
      const textBeforeCaret = fullText.substring(0, caretOffset);
      let lastMarkerPos = -1;
      let lastMarker = "";
      for (const marker of allMarkers) {
        const pos = textBeforeCaret.lastIndexOf(marker);
        if (pos > lastMarkerPos) {
          lastMarkerPos = pos;
          lastMarker = marker;
        }
      }

      // Check if we found a marker and there's no space after it (meaning we're still typing the name)
      let shouldShowAutocomplete = false;
      let autocompleteType = "";
      let autocompleteMarker = "";
      let searchText = "";
      let options: string[] = [];

      if (lastMarkerPos >= 0) {
        const textAfterMarker = textBeforeCaret.substring(lastMarkerPos + lastMarker.length);
        // Only show autocomplete if there's no completed token (no space after the marker's content)
        const hasSpaceAfter = textAfterMarker.includes(" ");

        if (!hasSpaceAfter) {
          searchText = textAfterMarker.toLowerCase();

          if (peopleMarkers.includes(lastMarker)) {
            shouldShowAutocomplete = true;
            autocompleteType = "person";
            autocompleteMarker = lastMarker;
            const filteredPeople = filterPeopleBySearch(searchText);
            options = filteredPeople.map((p) => p.name);
          } else if (lastMarker === projectMarker) {
            shouldShowAutocomplete = true;
            autocompleteType = "project";
            autocompleteMarker = lastMarker;
            const filteredProjects = filterProjectsBySearch(searchText);
            options = filteredProjects.map((p) => p.name);
          } else if (lastMarker === priorityMarker) {
            shouldShowAutocomplete = true;
            autocompleteType = "priority";
            autocompleteMarker = lastMarker;
            const filteredPriorities = filterPrioritiesBySearch(searchText);
            // Show both the priority name and matching alternatives
            options = [];
            filteredPriorities.forEach((p) => {
              // Always add the canonical name
              if (!options.includes(p.name)) {
                options.push(p.name);
              }
              // Add matching alternatives
              p.alternatives.forEach((alt) => {
                if (alt.toLowerCase().includes(searchText) && !options.includes(alt)) {
                  options.push(alt);
                }
              });
            });
          }
        }
      }

      if (shouldShowAutocomplete) {
        // Get caret position for dropdown placement using a temporary span
        const tempRange = document.createRange();
        tempRange.setStart(range.startContainer, range.startOffset);
        tempRange.collapse(true);
        const tempSpan = document.createElement("span");
        tempRange.insertNode(tempSpan);
        const rect = tempSpan.getBoundingClientRect();
        const divRect = div.getBoundingClientRect();
        tempSpan.remove();

        // Show "Add new" option if there are no matches and search text is not empty
        const showAddNew = options.length === 0 && searchText.trim() !== "";
        const canAddNew =
          (autocompleteType === "person" && onAddPerson) ||
          (autocompleteType === "project" && onAddProject) ||
          (autocompleteType === "priority" && onAddPriority);

        setAutocomplete({
          show: true,
          options,
          selected: 0,
          type: autocompleteType,
          marker: autocompleteMarker,
          searchText,
          showAddNew: showAddNew && !!canAddNew,
          position: {
            top: rect.bottom - divRect.top + 5,
            left: rect.left - divRect.left,
          },
        });
      } else {
        setAutocomplete((prev) => ({ ...prev, show: false }));
      }

      // Re-render content with tokens
      const { fragment, tokens, plainText } = renderTokensFromText(fullText);
      if (onTokensChange) onTokensChange(tokens, fullText.trim(), plainText);

      div.innerHTML = "";
      div.appendChild(fragment);

      // Restore caret position by walking the new DOM
      let currentOffset = 0;
      let targetNode: Node | null = null;
      let targetOffset = 0;

      const findCaretPosition = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
          const len = node.textContent?.length || 0;
          if (currentOffset + len >= caretOffset) {
            targetNode = node;
            targetOffset = caretOffset - currentOffset;
            return true;
          }
          currentOffset += len;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          for (const child of Array.from(node.childNodes)) {
            if (findCaretPosition(child)) return true;
          }
        }
        return false;
      };

      findCaretPosition(div);

      if (targetNode) {
        const newRange = document.createRange();
        const newSel = window.getSelection();
        try {
          newRange.setStart(targetNode, targetOffset);
          newRange.collapse(true);
          newSel?.removeAllRanges();
          newSel?.addRange(newRange);
        } catch {
          // If positioning fails, put cursor at end
          newRange.selectNodeContents(div);
          newRange.collapse(false);
          newSel?.removeAllRanges();
          newSel?.addRange(newRange);
        }
      } else {
        // Fallback: put cursor at end
        const newRange = document.createRange();
        const newSel = window.getSelection();
        newRange.selectNodeContents(div);
        newRange.collapse(false);
        newSel?.removeAllRanges();
        newSel?.addRange(newRange);
      }

      div.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle autocomplete navigation
      if (autocomplete.show) {
        const totalItems = autocomplete.options.length + (autocomplete.showAddNew ? 1 : 0);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAutocomplete((prev) => ({
            ...prev,
            selected: Math.min(prev.selected + 1, totalItems - 1),
          }));
          return;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setAutocomplete((prev) => ({
            ...prev,
            selected: Math.max(prev.selected - 1, 0),
          }));
          return;
        } else if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          if (autocomplete.showAddNew && autocomplete.selected === autocomplete.options.length) {
            // Selected "Add new" option
            handleAddNew();
          } else if (autocomplete.options.length > 0) {
            insertAutocomplete(autocomplete.options[autocomplete.selected]);
          }
          return;
        } else if (e.key === "Escape") {
          e.preventDefault();
          setAutocomplete((prev) => ({ ...prev, show: false }));
          return;
        }
      }

      if (e.key === "Enter" && !autocomplete.show) {
        e.preventDefault();
        if (onEnterPress) {
          onEnterPress();
        }
      } else if (e.key === "Backspace") {
        const sel = window.getSelection();
        const node = sel?.anchorNode?.parentElement;
        if (node?.dataset?.token) {
          node.remove();
          e.preventDefault();
        }
      }
    };

    const insertAutocomplete = (value: string) => {
      const div = editableRef.current;
      if (!div) return;

      const fullText = div.innerText.replace(/\n/g, " ");

      // Find the last marker position (same markers as autocomplete triggers, excluding # for tags)
      const allMarkers = ["@", "$", "%", "!!"];
      let lastMarkerPos = -1;
      let lastMarker = "";

      for (const marker of allMarkers) {
        const pos = fullText.lastIndexOf(marker);
        if (pos > lastMarkerPos) {
          lastMarkerPos = pos;
          lastMarker = marker;
        }
      }

      if (lastMarkerPos === -1) return;

      // Use the value as-is (no special processing needed for current marker types)
      const finalValue = value;

      // Split text: before marker, and after the incomplete name
      const beforeMarker = fullText.substring(0, lastMarkerPos);
      // Find if there's any text after the current typing position
      const afterMarker = fullText.substring(lastMarkerPos);
      const spaceAfterIndex = afterMarker.indexOf(" ", 1); // Start from 1 to skip the marker itself
      const afterText = spaceAfterIndex >= 0 ? afterMarker.substring(spaceAfterIndex) : "";

      // Build the new text with the completed name
      const newText = beforeMarker + autocomplete.marker + finalValue + " " + afterText;
      const { fragment, tokens, plainText } = renderTokensFromText(newText);

      if (onTokensChange) onTokensChange(tokens, newText.trim(), plainText);

      div.innerHTML = "";
      div.appendChild(fragment);

      // Place cursor after the inserted name
      const range = document.createRange();
      const newSel = window.getSelection();
      range.selectNodeContents(div);
      range.collapse(false);
      newSel?.removeAllRanges();
      newSel?.addRange(range);

      setAutocomplete((prev) => ({ ...prev, show: false }));
      div.focus();
    };

    const handleAddNew = () => {
      const name = autocomplete.searchText.trim();
      if (!name) return;

      // Call the appropriate callback to add the person/project/priority
      if (autocomplete.type === "person" && onAddPerson) {
        onAddPerson(name);
      } else if (autocomplete.type === "project" && onAddProject) {
        onAddProject(name);
      } else if (autocomplete.type === "priority" && onAddPriority) {
        onAddPriority(name);
      }

      // Insert the new name into the text
      insertAutocomplete(name);
    };

    return (
      <div className="relative">
        <div
          ref={editableRef}
          data-testid="smart-input"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[3rem] cursor-text"
          data-placeholder={placeholder || "What needs to be done?"}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />

        {/* Autocomplete Dropdown */}
        {autocomplete.show && (
          <div
            className="autocomplete-dropdown absolute z-50 mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: `${autocomplete.position.top}px`,
              left: `${autocomplete.position.left}px`,
              minWidth: "200px",
            }}
          >
            {autocomplete.options.map((option, idx) => (
              <button
                key={option}
                type="button"
                onClick={() => insertAutocomplete(option)}
                onMouseEnter={() => setAutocomplete((prev) => ({ ...prev, selected: idx }))}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                  idx === autocomplete.selected
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                <span className="font-medium">{autocomplete.marker}</span>
                {option}
              </button>
            ))}
            {autocomplete.showAddNew && (
              <button
                key="add-new"
                type="button"
                onClick={handleAddNew}
                onMouseEnter={() => setAutocomplete((prev) => ({ ...prev, selected: prev.options.length }))}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-t border-zinc-200 dark:border-zinc-700 ${
                  autocomplete.selected === autocomplete.options.length
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                <span className="font-medium">➕ Add new {autocomplete.type}: </span>
                <span className="italic">{autocomplete.searchText}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);

SmartEditableInput.displayName = "SmartEditableInput";

export default SmartEditableInput;
