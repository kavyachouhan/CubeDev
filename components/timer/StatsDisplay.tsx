"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { TimerRecord } from "../../lib/stats-utils";
import SessionStatsModal from "./SessionStatsModal";

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);
  return [state, setState] as const;
}

interface StatsDisplayProps {
  history: TimerRecord[];
  selectedEvent: string;
}

// Helpers to truncate/round to nearest centisecond (10 ms)
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10; // singles: truncate
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10; // averages: round

// Format milliseconds to string (M:SS.ss or SS.ss)
const formatMs = (ms: number) => {
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
};

export default function StatsDisplay({
  history,
  selectedEvent,
}: StatsDisplayProps) {
  const [showStats, setShowStats] = usePersistentBool(
    "cubelab-stats-display-expanded",
    true
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter history to selected event
  const eventHistory = history.filter((r) => r.event === selectedEvent);

  // Order by timestamp ascending
  const ordered = [...eventHistory].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Extract truncated singles (ignore DNFs) for best/worst/mean calculations
  const truncatedSingles = ordered
    .filter((r) => isFinite(r.finalTime))
    .map((r) => truncToCentisMs(r.finalTime));

  const bestTime = truncatedSingles.length
    ? Math.min(...truncatedSingles)
    : null;
  const worstTime = truncatedSingles.length
    ? Math.max(...truncatedSingles)
    : null;

  // WCA Average of N calculation (N=5 or 12)
  const wcaAverageN = (n: number): number | null => {
    if (ordered.length < n) return null;

    // Last N consecutive results (DNFs included)
    const lastN = ordered.slice(-n);

    // Use truncated singles for calculation
    const values = lastN.map((r) =>
      isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
    );

    const dnfs = values.filter((v) => !isFinite(v)).length;
    if (dnfs >= 2) return Infinity; // average is DNF if 2 or more DNFs

    // Sort values to drop best and worst
    const sorted = [...values].sort((a, b) => a - b);

    // Drop best and worst
    sorted.shift(); // drop best
    sorted.pop(); // drop worst

    // Calculate average of remaining
    const sum = sorted.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0);
    const avg = sum / (n - 2);

    // Average of N is rounded to 0.01 s
    return roundToCentisMs(avg);
  };

  const ao5 = wcaAverageN(5);
  const ao12 = wcaAverageN(12);

  // Current mean of 3 (rounded to 0.01 s for display)
  const mo3 = (() => {
    if (ordered.length < 3) return null;

    // Last 3 consecutive results (DNFs included)
    const last3 = ordered.slice(-3);

    // Use truncated singles for calculation
    const values = last3.map((r) =>
      isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
    );

    // If any DNF, mean of 3 is DNF
    if (values.some((v) => !isFinite(v))) return Infinity;

    // Calculate mean of 3
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / 3;

    // Mean of 3 is rounded to 0.01 s
    return roundToCentisMs(mean);
  })();

  // Session mean (rounded to 0.01 s for display)
  const mean = truncatedSingles.length
    ? roundToCentisMs(
        truncatedSingles.reduce((a, b) => a + b, 0) / truncatedSingles.length
      )
    : null;

  // Standard deviation (Rounded to 0.01 s for display)
  const standardDeviation =
    truncatedSingles.length > 1 && mean != null
      ? Math.sqrt(
          truncatedSingles.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) /
            (truncatedSingles.length - 1)
        )
      : null;

  const dnfCount = ordered.filter((r) => !isFinite(r.finalTime)).length;
  const currentSessionSolves = ordered.length;

  return (
    <>
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
            title={showStats ? "Hide statistics" : "Show statistics"}
          >
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
              Statistics
            </h3>
            {showStats ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
              title="View session statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
              title={showStats ? "Hide statistics" : "Show statistics"}
            >
              {showStats ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showStats && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Best Single
                </div>
                <div className="text-lg font-bold text-[var(--primary)] font-mono">
                  {bestTime != null ? formatMs(bestTime) : "-"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Current Mo3
                </div>
                <div
                  className={`text-lg font-bold font-mono ${mo3 === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                >
                  {mo3 == null ? "-" : isFinite(mo3) ? formatMs(mo3) : "DNF"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Current Ao5
                </div>
                <div
                  className={`text-lg font-bold font-mono ${ao5 === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                >
                  {ao5 == null ? "-" : isFinite(ao5) ? formatMs(ao5) : "DNF"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Worst Single
                </div>
                <div className="text-lg font-bold text-[var(--error)] font-mono">
                  {worstTime != null ? formatMs(worstTime) : "-"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Current Ao12
                </div>
                <div
                  className={`text-lg font-bold font-mono ${ao12 === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                >
                  {ao12 == null ? "-" : isFinite(ao12) ? formatMs(ao12) : "DNF"}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Session Mean
                </div>
                <div className="text-lg font-bold text-[var(--accent)] font-mono">
                  {mean != null ? formatMs(mean) : "-"}
                </div>
              </div>
            </div>

            {/* Total solves */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Total Solves
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
                  {currentSessionSolves}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-[var(--border)]">
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  Standard Deviation
                </div>
                <div className="text-m font-medium text-[var(--text-secondary)] font-mono">
                  {standardDeviation != null
                    ? `± ${formatMs(roundToCentisMs(standardDeviation))}`
                    : "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                  DNFs
                </div>
                <div className="text-m font-medium text-[var(--error)] font-mono">
                  {dnfCount}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <SessionStatsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        history={history}
        selectedEvent={selectedEvent}
      />
    </>
  );
}