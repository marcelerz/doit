import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Person, Project } from "@/types/settings";

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
  availablePeople?: Person[]; // List of valid people with alternatives
  availableProjects?: Project[]; // List of valid projects with alternatives
}

export interface SmartEditableInputHandle {
  clear: () => void;
  setValue: (text: string) => void;
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
    },
    ref,
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const [autocomplete, setAutocomplete] = useState<{
      show: boolean;
      options: string[];
      selected: number;
      type: string;
      marker: string;
      searchText: string;
      position: { top: number; left: number };
    }>({
      show: false,
      options: [],
      selected: 0,
      type: "",
      marker: "",
      searchText: "",
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
    }));

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
      return Object.entries(markers).map(([type, symbol]) => {
        const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`${escaped}[\\w-_]+(?=\\s|$)`, "gi");
        return { type, symbol, regex };
      });
    };

    // Helper to find person/project by name or alternative
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
          let value = raw.slice(symbol.length); // remove prefix symbol

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
        span.textContent = token.raw;
        span.contentEditable = "false";
        span.dataset.token = token.type;

        // Use marker-specific color from markerColors prop, or fall back to defaultColors
        if (!colorMap[token.type]) {
          colorMap[token.type] = markerColors[token.type] || defaultColors[colorIdx % defaultColors.length];
          colorIdx++;
        }

        Object.assign(span.style, {
          display: "inline-block",
          padding: "2px 6px",
          margin: "0 2px",
          borderRadius: "4px",
          fontWeight: "bold",
          backgroundColor: colorMap[token.type],
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

      // Get the word being typed (everything after the last space before caret)
      const lastSpaceIndex = textBeforeCaret.lastIndexOf(" ");
      const currentWord = lastSpaceIndex >= 0 ? textBeforeCaret.substring(lastSpaceIndex + 1) : textBeforeCaret;

      // Check if we're typing a marker
      const peopleMarkers = ["@", "$", "^"];
      const projectMarker = "#";

      let shouldShowAutocomplete = false;
      let autocompleteType = "";
      let autocompleteMarker = "";
      let searchText = "";
      let options: string[] = [];

      if (currentWord.length > 0) {
        const firstChar = currentWord[0];

        if (peopleMarkers.includes(firstChar)) {
          shouldShowAutocomplete = true;
          autocompleteType = "person";
          autocompleteMarker = firstChar;
          searchText = currentWord.slice(1).toLowerCase();
          const filteredPeople = filterPeopleBySearch(searchText);
          options = filteredPeople.map((p) => p.name);
        } else if (firstChar === projectMarker) {
          shouldShowAutocomplete = true;
          autocompleteType = "project";
          autocompleteMarker = firstChar;
          searchText = currentWord.slice(1).toLowerCase();
          const filteredProjects = filterProjectsBySearch(searchText);
          options = filteredProjects.map((p) => p.name);
        }
      }

      if (shouldShowAutocomplete && options.length > 0) {
        // Get caret position for dropdown placement
        const markerRect = caretMarker.getBoundingClientRect();
        const divRect = div.getBoundingClientRect();

        setAutocomplete({
          show: true,
          options,
          selected: 0,
          type: autocompleteType,
          marker: autocompleteMarker,
          searchText,
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
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAutocomplete((prev) => ({
            ...prev,
            selected: Math.min(prev.selected + 1, prev.options.length - 1),
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
          if (autocomplete.options.length > 0) {
            e.preventDefault();
            insertAutocomplete(autocomplete.options[autocomplete.selected]);
            return;
          }
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

      // Find the current word being typed
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      // Get text content and find last incomplete marker
      const textBeforeCaret = fullText.substring(0, fullText.length);
      const lastSpaceIndex = textBeforeCaret.lastIndexOf(" ");
      const beforeWord = lastSpaceIndex >= 0 ? textBeforeCaret.substring(0, lastSpaceIndex + 1) : "";
      const afterCaret = ""; // Text after caret if needed

      // Replace with completed marker
      const newText = beforeWord + autocomplete.marker + value + " " + afterCaret;
      const { fragment, tokens, plainText } = renderTokensFromText(newText);

      if (onTokensChange) onTokensChange(tokens, newText.trim(), plainText);

      div.innerHTML = "";
      div.appendChild(fragment);

      // Place cursor at the end
      const range = document.createRange();
      const newSel = window.getSelection();
      range.selectNodeContents(div);
      range.collapse(false);
      newSel?.removeAllRanges();
      newSel?.addRange(range);

      setAutocomplete((prev) => ({ ...prev, show: false }));
      div.focus();
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
          </div>
        )}
      </div>
    );
  },
);

SmartEditableInput.displayName = "SmartEditableInput";

export default SmartEditableInput;
