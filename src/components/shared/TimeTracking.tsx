"use client";

import { useState, useEffect } from "react";
import { TimeEntry } from "@/types/todo";
import { CloseIcon, PlaySolidIcon, StopSolidIcon } from "@/components/shared/Icons";

interface TimeTrackingProps {
  entries: TimeEntry[];
  totalMinutes: number;
  isTracking: boolean;
  activeEntry?: TimeEntry;
  onStart: (note?: string) => void;
  onStop: () => void;
  onAddManual: (minutes: number, note?: string) => void;
  onDelete: (entryId: string) => void;
  readOnly?: boolean;
}

export function TimeTracking({
  entries,
  totalMinutes,
  isTracking,
  activeEntry,
  onStart,
  onStop,
  onAddManual,
  onDelete,
  readOnly = false,
}: TimeTrackingProps) {
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (isTracking && activeEntry) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - activeEntry.startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [isTracking, activeEntry]);

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatElapsed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddManual = () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalMins = hours * 60 + minutes;
    if (totalMins > 0) {
      onAddManual(totalMins, manualNote || undefined);
      setManualHours("");
      setManualMinutes("");
      setManualNote("");
      setShowAddManual(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Total time and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total: {formatDuration(totalMinutes)}
          </span>
          {isTracking && (
            <span className="text-sm text-green-600 dark:text-green-400 animate-pulse">
              ⏱️ {formatElapsed(elapsedTime)}
            </span>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {isTracking ? (
              <button
                onClick={onStop}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <StopSolidIcon className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => onStart()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <PlaySolidIcon className="w-4 h-4" />
                Start
              </button>
            )}
            <button
              onClick={() => setShowAddManual(!showAddManual)}
              className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg transition-colors"
            >
              + Manual
            </button>
          </div>
        )}
      </div>

      {/* Add manual time form */}
      {showAddManual && !readOnly && (
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Hours"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
            <span className="text-sm text-zinc-500">h</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Min"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              className="w-20 px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
            <span className="text-sm text-zinc-500">m</span>
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddManual(false)}
              className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddManual}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Time entries list */}
      {entries.length > 0 && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Entries</h5>
          <ul className="space-y-1">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-1.5 px-2 bg-zinc-50 dark:bg-zinc-800/50 rounded group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {entry.endTime ? (
                      formatDuration(entry.duration || 0)
                    ) : (
                      <span className="text-green-600 dark:text-green-400">In progress...</span>
                    )}
                  </span>
                  {entry.note && <span className="text-xs text-zinc-500 dark:text-zinc-400">— {entry.note}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(entry.startTime).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {!readOnly && entry.endTime && (
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete entry"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
