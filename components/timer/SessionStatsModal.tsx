"use client";

import { useState, useMemo } from "react";
import { X, Copy, Download } from "lucide-react";
import { TimerRecord } from "../../lib/stats-utils";

interface SessionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TimerRecord[];
  selectedEvent: string;
}

// Map of event IDs to display names
const eventNames: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  minx: "Megaminx",
  skewb: "Skewb",
  clock: "Clock",
  sq1: "Square-1",
  "333bld": "3x3 BLD",
  "444bld": "4x4 BLD",
  "555bld": "5x5 BLD",
  "333mbld": "3x3 MBLD",
  "333fm": "3x3 FM",
};

// Helpers to truncate/round to nearest centisecond (10 ms)
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10;
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10;

// Format milliseconds to string (M:SS.ss or SS.ss)
const formatMs = (ms: number) => {
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
};

// Format date and time
const formatDateTime = (date: Date) => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function SessionStatsModal({
  isOpen,
  onClose,
  history,
  selectedEvent,
}: SessionStatsModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
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

    // Helper to calculate standard deviation for a set of values
    const calculateStdDev = (values: number[]): number | null => {
      if (values.length <= 1) return null;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          (values.length - 1)
      );
    };

    // Current WCA Average of N calculation - returns current average and std dev
    const wcaAverageN = (
      n: number
    ): { avg: number | null; stdDev: number | null } => {
      if (ordered.length < n) return { avg: null, stdDev: null };
      const lastN = ordered.slice(-n);
      const values = lastN.map((r) =>
        isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
      );
      const dnfs = values.filter((v) => !isFinite(v)).length;
      if (dnfs >= 2) return { avg: Infinity, stdDev: null };
      const sorted = [...values].sort((a, b) => a - b);
      sorted.shift();
      sorted.pop();
      const finiteValues = sorted.filter((v) => isFinite(v));
      const sum = finiteValues.reduce((acc, v) => acc + v, 0);
      const avg = roundToCentisMs(sum / (n - 2));
      const stdDev = calculateStdDev(finiteValues);
      return { avg, stdDev: stdDev ? roundToCentisMs(stdDev) : null };
    };

    // Best WCA Average of N - checks all rolling windows
    const bestWcaAverageN = (
      n: number
    ): { avg: number | null; stdDev: number | null } => {
      if (ordered.length < n) return { avg: null, stdDev: null };

      let best: number | null = null;
      let bestStdDev: number | null = null;

      for (let i = 0; i <= ordered.length - n; i++) {
        const window = ordered.slice(i, i + n);
        const values = window.map((r) =>
          isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
        );
        const dnfs = values.filter((v) => !isFinite(v)).length;

        if (dnfs >= 2) continue; // Skip DNF averages

        const sorted = [...values].sort((a, b) => a - b);
        sorted.shift();
        sorted.pop();
        const finiteValues = sorted.filter((v) => isFinite(v));
        const sum = finiteValues.reduce((acc, v) => acc + v, 0);
        const avg = roundToCentisMs(sum / (n - 2));

        if (best === null || avg < best) {
          best = avg;
          bestStdDev = calculateStdDev(finiteValues);
          bestStdDev = bestStdDev ? roundToCentisMs(bestStdDev) : null;
        }
      }

      return { avg: best, stdDev: bestStdDev };
    };

    const ao5CurrentResult = wcaAverageN(5);
    const ao5BestResult = bestWcaAverageN(5);
    const ao12CurrentResult = wcaAverageN(12);
    const ao12BestResult = bestWcaAverageN(12);
    const ao100CurrentResult = wcaAverageN(100);
    const ao100BestResult = bestWcaAverageN(100);

    // Current Mean of 3
    const mo3CurrentResult = (() => {
      if (ordered.length < 3)
        return { mean: null as number | null, stdDev: null as number | null };
      const last3 = ordered.slice(-3);
      const values = last3.map((r) =>
        isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
      );
      if (values.some((v) => !isFinite(v)))
        return { mean: Infinity, stdDev: null };
      const sum = values.reduce((acc, v) => acc + v, 0);
      const mean = roundToCentisMs(sum / 3);
      const stdDev = calculateStdDev(values);
      return { mean, stdDev: stdDev ? roundToCentisMs(stdDev) : null };
    })();

    // Best Mean of 3 - checks all rolling windows
    const mo3BestResult = (() => {
      if (ordered.length < 3)
        return { mean: null as number | null, stdDev: null as number | null };

      let best: number | null = null;
      let bestStdDev: number | null = null;

      for (let i = 0; i <= ordered.length - 3; i++) {
        const window = ordered.slice(i, i + 3);
        const values = window.map((r) =>
          isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity
        );

        if (values.some((v) => !isFinite(v))) continue; // Skip if any DNF

        const sum = values.reduce((acc, v) => acc + v, 0);
        const mean = roundToCentisMs(sum / 3);

        if (best === null || mean < best) {
          best = mean;
          bestStdDev = calculateStdDev(values);
          bestStdDev = bestStdDev ? roundToCentisMs(bestStdDev) : null;
        }
      }

      return { mean: best, stdDev: bestStdDev };
    })();

    // Session mean
    const mean = truncatedSingles.length
      ? roundToCentisMs(
          truncatedSingles.reduce((a, b) => a + b, 0) / truncatedSingles.length
        )
      : null;

    // Session standard deviation
    const sessionStdDev =
      truncatedSingles.length > 1 && mean != null
        ? roundToCentisMs(
            Math.sqrt(
              truncatedSingles.reduce(
                (sum, t) => sum + Math.pow(t - mean, 2),
                0
              ) /
                (truncatedSingles.length - 1)
            )
          )
        : null;

    const dnfCount = ordered.filter((r) => !isFinite(r.finalTime)).length;

    return {
      ordered,
      bestTime,
      worstTime,
      ao5Current: ao5CurrentResult.avg,
      ao5CurrentStdDev: ao5CurrentResult.stdDev,
      ao5Best: ao5BestResult.avg,
      ao5BestStdDev: ao5BestResult.stdDev,
      ao12Current: ao12CurrentResult.avg,
      ao12CurrentStdDev: ao12CurrentResult.stdDev,
      ao12Best: ao12BestResult.avg,
      ao12BestStdDev: ao12BestResult.stdDev,
      ao100Current: ao100CurrentResult.avg,
      ao100CurrentStdDev: ao100CurrentResult.stdDev,
      ao100Best: ao100BestResult.avg,
      ao100BestStdDev: ao100BestResult.stdDev,
      mo3Current: mo3CurrentResult.mean,
      mo3CurrentStdDev: mo3CurrentResult.stdDev,
      mo3Best: mo3BestResult.mean,
      mo3BestStdDev: mo3BestResult.stdDev,
      mean,
      sessionStdDev,
      dnfCount,
      totalSolves: ordered.length,
    };
  }, [history, selectedEvent]);

  // Generate session stats text
  const generateStatsText = () => {
    const eventName = eventNames[selectedEvent] || selectedEvent;
    const now = new Date();

    let text = `Generated By CubeDev on ${formatDateTime(now)}\n`;
    text += `solves/total: ${stats.totalSolves}/${stats.totalSolves}\n\n`;

    text += `single\n`;
    text += `    best: ${stats.bestTime !== null ? formatMs(stats.bestTime) : "-"}\n`;
    text += `    worst: ${stats.worstTime !== null ? formatMs(stats.worstTime) : "-"}\n\n`;

    text += `mean of 3\n`;
    text += `    current: ${stats.mo3Current !== null ? (isFinite(stats.mo3Current) ? formatMs(stats.mo3Current) : "DNF") : "-"}`;
    if (
      stats.mo3Current !== null &&
      isFinite(stats.mo3Current) &&
      stats.mo3CurrentStdDev !== null
    ) {
      text += ` (σ = ${formatMs(stats.mo3CurrentStdDev)})`;
    }
    text += `\n    best: ${stats.mo3Best !== null ? (isFinite(stats.mo3Best) ? formatMs(stats.mo3Best) : "DNF") : "-"}`;
    if (
      stats.mo3Best !== null &&
      isFinite(stats.mo3Best) &&
      stats.mo3BestStdDev !== null
    ) {
      text += ` (σ = ${formatMs(stats.mo3BestStdDev)})`;
    }
    text += `\n\n`;

    text += `avg of 5\n`;
    text += `    current: ${stats.ao5Current !== null ? (isFinite(stats.ao5Current) ? formatMs(stats.ao5Current) : "DNF") : "-"}`;
    if (
      stats.ao5Current !== null &&
      isFinite(stats.ao5Current) &&
      stats.ao5CurrentStdDev !== null
    ) {
      text += ` (σ = ${formatMs(stats.ao5CurrentStdDev)})`;
    }
    text += `\n    best: ${stats.ao5Best !== null ? (isFinite(stats.ao5Best) ? formatMs(stats.ao5Best) : "DNF") : "-"}`;
    if (
      stats.ao5Best !== null &&
      isFinite(stats.ao5Best) &&
      stats.ao5BestStdDev !== null
    ) {
      text += ` (σ = ${formatMs(stats.ao5BestStdDev)})`;
    }
    text += `\n\n`;

    text += `avg of 12\n`;
    text += `    current: ${stats.ao12Current !== null ? (isFinite(stats.ao12Current) ? formatMs(stats.ao12Current) : "DNF") : "-"}`;
    if (
      stats.ao12Current !== null &&
      isFinite(stats.ao12Current) &&
      stats.ao12CurrentStdDev !== null
    ) {
      text += ` (σ = ${formatMs(stats.ao12CurrentStdDev)})`;
    }
    text += `\n    best: ${stats.ao12Best !== null ? (isFinite(stats.ao12Best) ? formatMs(stats.ao12Best) : "DNF") : "-"}`;
    if (
      stats.ao12Best !== null &&
      isFinite(stats.ao12Best) &&
      stats.ao12BestStdDev !== null
    ) {
      text += ` (σ = ${formatMs(stats.ao12BestStdDev)})`;
    }
    text += `\n\n`;

    if (stats.ao100Current !== null) {
      text += `avg of 100\n`;
      text += `    current: ${isFinite(stats.ao100Current) ? formatMs(stats.ao100Current) : "DNF"}`;
      if (isFinite(stats.ao100Current) && stats.ao100CurrentStdDev !== null) {
        text += ` (σ = ${formatMs(stats.ao100CurrentStdDev)})`;
      }
      text += `\n    best: ${stats.ao100Best !== null && isFinite(stats.ao100Best) ? formatMs(stats.ao100Best) : "DNF"}`;
      if (
        stats.ao100Best !== null &&
        isFinite(stats.ao100Best) &&
        stats.ao100BestStdDev !== null
      ) {
        text += ` (σ = ${formatMs(stats.ao100BestStdDev)})`;
      }
      text += `\n\n`;
    }

    text += `Average: ${stats.mean !== null ? formatMs(stats.mean) : "-"}`;
    if (stats.sessionStdDev !== null) {
      text += ` (σ = ${formatMs(stats.sessionStdDev)})`;
    }
    text += `\n`;
    text += `Mean: ${stats.mean !== null ? formatMs(stats.mean) : "-"}\n\n`;

    text += `Time List:\n`;
    stats.ordered.forEach((record, index) => {
      const solveNumber = index + 1;
      text += `${solveNumber}. ${formatMs(record.finalTime)}${record.penalty === "+2" ? "+" : ""}    ${record.scramble}\n`;
    });

    return text;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const text = generateStatsText();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    const eventName = eventNames[selectedEvent] || selectedEvent;
    const now = new Date();

    let csv = `No.,Time,Penalty,Event,Scramble,Date\n`;

    stats.ordered.forEach((record, index) => {
      const solveNumber = index + 1;
      const time = formatMs(record.time);
      const penalty = record.penalty === "none" ? "" : record.penalty;
      const scramble = `"${record.scramble.replace(/"/g, '""')}"`;
      const date = formatDateTime(record.timestamp);

      csv += `${solveNumber},${time},${penalty},${eventName},${scramble},${date}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cubedev-session-${selectedEvent}-${now.getTime()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const eventName = eventNames[selectedEvent] || selectedEvent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Current Session Statistics
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Session Info */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
            <div className="text-sm text-[var(--text-secondary)] font-mono">
              <div>Generated By CubeDev on {formatDateTime(new Date())}</div>
              <div>
                solves/total: {stats.totalSolves}/{stats.totalSolves}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="space-y-3">
            {/* Single */}
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                Single
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <span className="text-[var(--text-secondary)]">best: </span>
                  <span className="text-[var(--primary)] font-semibold">
                    {stats.bestTime !== null ? formatMs(stats.bestTime) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">worst: </span>
                  <span className="text-[var(--error)] font-semibold">
                    {stats.worstTime !== null ? formatMs(stats.worstTime) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mean of 3 */}
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                Mean of 3
              </div>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-[var(--text-secondary)]">
                    current:{" "}
                  </span>
                  <span
                    className={`font-semibold ${stats.mo3Current === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                  >
                    {stats.mo3Current !== null
                      ? isFinite(stats.mo3Current)
                        ? formatMs(stats.mo3Current)
                        : "DNF"
                      : "-"}
                  </span>
                  {stats.mo3Current !== null &&
                    isFinite(stats.mo3Current) &&
                    stats.mo3CurrentStdDev !== null && (
                      <span className="text-[var(--text-muted)] ml-1">
                        (σ = {formatMs(stats.mo3CurrentStdDev)})
                      </span>
                    )}
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">best: </span>
                  <span
                    className={`font-semibold ${stats.mo3Best === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                  >
                    {stats.mo3Best !== null
                      ? isFinite(stats.mo3Best)
                        ? formatMs(stats.mo3Best)
                        : "DNF"
                      : "-"}
                  </span>
                  {stats.mo3Best !== null &&
                    isFinite(stats.mo3Best) &&
                    stats.mo3BestStdDev !== null && (
                      <span className="text-[var(--text-muted)] ml-1">
                        (σ = {formatMs(stats.mo3BestStdDev)})
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Avg of 5 */}
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                Avg of 5
              </div>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-[var(--text-secondary)]">
                    current:{" "}
                  </span>
                  <span
                    className={`font-semibold ${stats.ao5Current === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                  >
                    {stats.ao5Current !== null
                      ? isFinite(stats.ao5Current)
                        ? formatMs(stats.ao5Current)
                        : "DNF"
                      : "-"}
                  </span>
                  {stats.ao5Current !== null &&
                    isFinite(stats.ao5Current) &&
                    stats.ao5CurrentStdDev !== null && (
                      <span className="text-[var(--text-muted)] ml-1">
                        (σ = {formatMs(stats.ao5CurrentStdDev)})
                      </span>
                    )}
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">best: </span>
                  <span
                    className={`font-semibold ${stats.ao5Best === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                  >
                    {stats.ao5Best !== null
                      ? isFinite(stats.ao5Best)
                        ? formatMs(stats.ao5Best)
                        : "DNF"
                      : "-"}
                  </span>
                  {stats.ao5Best !== null &&
                    isFinite(stats.ao5Best) &&
                    stats.ao5BestStdDev !== null && (
                      <span className="text-[var(--text-muted)] ml-1">
                        (σ = {formatMs(stats.ao5BestStdDev)})
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Avg of 12 */}
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                Avg of 12
              </div>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-[var(--text-secondary)]">
                    current:{" "}
                  </span>
                  <span
                    className={`font-semibold ${stats.ao12Current === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                  >
                    {stats.ao12Current !== null
                      ? isFinite(stats.ao12Current)
                        ? formatMs(stats.ao12Current)
                        : "DNF"
                      : "-"}
                  </span>
                  {stats.ao12Current !== null &&
                    isFinite(stats.ao12Current) &&
                    stats.ao12CurrentStdDev !== null && (
                      <span className="text-[var(--text-muted)] ml-1">
                        (σ = {formatMs(stats.ao12CurrentStdDev)})
                      </span>
                    )}
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">best: </span>
                  <span
                    className={`font-semibold ${stats.ao12Best === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                  >
                    {stats.ao12Best !== null
                      ? isFinite(stats.ao12Best)
                        ? formatMs(stats.ao12Best)
                        : "DNF"
                      : "-"}
                  </span>
                  {stats.ao12Best !== null &&
                    isFinite(stats.ao12Best) &&
                    stats.ao12BestStdDev !== null && (
                      <span className="text-[var(--text-muted)] ml-1">
                        (σ = {formatMs(stats.ao12BestStdDev)})
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Avg of 100 (if available) */}
            {stats.ao100Current !== null && (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                  Avg of 100
                </div>
                <div className="space-y-1 text-sm font-mono">
                  <div>
                    <span className="text-[var(--text-secondary)]">
                      current:{" "}
                    </span>
                    <span
                      className={`font-semibold ${stats.ao100Current === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                    >
                      {isFinite(stats.ao100Current)
                        ? formatMs(stats.ao100Current)
                        : "DNF"}
                    </span>
                    {isFinite(stats.ao100Current) &&
                      stats.ao100CurrentStdDev !== null && (
                        <span className="text-[var(--text-muted)] ml-1">
                          (σ = {formatMs(stats.ao100CurrentStdDev)})
                        </span>
                      )}
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">best: </span>
                    <span
                      className={`font-semibold ${stats.ao100Best === Infinity ? "text-[var(--error)]" : "text-[var(--primary)]"}`}
                    >
                      {stats.ao100Best !== null && isFinite(stats.ao100Best)
                        ? formatMs(stats.ao100Best)
                        : "DNF"}
                    </span>
                    {stats.ao100Best !== null &&
                      isFinite(stats.ao100Best) &&
                      stats.ao100BestStdDev !== null && (
                        <span className="text-[var(--text-muted)] ml-1">
                          (σ = {formatMs(stats.ao100BestStdDev)})
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Session Average and Mean */}
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <span className="text-[var(--text-secondary)]">
                    Average:{" "}
                  </span>
                  <span className="text-[var(--accent)] font-semibold">
                    {stats.mean !== null ? formatMs(stats.mean) : "-"}
                  </span>
                  {stats.sessionStdDev !== null && (
                    <span className="text-[var(--text-muted)] ml-1">
                      (σ = {formatMs(stats.sessionStdDev)})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Mean: </span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {stats.mean !== null ? formatMs(stats.mean) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time List */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-3">
              Time List
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.ordered.map((record, index) => {
                const solveNumber = index + 1;
                return (
                  <div
                    key={record.id}
                    className="bg-[var(--background)] rounded p-2 border border-[var(--border)] text-sm font-mono"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--text-muted)] min-w-[2rem]">
                        {solveNumber}.
                      </span>
                      <span
                        className={`font-semibold min-w-[4rem] ${
                          record.penalty === "DNF"
                            ? "text-[var(--error)]"
                            : record.penalty === "+2"
                              ? "text-yellow-400"
                              : "text-[var(--text-primary)]"
                        }`}
                      >
                        {formatMs(record.finalTime)}
                        {record.penalty === "+2" && "+"}
                      </span>
                      <span className="text-[var(--text-secondary)] flex-1 break-all">
                        {record.scramble}
                      </span>
                    </div>
                  </div>
                );
              })}
              {stats.totalSolves === 0 && (
                <div className="text-center py-4 text-[var(--text-muted)]">
                  No solves in this session
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copySuccess ? "Copied!" : "Copy"}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded font-medium transition-colors sm:flex-none"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}