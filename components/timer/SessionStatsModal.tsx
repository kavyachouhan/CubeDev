"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, Download, Share2, Link, CircleCheck } from "lucide-react";
import { TimerRecord } from "../../lib/stats-utils";
import {
  ExtendedStatsVisibility,
  DEFAULT_EXTENDED_STATS,
} from "./StatsVisibilitySettings";

// Share options for the share menu
interface ShareOption {
  name: string;
  icon: React.ReactNode;
  color: string;
  getUrl: (data: { title: string; text: string }) => string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: "bg-green-500 hover:bg-green-600",
    getUrl: (data) => `https://wa.me/?text=${encodeURIComponent(data.text)}`,
  },
  {
    name: "X",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black",
    getUrl: (data) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}`,
  },
  {
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "bg-blue-600 hover:bg-blue-700",
    getUrl: (data) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(data.text)}`,
  },
  {
    name: "Reddit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    color: "bg-orange-500 hover:bg-orange-600",
    getUrl: (data) => `https://www.reddit.com/submit?title=${encodeURIComponent(data.title)}`,
  },
];

interface SessionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TimerRecord[];
  selectedEvent: string;
  extendedStatsVisibility?: ExtendedStatsVisibility;
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
  extendedStatsVisibility = DEFAULT_EXTENDED_STATS,
}: SessionStatsModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = React.useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShareMenuOpen(false);
      }
    };

    if (shareMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shareMenuOpen]);

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
    const ao25CurrentResult = wcaAverageN(25);
    const ao25BestResult = bestWcaAverageN(25);
    const ao50CurrentResult = wcaAverageN(50);
    const ao50BestResult = bestWcaAverageN(50);
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
      ao25Current: ao25CurrentResult.avg,
      ao25CurrentStdDev: ao25CurrentResult.stdDev,
      ao25Best: ao25BestResult.avg,
      ao25BestStdDev: ao25BestResult.stdDev,
      ao50Current: ao50CurrentResult.avg,
      ao50CurrentStdDev: ao50CurrentResult.stdDev,
      ao50Best: ao50BestResult.avg,
      ao50BestStdDev: ao50BestResult.stdDev,
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

    if (extendedStatsVisibility.ao25 && stats.ao25Current !== null) {
      text += `avg of 25\n`;
      text += `    current: ${isFinite(stats.ao25Current) ? formatMs(stats.ao25Current) : "DNF"}`;
      if (isFinite(stats.ao25Current) && stats.ao25CurrentStdDev !== null) {
        text += ` (σ = ${formatMs(stats.ao25CurrentStdDev)})`;
      }
      text += `\n    best: ${stats.ao25Best !== null && isFinite(stats.ao25Best) ? formatMs(stats.ao25Best) : "DNF"}`;
      if (
        stats.ao25Best !== null &&
        isFinite(stats.ao25Best) &&
        stats.ao25BestStdDev !== null
      ) {
        text += ` (σ = ${formatMs(stats.ao25BestStdDev)})`;
      }
      text += `\n\n`;
    }

    if (extendedStatsVisibility.ao50 && stats.ao50Current !== null) {
      text += `avg of 50\n`;
      text += `    current: ${isFinite(stats.ao50Current) ? formatMs(stats.ao50Current) : "DNF"}`;
      if (isFinite(stats.ao50Current) && stats.ao50CurrentStdDev !== null) {
        text += ` (σ = ${formatMs(stats.ao50CurrentStdDev)})`;
      }
      text += `\n    best: ${stats.ao50Best !== null && isFinite(stats.ao50Best) ? formatMs(stats.ao50Best) : "DNF"}`;
      if (
        stats.ao50Best !== null &&
        isFinite(stats.ao50Best) &&
        stats.ao50BestStdDev !== null
      ) {
        text += ` (σ = ${formatMs(stats.ao50BestStdDev)})`;
      }
      text += `\n\n`;
    }

    if (extendedStatsVisibility.ao100 && stats.ao100Current !== null) {
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
      <div className="relative bg-(--surface) border border-(--border) rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
            Current Session Statistics
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Session Info */}
          <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
            <div className="text-sm text-(--text-secondary) font-mono">
              <div>Generated By CubeDev on {formatDateTime(new Date())}</div>
              <div>
                solves/total: {stats.totalSolves}/{stats.totalSolves}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="space-y-3">
            {/* Single */}
            <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
              <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                Single
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div>
                  <span className="text-(--text-secondary)">best: </span>
                  <span className="text-(--primary) font-semibold">
                    {stats.bestTime !== null ? formatMs(stats.bestTime) : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-(--text-secondary)">worst: </span>
                  <span className="text-(--error) font-semibold">
                    {stats.worstTime !== null ? formatMs(stats.worstTime) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mean of 3 */}
            <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
              <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                Mean of 3
              </div>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-(--text-secondary)">
                    current:{" "}
                  </span>
                  <span
                    className={`font-semibold ${stats.mo3Current === Infinity ? "text-(--error)" : "text-(--primary)"}`}
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
                      <span className="text-(--text-muted) ml-1">
                        (σ = {formatMs(stats.mo3CurrentStdDev)})
                      </span>
                    )}
                </div>
                <div>
                  <span className="text-(--text-secondary)">best: </span>
                  <span
                    className={`font-semibold ${stats.mo3Best === Infinity ? "text-(--error)" : "text-(--primary)"}`}
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
                      <span className="text-(--text-muted) ml-1">
                        (σ = {formatMs(stats.mo3BestStdDev)})
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Avg of 5 */}
            <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
              <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                Avg of 5
              </div>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-(--text-secondary)">
                    current:{" "}
                  </span>
                  <span
                    className={`font-semibold ${stats.ao5Current === Infinity ? "text-(--error)" : "text-(--primary)"}`}
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
                      <span className="text-(--text-muted) ml-1">
                        (σ = {formatMs(stats.ao5CurrentStdDev)})
                      </span>
                    )}
                </div>
                <div>
                  <span className="text-(--text-secondary)">best: </span>
                  <span
                    className={`font-semibold ${stats.ao5Best === Infinity ? "text-(--error)" : "text-(--primary)"}`}
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
                      <span className="text-(--text-muted) ml-1">
                        (σ = {formatMs(stats.ao5BestStdDev)})
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Avg of 12 */}
            <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
              <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                Avg of 12
              </div>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <span className="text-(--text-secondary)">
                    current:{" "}
                  </span>
                  <span
                    className={`font-semibold ${stats.ao12Current === Infinity ? "text-(--error)" : "text-(--primary)"}`}
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
                      <span className="text-(--text-muted) ml-1">
                        (σ = {formatMs(stats.ao12CurrentStdDev)})
                      </span>
                    )}
                </div>
                <div>
                  <span className="text-(--text-secondary)">best: </span>
                  <span
                    className={`font-semibold ${stats.ao12Best === Infinity ? "text-(--error)" : "text-(--primary)"}`}
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
                      <span className="text-(--text-muted) ml-1">
                        (σ = {formatMs(stats.ao12BestStdDev)})
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Avg of 25 (if enabled and available) */}
            {extendedStatsVisibility.ao25 && stats.ao25Current !== null && (
              <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
                <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                  Avg of 25
                </div>
                <div className="space-y-1 text-sm font-mono">
                  <div>
                    <span className="text-(--text-secondary)">
                      current:{" "}
                    </span>
                    <span
                      className={`font-semibold ${stats.ao25Current === Infinity ? "text-(--error)" : "text-(--primary)"}`}
                    >
                      {isFinite(stats.ao25Current)
                        ? formatMs(stats.ao25Current)
                        : "DNF"}
                    </span>
                    {isFinite(stats.ao25Current) &&
                      stats.ao25CurrentStdDev !== null && (
                        <span className="text-(--text-muted) ml-1">
                          (σ = {formatMs(stats.ao25CurrentStdDev)})
                        </span>
                      )}
                  </div>
                  <div>
                    <span className="text-(--text-secondary)">best: </span>
                    <span
                      className={`font-semibold ${stats.ao25Best === Infinity ? "text-(--error)" : "text-(--primary)"}`}
                    >
                      {stats.ao25Best !== null && isFinite(stats.ao25Best)
                        ? formatMs(stats.ao25Best)
                        : "DNF"}
                    </span>
                    {stats.ao25Best !== null &&
                      isFinite(stats.ao25Best) &&
                      stats.ao25BestStdDev !== null && (
                        <span className="text-(--text-muted) ml-1">
                          (σ = {formatMs(stats.ao25BestStdDev)})
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Avg of 50 (if enabled and available) */}
            {extendedStatsVisibility.ao50 && stats.ao50Current !== null && (
              <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
                <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                  Avg of 50
                </div>
                <div className="space-y-1 text-sm font-mono">
                  <div>
                    <span className="text-(--text-secondary)">
                      current:{" "}
                    </span>
                    <span
                      className={`font-semibold ${stats.ao50Current === Infinity ? "text-(--error)" : "text-(--primary)"}`}
                    >
                      {isFinite(stats.ao50Current)
                        ? formatMs(stats.ao50Current)
                        : "DNF"}
                    </span>
                    {isFinite(stats.ao50Current) &&
                      stats.ao50CurrentStdDev !== null && (
                        <span className="text-(--text-muted) ml-1">
                          (σ = {formatMs(stats.ao50CurrentStdDev)})
                        </span>
                      )}
                  </div>
                  <div>
                    <span className="text-(--text-secondary)">best: </span>
                    <span
                      className={`font-semibold ${stats.ao50Best === Infinity ? "text-(--error)" : "text-(--primary)"}`}
                    >
                      {stats.ao50Best !== null && isFinite(stats.ao50Best)
                        ? formatMs(stats.ao50Best)
                        : "DNF"}
                    </span>
                    {stats.ao50Best !== null &&
                      isFinite(stats.ao50Best) &&
                      stats.ao50BestStdDev !== null && (
                        <span className="text-(--text-muted) ml-1">
                          (σ = {formatMs(stats.ao50BestStdDev)})
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Avg of 100 (if enabled and available) */}
            {extendedStatsVisibility.ao100 && stats.ao100Current !== null && (
              <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
                <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                  Avg of 100
                </div>
                <div className="space-y-1 text-sm font-mono">
                  <div>
                    <span className="text-(--text-secondary)">
                      current:{" "}
                    </span>
                    <span
                      className={`font-semibold ${stats.ao100Current === Infinity ? "text-(--error)" : "text-(--primary)"}`}
                    >
                      {isFinite(stats.ao100Current)
                        ? formatMs(stats.ao100Current)
                        : "DNF"}
                    </span>
                    {isFinite(stats.ao100Current) &&
                      stats.ao100CurrentStdDev !== null && (
                        <span className="text-(--text-muted) ml-1">
                          (σ = {formatMs(stats.ao100CurrentStdDev)})
                        </span>
                      )}
                  </div>
                  <div>
                    <span className="text-(--text-secondary)">best: </span>
                    <span
                      className={`font-semibold ${stats.ao100Best === Infinity ? "text-(--error)" : "text-(--primary)"}`}
                    >
                      {stats.ao100Best !== null && isFinite(stats.ao100Best)
                        ? formatMs(stats.ao100Best)
                        : "DNF"}
                    </span>
                    {stats.ao100Best !== null &&
                      isFinite(stats.ao100Best) &&
                      stats.ao100BestStdDev !== null && (
                        <span className="text-(--text-muted) ml-1">
                          (σ = {formatMs(stats.ao100BestStdDev)})
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Session Average and Mean */}
            <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <span className="text-(--text-secondary)">
                    Average:{" "}
                  </span>
                  <span className="text-(--accent) font-semibold">
                    {stats.mean !== null ? formatMs(stats.mean) : "-"}
                  </span>
                  {stats.sessionStdDev !== null && (
                    <span className="text-(--text-muted) ml-1">
                      (σ = {formatMs(stats.sessionStdDev)})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-(--text-secondary)">Mean: </span>
                  <span className="text-(--text-primary) font-semibold">
                    {stats.mean !== null ? formatMs(stats.mean) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time List */}
          <div className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border)">
            <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-3">
              Time List
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.ordered.map((record, index) => {
                const solveNumber = index + 1;
                return (
                  <div
                    key={record.id}
                    className="bg-(--background) rounded p-2 border border-(--border) text-sm font-mono"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-(--text-muted) min-w-[2rem]">
                        {solveNumber}.
                      </span>
                      <span
                        className={`font-semibold min-w-[4rem] ${
                          record.penalty === "DNF"
                            ? "text-(--error)"
                            : record.penalty === "+2"
                              ? "text-yellow-400"
                              : "text-(--text-primary)"
                        }`}
                      >
                        {formatMs(record.finalTime)}
                        {record.penalty === "+2" && "+"}
                      </span>
                      <span className="text-(--text-secondary) flex-1 break-all">
                        {record.scramble}
                      </span>
                    </div>
                  </div>
                );
              })}
              {stats.totalSolves === 0 && (
                <div className="text-center py-4 text-(--text-muted)">
                  No solves in this session
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-(--border) bg-(--surface) flex flex-col sm:flex-row gap-2">
          {/* Share Button with Menu */}
          <div className="relative flex-1" ref={shareMenuRef}>
            <button
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) text-white rounded font-medium transition-colors"
            >
              {copySuccess ? <CircleCheck className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copySuccess ? "Copied!" : "Share"}</span>
            </button>

            {shareMenuOpen && (
              <>
                {/* Mobile: Bottom sheet */}
                <div className="fixed inset-0 z-[100] sm:hidden">
                  <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setShareMenuOpen(false)}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-(--surface) border-t border-(--border) rounded-t-2xl shadow-lg">
                    <div className="flex justify-center pt-3 pb-2">
                      <div className="w-10 h-1 bg-(--border) rounded-full" />
                    </div>
                    <div className="px-4 pb-3 border-b border-(--border)">
                      <h3 className="text-base font-semibold text-(--text-primary) text-center">
                        Share Session Stats
                      </h3>
                    </div>
                    <div className="p-4">
                      <button
                        onClick={handleCopy}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-xl transition-colors mb-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-primary)">
                          {copySuccess ? (
                            <CircleCheck className="w-5 h-5 text-(--success)" />
                          ) : (
                            <Link className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-medium">
                          {copySuccess ? "Copied!" : "Copy to Clipboard"}
                        </span>
                      </button>
                      {typeof navigator !== "undefined" && "share" in navigator && (
                        <button
                          onClick={async () => {
                            try {
                              await navigator.share({
                                title: `CubeDev Session Stats - ${eventNames[selectedEvent] || selectedEvent}`,
                                text: generateStatsText(),
                              });
                              setShareMenuOpen(false);
                            } catch (e) {}
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-xl transition-colors mb-4"
                        >
                          <div className="w-10 h-10 rounded-full bg-(--primary) flex items-center justify-center text-white">
                            <Share2 className="w-5 h-5" />
                          </div>
                          <span className="font-medium">Share via...</span>
                        </button>
                      )}
                      <div className="flex justify-center gap-4 pt-2 pb-4">
                        {SHARE_OPTIONS.map((option) => (
                          <button
                            key={option.name}
                            onClick={() => {
                              const url = option.getUrl({
                                title: `CubeDev Session Stats - ${eventNames[selectedEvent] || selectedEvent}`,
                                text: generateStatsText(),
                              });
                              window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
                              setShareMenuOpen(false);
                            }}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center text-white transition-transform hover:scale-110`}>
                              {option.icon}
                            </div>
                            <span className="text-[10px] text-(--text-muted)">{option.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Dropdown menu */}
                <div className="hidden sm:block absolute bottom-full mb-2 left-0 w-64 bg-(--surface) border border-(--border) rounded-xl shadow-lg z-[100] overflow-hidden">
                  <div className="p-3 border-b border-(--border)">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-(--text-primary)">
                        Share Stats
                      </span>
                      <button
                        onClick={() => setShareMenuOpen(false)}
                        className="p-1 hover:bg-(--surface-elevated) rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-(--text-muted)" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.share({
                              title: `CubeDev Session Stats - ${eventNames[selectedEvent] || selectedEvent}`,
                              text: generateStatsText(),
                            });
                            setShareMenuOpen(false);
                          } catch (e) {}
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-(--primary) flex items-center justify-center text-white">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <span>Share via...</span>
                      </button>
                    )}
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-primary)">
                        {copySuccess ? (
                          <CircleCheck className="w-4 h-4 text-(--success)" />
                        ) : (
                          <Link className="w-4 h-4" />
                        )}
                      </div>
                      <span>{copySuccess ? "Copied!" : "Copy to Clipboard"}</span>
                    </button>
                    <div className="my-2 border-t border-(--border)" />
                    <div className="grid grid-cols-4 gap-2 p-2">
                      {SHARE_OPTIONS.map((option) => (
                        <button
                          key={option.name}
                          onClick={() => {
                            const url = option.getUrl({
                              title: `CubeDev Session Stats - ${eventNames[selectedEvent] || selectedEvent}`,
                              text: generateStatsText(),
                            });
                            window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
                            setShareMenuOpen(false);
                          }}
                          className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white transition-transform hover:scale-110`}
                          title={option.name}
                        >
                          {option.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-(--accent) hover:bg-(--accent)/80 text-white rounded font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-(--surface-elevated) hover:bg-(--border) text-(--text-secondary) rounded font-medium transition-colors sm:flex-none"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
