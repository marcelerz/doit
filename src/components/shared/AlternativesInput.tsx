"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface AlternativesInputProps {
  value: string[];
  onChange: (alternatives: string[]) => void;
  label?: string;
  placeholder?: string;
  showPreview?: boolean;
}

export function AlternativesInput({
  value,
  onChange,
  label = "Alternatives",
  placeholder = "Type and press Enter to add",
  showPreview: _showPreview = true,
}: AlternativesInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addAlternative = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeAlternative = (index: number) => {
    const newAlts = value.filter((_, i) => i !== index);
    onChange(newAlts);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      if (inputValue.trim()) {
        e.preventDefault();
        addAlternative(inputValue);
      } else if (e.key === ",") {
        e.preventDefault();
      }
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      // Remove last alternative when backspace is pressed on empty input
      removeAlternative(value.length - 1);
    }
  };

  const handleBlur = () => {
    // Add current input as alternative when focus leaves
    if (inputValue.trim()) {
      addAlternative(inputValue);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{label}</label>
      <div
        onClick={handleContainerClick}
        className="w-full px-2 py-1.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-1.5 items-center min-h-[38px] cursor-text"
      >
        {value.map((alt, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            {alt}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAlternative(idx);
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-0.5"
              aria-label={`Remove ${alt}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none py-0.5"
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Press Enter, Tab, or comma to add
      </p>
    </div>
  );
}
