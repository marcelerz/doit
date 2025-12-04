import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Person, Project, Priority, DateTimeSettings, WorkHoursSettings } from "@/types/settings";
import { getDueDateSuggestions, parseDate, formatDateTime } from "@/utils/dateParser";
import { getRecurringSuggestions } from "@/utils/recurringParser";
import { TodoModel } from "@/models/TodoModel";
import { PersonModel } from "@/models/PersonModel";
import { ProjectModel } from "@/models/ProjectModel";

export interface TokenMatch {
  type: string;
  value: string; // parsed value, e.g. "marcel" (not "@marcel")
  raw: string; // raw matched string, e.g. "@marcel"
  start: number;
  end: number;
}

export interface SmartEditableInputProps {
  markers: Record<string, string>; // e.g. { assignee: "@", project: "#", priority: "!!" }
  markerColors?: Record<string, string>; // e.g. { assigned: "#cce5ff", project: "#e2ccff" }
  onTokensChange?: (tokens: TokenMatch[], rawText: string, plainText: string) => void;
  placeholder?: string;
  initialValue?: string;
  onEnterPress?: () => void;
  availablePeople?: PersonModel[]; // List of valid people with alternatives
  availableProjects?: ProjectModel[]; // List of valid projects with alternatives
  availablePriorities?: Priority[]; // List of valid priorities with alternatives
  availableTodos?: TodoModel[]; // List of todos for dependency selection
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
      markers,
      markerColors = {},
      onTokensChange,
      placeholder,
      initialValue,
      onEnterPress,
      availablePeople = [],
      availableProjects = [],
      availablePriorities = [],
      availableTodos = [],
      onAddPerson,
      onAddProject,
      onAddPriority,
      dateTimeSettings,
      workHoursSettings,
    },
    ref,
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const [autocomplete, setAutocomplete] = useState<{
      show: boolean;
      options: string[];
      values?: string[]; // For dependency: actual IDs to insert (parallel to options)
      selected: number;
      type: string;
      marker: string;
      searchText: string;
      showAddNew: boolean;
      position: { top: number; left: number };
    }>({
      show: false,
      options: [],
      values: undefined,
      selected: 0,
      type: "",
      marker: "",
      searchText: "",
      showAddNew: false,
      position: { top: 0, left: 0 },
    });

    useImperativeHandle(ref, () => ({
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
    }));

    // Re-render content when availablePeople, availableProjects, or availablePriorities change
    // This ensures highlighting updates when new people/projects/priorities are added
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
    }, [availablePeople, availableProjects, availablePriorities]);

    const defaultColors: string[] = [
      "#cce5ff",
      "#e2ccff",
      "#ffd4d4",
      "#d4fdd4",
      "#d4faff",
      "#ffe5b4",
      "#e0ffff",
      "#fce4ec",
      "#e8f5e9",
      "#f3e5f5",
    ];

    const buildTokenRegex = (): { type: string; symbol: string; regex: RegExp }[] => {
      const patterns: { type: string; symbol: string; regex: RegExp }[] = [];

      // Build patterns for people markers (@, $, ^)
      const peopleMarkers = [
        { type: "assigned", symbol: "@" },
        { type: "source", symbol: "$" },
        { type: "mentioned", symbol: "^" },
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

      // Build pattern for project marker (#)
      const allProjects = availableProjects.flatMap((p) => [p.name, ...p.alternatives]);
      if (allProjects.length > 0) {
        const sortedProjects = allProjects.sort((a, b) => b.length - a.length);
        const namesPattern = sortedProjects.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const regex = new RegExp(`#(${namesPattern})(?=\\s|$)`, "gi");
        patterns.push({ type: "project", symbol: "#", regex });
      }

      // Build pattern for priority marker (!!)
      const allPriorities = availablePriorities.flatMap((p) => [p.name, ...p.alternatives]);
      if (allPriorities.length > 0) {
        const sortedPriorities = allPriorities.sort((a, b) => b.length - a.length);
        const namesPattern = sortedPriorities.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const regex = new RegExp(`!!(${namesPattern})(?=\\s|$)`, "gi");
        patterns.push({ type: "priority", symbol: "!!", regex });
      }

      // Build pattern for due date marker (~)
      // Matches dates like: ~tomorrow, ~2024-12-25, ~Mon, 1st Dec 2025 3:12pm, ~23.12.2025 13:40, ~eod
      // Pattern matches everything after ~ until we hit a known marker or end of input
      // Allows letters (for month names, day names), digits, punctuation (commas, colons, slashes, dots)
      // and am/pm indicators. Stops at other markers or double spaces.
      const dueDatePattern = `~([^@#$^*~%\\n]+?)(?=\\s{2,}|\\s+[@#$^*~%!]{1,2}|$)`;
      patterns.push({
        type: "dueDate",
        symbol: "~",
        regex: new RegExp(dueDatePattern, "gi"),
      });

      // Build pattern for tag marker (&) - freeform text
      const tagPattern = `&([^\\s@#$^*~%>&]+?)(?=\\s|$)`;
      patterns.push({
        type: "tag",
        symbol: "&",
        regex: new RegExp(tagPattern, "gi"),
      });

      // Build pattern for duration marker (*) with specific format support
      // Supports: 5sec/secs/seconds, 5min/mins/minute/minutes, 3hr/hrs/h/hour/hours,
      // 5d/day/days, 2w/wk/wks/week/weeks, 1m/month/months, 3y/yr/yrs/year/years
      const durationPattern = `\\*(\\d+(?:sec|secs?|seconds?|mins?|minutes?|h|hrs?|hours?|d|days?|w|wks?|weeks?|m|months?|y|yrs?|years?))(?=\\s|$)`;
      patterns.push({
        type: "duration",
        symbol: "*",
        regex: new RegExp(durationPattern, "gi"),
      });

      // Build pattern for recurring marker (%)
      // Matches patterns like: %every 2 days, %every monday, %monthly on 15th, %workday
      const recurringPattern = `%([^@#$^*~%>\\n]+?)(?=\\s{2,}|\\s+[@#$^*~%>!]{1,2}|$)`;
      patterns.push({
        type: "recurring",
        symbol: "%",
        regex: new RegExp(recurringPattern, "gi"),
      });

      // Build pattern for dependency marker (>)
      // Matches todo IDs after > symbol
      const dependencyPattern = `>([a-zA-Z0-9-]+)(?=\\s|$)`;
      patterns.push({
        type: "dependency",
        symbol: ">",
        regex: new RegExp(dependencyPattern, "gi"),
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

    const filterTodosBySearch = (search: string): { id: string; text: string }[] => {
      const lowerSearch = search.toLowerCase();
      if (search === "") return availableTodos.slice(0, 10).map((t) => ({ id: t.id, text: t.plainText }));
      return availableTodos
        .filter((t) => t.plainText.toLowerCase().includes(lowerSearch))
        .slice(0, 10)
        .map((t) => ({ id: t.id, text: t.plainText }));
    };

    const getDurationSuggestions = (search: string): string[] => {
      // Duration units with descriptions
      const units = [
        { suffix: "sec", label: "sec - seconds" },
        { suffix: "min", label: "min - minutes" },
        { suffix: "h", label: "h - hours" },
        { suffix: "d", label: "d - days" },
        { suffix: "w", label: "w - weeks" },
        { suffix: "m", label: "m - months" },
        { suffix: "y", label: "y - years" },
      ];

      // Extract the number part if present
      const numberMatch = search.match(/^(\d+)/);
      const hasNumber = !!numberMatch;
      const number = numberMatch ? numberMatch[1] : "";
      const textAfterNumber = hasNumber ? search.slice(number.length) : search;

      // Filter units based on what's typed after the number
      const filtered = units.filter((u) => u.suffix.startsWith(textAfterNumber.toLowerCase()));

      // Return suggestions with the number prepended
      return filtered.map((u) => (hasNumber ? `${number}${u.suffix}` : u.label));
    };

    const renderTokensFromText = (
      text: string,
    ): { fragment: DocumentFragment; tokens: TokenMatch[]; plainText: string } => {
      const fragment = document.createDocumentFragment();
      const tokens: TokenMatch[] = [];
      const tokenDefs = buildTokenRegex();

      for (const { type, symbol, regex } of tokenDefs) {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text))) {
          const raw = match[0];
          // For dueDate and recurring, match[1] contains the captured value without ~ or %
          // For other types, extract by removing the symbol prefix
          let value =
            (type === "dueDate" || type === "recurring") && match[1] ? match[1].trim() : raw.slice(symbol.length);

          // For people markers, resolve alternatives to canonical name
          if (["assigned", "source", "mentioned"].includes(type)) {
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

      tokens.sort((a, b) => a.start - b.start);

      let pos = 0;
      const colorMap: Record<string, string> = {};
      let colorIdx = 0;
      let plainText = "";

      for (const token of tokens) {
        if (token.start > pos) {
          const textPart = text.slice(pos, token.start);
          fragment.append(document.createTextNode(textPart));
          plainText += textPart;
        }

        const span = document.createElement("span");

        // For due dates, try to parse and show formatted date as preview
        let displayText = token.raw;
        if (token.type === "dueDate" && dateTimeSettings && workHoursSettings) {
          const parsed = parseDate(token.value, dateTimeSettings, workHoursSettings);
          if (parsed) {
            displayText = `~${parsed.formatted}`;
          }
        }

        span.textContent = displayText;
        span.contentEditable = "false";
        span.dataset.token = token.type;

        // Determine background color - try to get entity-specific color first
        let bgColor = colorMap[token.type];

        // For assigned, source, or mentioned people, look up person's custom color
        if ((token.type === "assigned" || token.type === "source" || token.type === "mentioned") && availablePeople) {
          const person = availablePeople.find((p) => p.name === token.value || p.alternatives.includes(token.value));
          if (person?.color) {
            bgColor = person.color;
          }
        }
        // For projects, look up project's custom color
        else if (token.type === "project" && availableProjects) {
          const project = availableProjects.find((p) => p.name === token.value || p.alternatives.includes(token.value));
          if (project?.color) {
            bgColor = project.color;
          }
        }
        // For priorities, look up priority's custom color
        else if (token.type === "priority" && availablePriorities) {
          const priority = availablePriorities.find(
            (p) => p.name === token.value || p.alternatives.includes(token.value),
          );
          if (priority?.color) {
            bgColor = priority.color;
          }
        }

        // Fall back to marker color or default if no entity-specific color found
        if (!bgColor) {
          if (!colorMap[token.type]) {
            colorMap[token.type] = markerColors[token.type] || defaultColors[colorIdx % defaultColors.length];
            colorIdx++;
          }
          bgColor = colorMap[token.type];
        }

        Object.assign(span.style, {
          display: "inline-block",
          padding: "2px 6px",
          margin: "0 2px",
          borderRadius: "4px",
          fontWeight: "bold",
          backgroundColor: bgColor,
          color: "#333",
        });

        fragment.appendChild(span);
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
      const range = sel?.getRangeAt(0);
      if (!range) return;

      const caretMarker = document.createElement("span");
      caretMarker.id = "caret-marker";
      caretMarker.textContent = "\u200B"; // Zero-width space
      range.insertNode(caretMarker);

      const fullText = div.innerText.replace(/\n/g, " ").replace(/\s+/g, " ");

      // Find caret position
      const caretPosition = fullText.indexOf("\u200B");
      const textBeforeCaret = caretPosition >= 0 ? fullText.substring(0, caretPosition) : fullText;

      // Look for marker symbols starting from the end backwards
      const peopleMarkers = ["@", "$", "^"];
      const projectMarker = "#";
      const priorityMarker = "!!";
      const durationMarker = "*";
      const dueDateMarker = "~";
      const recurringMarker = "%";
      const dependencyMarker = ">";
      const allMarkers = [
        ...peopleMarkers,
        projectMarker,
        priorityMarker,
        durationMarker,
        dueDateMarker,
        recurringMarker,
        dependencyMarker,
      ];

      // Find the last marker before the caret
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
      let autocompleteValues: string[] | undefined = undefined; // For dependency: store todo IDs

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
          } else if (lastMarker === durationMarker) {
            shouldShowAutocomplete = true;
            autocompleteType = "duration";
            autocompleteMarker = lastMarker;
            options = getDurationSuggestions(searchText);
          } else if (lastMarker === dueDateMarker && dateTimeSettings) {
            shouldShowAutocomplete = true;
            autocompleteType = "duedate";
            autocompleteMarker = lastMarker;
            options = getDueDateSuggestions(searchText, dateTimeSettings);
          } else if (lastMarker === recurringMarker) {
            shouldShowAutocomplete = true;
            autocompleteType = "recurring";
            autocompleteMarker = lastMarker;
            options = getRecurringSuggestions().filter((s) => s.toLowerCase().includes(searchText.toLowerCase()));
          } else if (lastMarker === dependencyMarker) {
            shouldShowAutocomplete = true;
            autocompleteType = "dependency";
            autocompleteMarker = lastMarker;
            const filteredTodos = filterTodosBySearch(searchText);
            options = filteredTodos.map((t) => t.text);
            // Store the actual IDs separately for insertion later
            autocompleteValues = filteredTodos.map((t) => t.id);
          }
        }
      }

      if (shouldShowAutocomplete) {
        // Get caret position for dropdown placement
        const markerRect = caretMarker.getBoundingClientRect();
        const divRect = div.getBoundingClientRect();

        // Show "Add new" option if there are no matches and search text is not empty
        // (but not for duration, duedate, recurring, or dependency, which are just format suggestions or lookups)
        const showAddNew =
          options.length === 0 &&
          searchText.trim() !== "" &&
          autocompleteType !== "duration" &&
          autocompleteType !== "duedate" &&
          autocompleteType !== "recurring" &&
          autocompleteType !== "dependency";
        const canAddNew =
          (autocompleteType === "person" && onAddPerson) ||
          (autocompleteType === "project" && onAddProject) ||
          (autocompleteType === "priority" && onAddPriority);

        setAutocomplete({
          show: true,
          options,
          values: autocompleteValues,
          selected: 0,
          type: autocompleteType,
          marker: autocompleteMarker,
          searchText,
          showAddNew: showAddNew && !!canAddNew,
          position: {
            top: markerRect.bottom - divRect.top + 5,
            left: markerRect.left - divRect.left,
          },
        });
      } else {
        setAutocomplete((prev) => ({ ...prev, show: false }));
      }

      caretMarker.remove();

      const { fragment, tokens, plainText } = renderTokensFromText(fullText.replace("\u200B", ""));
      if (onTokensChange) onTokensChange(tokens, fullText.replace("\u200B", "").trim(), plainText);

      fragment.appendChild(caretMarker);

      div.innerHTML = "";
      div.appendChild(fragment);

      const newMarker = document.getElementById("caret-marker");
      if (newMarker) {
        const newRange = document.createRange();
        const newSel = window.getSelection();
        newRange.setStartAfter(newMarker);
        newRange.collapse(true);
        newSel?.removeAllRanges();
        newSel?.addRange(newRange);
        newMarker.remove();
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

      // Find the last marker position
      const allMarkers = ["@", "$", "^", "#", "!!", "*", "~"];
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

      // For dependency, use the actual ID instead of the displayed text
      let finalValue = value;
      if (autocomplete.type === "dependency" && autocomplete.values) {
        const selectedIndex = autocomplete.options.indexOf(value);
        if (selectedIndex >= 0 && selectedIndex < autocomplete.values.length) {
          finalValue = autocomplete.values[selectedIndex];
        }
      } else if (autocomplete.type === "duedate" && dateTimeSettings && workHoursSettings) {
        // For due date, parse the shorthand and convert to actual date
        const shorthand = value.includes(" - ") ? value.split(" - ")[0] : value;
        const parsed = parseDate(shorthand, dateTimeSettings, workHoursSettings);
        if (parsed) {
          finalValue = parsed.formatted;
        }
      }

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
            className="absolute z-50 mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
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
