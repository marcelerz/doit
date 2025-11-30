import React, { useRef, forwardRef, useImperativeHandle } from "react";

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
}

export interface SmartEditableInputHandle {
  clear: () => void;
  setValue: (text: string) => void;
}

const SmartEditableInput = forwardRef<SmartEditableInputHandle, SmartEditableInputProps>(
  ({ markers, markerColors = {}, onTokensChange, placeholder, initialValue, onEnterPress }, ref) => {
    const editableRef = useRef<HTMLDivElement>(null);

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
          const value = raw.slice(symbol.length); // remove prefix symbol
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
      range.insertNode(caretMarker);

      const fullText = div.innerText.replace(/\n/g, " ").replace(/\s+/g, " ");
      caretMarker.remove();

      const { fragment, tokens, plainText } = renderTokensFromText(fullText);
      if (onTokensChange) onTokensChange(tokens, fullText.trim(), plainText);

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
      if (e.key === "Enter") {
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

    return (
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
    );
  },
);

SmartEditableInput.displayName = "SmartEditableInput";

export default SmartEditableInput;
