"use client";

import { useState, useMemo } from "react";
import {
  History,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Zap,
  Target,
  Shuffle,
} from "lucide-react";
import SessionTypeFilter from "./SessionTypeFilter";

interface PracticeSession {
  _id: string;
  sessionType: "recognition" | "execution" | "drill" | "mixed";
  casesReviewed: number;
  averageRecognitionTime?: number;
  averageExecutionTime?: number;
  accuracyRate: number;
  duration: number;
  createdAt: number;
}

interface SessionHistoryProps {
  sessions: PracticeSession[];
  maxSessions?: number;
}

// Get icon and styles based on session type
function getSessionTypeConfig(type: string) {
  const config: Record<string, { icon: typeof Eye; bg: string; text: string }> =
    {
      recognition: {
        icon: Eye,
        bg: "bg-purple-500/10",
        text: "text-purple-500 dark:text-purple-400",
      },
      execution: {
        icon: Zap,
        bg: "bg-green-500/10",
        text: "text-green-500 dark:text-green-400",
      },
      drill: {
        icon: Target,
        bg: "bg-orange-500/10",
        text: "text-orange-500 dark:text-orange-400",
      },
      mixed: {
        icon: Shuffle,
        bg: "bg-blue-500/10",
        text: "text-blue-500 dark:text-blue-400",
      },
    };
  return config[type] || config.mixed;
}

export default function SessionHistory({
  sessions,
  maxSessions = 10,
}: SessionHistoryProps) {
  const [selectedType, setSelectedType] = useState<
    "all" | "recognition" | "execution" | "drill" | "mixed"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter sessions based on selected type
  const filteredSessions = useMemo(() => {
    if (selectedType === "all") {
      return sessions;
    }
    return sessions.filter((s) => s.sessionType === selectedType);
  }, [sessions, selectedType]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / maxSessions);
  const startIndex = (currentPage - 1) * maxSessions;
  const endIndex = startIndex + maxSessions;
  const displaySessions = filteredSessions.slice(startIndex, endIndex);

  // Reset to first page when session type changes
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedType]);

  const formatTime = (ms: number): string => {
    return (ms / 1000).toFixed(1) + "s";
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (sessions.length === 0) {
    return (
      <div className="timer-card text-center py-8">
        <History className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-muted)]">
          No practice sessions yet. Start practicing to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="timer-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
            Practice History
          </h3>
        </div>
        <SessionTypeFilter
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
      </div>

      {displaySessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--text-muted)]">
            No {selectedType} sessions found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySessions.map((session) => {
            const config = getSessionTypeConfig(session.sessionType);
            const IconComponent = config.icon;

            return (
              <div
                key={session._id}
                className="p-4 rounded-lg bg-[var(--surface-elevated)] hover:border-[var(--border-hover)] border border-transparent transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Session Info */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${config.bg}`}>
                      <IconComponent className={`w-5 h-5 ${config.text}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)] capitalize">
                        {session.sessionType} Practice
                      </div>
                      <div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <span>
                          {new Date(session.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(session.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Session Stats */}
                  <div className="flex gap-6 sm:gap-8">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
                        {session.casesReviewed}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Cases
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
                        {session.accuracyRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Accuracy
                      </div>
                    </div>
                    {session.averageRecognitionTime && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
                          {formatTime(session.averageRecognitionTime)}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          Avg Time
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-muted)]">
            Showing {startIndex + 1}-
            {Math.min(endIndex, filteredSessions.length)} of{" "}
            {filteredSessions.length} sessions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--text-primary)]" />
            </button>
            <span className="text-sm text-[var(--text-primary)] min-w-[80px] text-center font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-[var(--text-primary)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}