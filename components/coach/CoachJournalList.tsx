"use client";

import { useState } from "react";
import {
  BookOpen,
  Clock,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Battery,
  Target,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface JournalEntry {
  _id: Id<"coachJournalEntries">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  entryDate: number;
  solveCount?: number;
  sessionAverage?: number;
  bestSingle?: number;
  practiceMinutes?: number;
  customAverage?: number;
  customSolveCount?: number;
  mood: "great" | "good" | "okay" | "frustrated" | "tired";
  wentWell?: string;
  challenges?: string;
  notes?: string;
  focusAreas?: string[];
  completedTaskIndices?: number[];
  mediaUrls?: string[];
  mediaFileIds?: string[];
  mediaTypes?: string[];
  createdAt: number;
}

interface CoachJournalListProps {
  entries: JournalEntry[];
  onEntryClick?: (entry: JournalEntry) => void;
  onNewEntry?: () => void;
}

const moodIcons: Record<string, React.ElementType> = {
  great: Smile,
  good: Smile,
  okay: Meh,
  frustrated: Frown,
  tired: Battery,
};

const moodColors: Record<string, string> = {
  great: "text-(--success)",
  good: "text-(--primary)",
  okay: "text-(--warning)",
  frustrated: "text-(--error)",
  tired: "text-(--text-muted)",
};

const moodBgColors: Record<string, string> = {
  great: "bg-(--success)/10",
  good: "bg-(--primary)/10",
  okay: "bg-(--warning)/10",
  frustrated: "bg-(--error)/10",
  tired: "bg-(--surface-elevated)",
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

export default function CoachJournalList({
  entries,
  onEntryClick,
  onNewEntry,
}: CoachJournalListProps) {
  if (entries.length === 0) {
    return (
      <div className="timer-card text-center py-12">
        <BookOpen className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
        <h3 className="font-semibold text-(--text-primary) mb-2">
          No Journal Entries Yet
        </h3>
        <p className="text-sm text-(--text-muted) mb-4">
          Start tracking your progress by adding your first journal entry.
        </p>
        {onNewEntry && (
          <button
            onClick={onNewEntry}
            className="px-6 py-2.5 bg-(--primary) text-white rounded-lg font-medium hover:bg-(--primary-hover) transition-colors"
          >
            Add Entry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const MoodIcon = moodIcons[entry.mood] || Meh;

        return (
          <button
            key={entry._id}
            onClick={() => onEntryClick?.(entry)}
            className="timer-card w-full flex items-center gap-4 text-left hover:border-(--border-hover) transition-all"
          >
            {/* Mood Icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${moodBgColors[entry.mood]}`}
            >
              <MoodIcon className={`w-5 h-5 ${moodColors[entry.mood]}`} />
            </div>

            {/* Entry Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-(--text-primary)">
                  {formatDate(entry.entryDate)}
                </span>
                {entry.focusAreas && entry.focusAreas.length > 0 && (
                  <div className="flex gap-1">
                    {entry.focusAreas.slice(0, 2).map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 text-xs bg-(--surface) text-(--text-muted) rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {entry.focusAreas.length > 2 && (
                      <span className="text-xs text-(--text-muted)">
                        +{entry.focusAreas.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-(--text-muted)">
                {entry.practiceMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.practiceMinutes} min
                  </span>
                )}
                {entry.solveCount && (
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {entry.solveCount} solves
                  </span>
                )}
                {entry.sessionAverage && (
                  <span className="font-medium text-(--primary)">
                    Avg: {formatTime(entry.sessionAverage)}
                  </span>
                )}
              </div>

              {entry.wentWell && (
                <p className="text-sm text-(--text-secondary) mt-1 truncate">
                  {entry.wentWell}
                </p>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-(--text-muted)" />
          </button>
        );
      })}
    </div>
  );
}