"use client";

import { useMemo } from "react";
import { Download, Share2 } from "lucide-react";
import { TimerRecord } from "../../lib/stats-utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ShareMenu } from "@/components/ui/ShareMenu";
import { TimeValue } from "@/components/ui/TimeValue";
import { getEventName } from "./SolveDetailsModal";
import {
  ExtendedStatsVisibility,
  DEFAULT_EXTENDED_STATS,
} from "./StatsVisibilitySettings";

interface SessionStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TimerRecord[];
  selectedEvent: string;
  extendedStatsVisibility?: ExtendedStatsVisibility;
}

// Singles truncate to the centisecond, averages round (WCA regulations).
const truncToCentisMs = (ms: number) => Math.floor(ms / 10) * 10;
const roundToCentisMs = (ms: number) => Math.round(ms / 10) * 10;

// M:SS.ss or SS.ss
const formatMs = (ms: number) => {
  if (!isFinite(ms)) return "DNF";
  const total = ms / 1000;
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(2);
  return m > 0 ? `${m}:${s.padStart(5, "0")}` : s;
};

const formatDateTime = (date: Date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** A current/best pair with standard deviations, e.g. "Avg of 5". */
function AverageRow({
  label,
  current,
  currentStdDev,
  best,
  bestStdDev,
  emptyAs = "–",
}: {
  label: string;
  current: number | null;
  currentStdDev: number | null;
  best: number | null;
  bestStdDev: number | null;
  /** What a missing value reads as; extended averages report "DNF". */
  emptyAs?: string;
}) {
  const cell = (value: number | null, stdDev: number | null) => (
    <span className="inline-flex items-baseline gap-1.5 flex-wrap">
      <TimeValue
        penalty={value === Infinity ? "DNF" : undefined}
        className={
          value === null
            ? "text-(--text-muted)"
            : value === Infinity
              ? "font-semibold"
              : "font-semibold text-(--primary)!"
        }
      >
        {value === null ? emptyAs : isFinite(value) ? formatMs(value) : "DNF"}
      </TimeValue>
      {value !== null && isFinite(value) && stdDev !== null && (
        <span className="type-time text-xs text-(--text-muted)">σ {formatMs(stdDev)}</span>
      )}
    </span>
  );

  return (
    <tr className="border-b border-(--border) last:border-b-0">
      <th scope="row" className="py-2.5 pr-3 text-left font-medium text-(--text-secondary) whitespace-nowrap">
        {label}
      </th>
      <td className="py-2.5 pr-3">{cell(current, currentStdDev)}</td>
      <td className="py-2.5">{cell(best, bestStdDev)}</td>
    </tr>
  );
}

export default function SessionStatsModal({
  isOpen,
  onClose,
  history,
  selectedEvent,
  extendedStatsVisibility = DEFAULT_EXTENDED_STATS,
}: SessionStatsModalProps) {
  const stats = useMemo(() => {
    const eventHistory = history.filter((r) => r.event === selectedEvent);
    const ordered = [...eventHistory].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const truncatedSingles = ordered
      .filter((r) => isFinite(r.finalTime))
      .map((r) => truncToCentisMs(r.finalTime));

    const bestTime = truncatedSingles.length ? Math.min(...truncatedSingles) : null;
    const worstTime = truncatedSingles.length ? Math.max(...truncatedSingles) : null;

    const calculateStdDev = (values: number[]): number | null => {
      if (values.length <= 1) return null;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          (values.length - 1),
      );
    };

    // Current WCA average of N: last N solves, drop best and worst.
    const wcaAverageN = (n: number): { avg: number | null; stdDev: number | null } => {
      if (ordered.length < n) return { avg: null, stdDev: null };
      const values = ordered
        .slice(-n)
        .map((r) => (isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity));
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

    // Best WCA average of N across all rolling windows.
    const bestWcaAverageN = (n: number): { avg: number | null; stdDev: number | null } => {
      if (ordered.length < n) return { avg: null, stdDev: null };
      let best: number | null = null;
      let bestStdDev: number | null = null;
      for (let i = 0; i <= ordered.length - n; i++) {
        const values = ordered
          .slice(i, i + n)
          .map((r) => (isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity));
        const dnfs = values.filter((v) => !isFinite(v)).length;
        if (dnfs >= 2) continue;
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

    const mo3CurrentResult = (() => {
      if (ordered.length < 3)
        return { mean: null as number | null, stdDev: null as number | null };
      const values = ordered
        .slice(-3)
        .map((r) => (isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity));
      if (values.some((v) => !isFinite(v))) return { mean: Infinity, stdDev: null };
      const mean = roundToCentisMs(values.reduce((acc, v) => acc + v, 0) / 3);
      const stdDev = calculateStdDev(values);
      return { mean, stdDev: stdDev ? roundToCentisMs(stdDev) : null };
    })();

    const mo3BestResult = (() => {
      if (ordered.length < 3)
        return { mean: null as number | null, stdDev: null as number | null };
      let best: number | null = null;
      let bestStdDev: number | null = null;
      for (let i = 0; i <= ordered.length - 3; i++) {
        const values = ordered
          .slice(i, i + 3)
          .map((r) => (isFinite(r.finalTime) ? truncToCentisMs(r.finalTime) : Infinity));
        if (values.some((v) => !isFinite(v))) continue;
        const mean = roundToCentisMs(values.reduce((acc, v) => acc + v, 0) / 3);
        if (best === null || mean < best) {
          best = mean;
          bestStdDev = calculateStdDev(values);
          bestStdDev = bestStdDev ? roundToCentisMs(bestStdDev) : null;
        }
      }
      return { mean: best, stdDev: bestStdDev };
    })();

    const mean = truncatedSingles.length
      ? roundToCentisMs(truncatedSingles.reduce((a, b) => a + b, 0) / truncatedSingles.length)
      : null;

    const sessionStdDev =
      truncatedSingles.length > 1 && mean != null
        ? roundToCentisMs(
            Math.sqrt(
              truncatedSingles.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) /
                (truncatedSingles.length - 1),
            ),
          )
        : null;

    const averages = Object.fromEntries(
      ([5, 12, 25, 50, 100] as const).map((n) => {
        const current = wcaAverageN(n);
        const best = bestWcaAverageN(n);
        return [
          n,
          {
            current: current.avg,
            currentStdDev: current.stdDev,
            best: best.avg,
            bestStdDev: best.stdDev,
          },
        ];
      }),
    ) as Record<
      5 | 12 | 25 | 50 | 100,
      {
        current: number | null;
        currentStdDev: number | null;
        best: number | null;
        bestStdDev: number | null;
      }
    >;

    return {
      ordered,
      bestTime,
      worstTime,
      averages,
      mo3Current: mo3CurrentResult.mean,
      mo3CurrentStdDev: mo3CurrentResult.stdDev,
      mo3Best: mo3BestResult.mean,
      mo3BestStdDev: mo3BestResult.stdDev,
      mean,
      sessionStdDev,
      dnfCount: ordered.filter((r) => !isFinite(r.finalTime)).length,
      totalSolves: ordered.length,
    };
  }, [history, selectedEvent]);

  const eventName = getEventName(selectedEvent);

  const extendedRows = ([25, 50, 100] as const).filter(
    (n) =>
      extendedStatsVisibility[`ao${n}` as keyof ExtendedStatsVisibility] &&
      stats.averages[n].current !== null,
  );

  const generateStatsText = () => {
    const pair = (current: number | null, currentSd: number | null, best: number | null, bestSd: number | null, empty = "-") => {
      const fmt = (v: number | null, sd: number | null) => {
        let s = v !== null ? (isFinite(v) ? formatMs(v) : "DNF") : empty;
        if (v !== null && isFinite(v) && sd !== null) s += ` (σ = ${formatMs(sd)})`;
        return s;
      };
      return `    current: ${fmt(current, currentSd)}\n    best: ${fmt(best, bestSd)}\n\n`;
    };

    let text = `Generated By CubeDev on ${formatDateTime(new Date())}\n`;
    text += `solves/total: ${stats.totalSolves}/${stats.totalSolves}\n\n`;
    text += `single\n`;
    text += `    best: ${stats.bestTime !== null ? formatMs(stats.bestTime) : "-"}\n`;
    text += `    worst: ${stats.worstTime !== null ? formatMs(stats.worstTime) : "-"}\n\n`;
    text += `mean of 3\n${pair(stats.mo3Current, stats.mo3CurrentStdDev, stats.mo3Best, stats.mo3BestStdDev)}`;
    for (const n of [5, 12] as const) {
      const a = stats.averages[n];
      text += `avg of ${n}\n${pair(a.current, a.currentStdDev, a.best, a.bestStdDev)}`;
    }
    for (const n of extendedRows) {
      const a = stats.averages[n];
      text += `avg of ${n}\n${pair(a.current, a.currentStdDev, a.best, a.bestStdDev, "DNF")}`;
    }
    text += `Average: ${stats.mean !== null ? formatMs(stats.mean) : "-"}`;
    if (stats.sessionStdDev !== null) text += ` (σ = ${formatMs(stats.sessionStdDev)})`;
    text += `\nMean: ${stats.mean !== null ? formatMs(stats.mean) : "-"}\n\n`;
    text += `Time List:\n`;
    stats.ordered.forEach((record, index) => {
      text += `${index + 1}. ${formatMs(record.finalTime)}${record.penalty === "+2" ? "+" : ""}    ${record.scramble}\n`;
    });
    return text;
  };

  const handleExportCSV = () => {
    let csv = `No.,Time,Penalty,Event,Scramble,Date\n`;
    stats.ordered.forEach((record, index) => {
      const penalty = record.penalty === "none" ? "" : record.penalty;
      const scramble = `"${record.scramble.replace(/"/g, '""')}"`;
      csv += `${index + 1},${formatMs(record.time)},${penalty},${eventName},${scramble},${formatDateTime(record.timestamp)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubedev-session-${selectedEvent}-${Date.now()}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="xl" mobile="fullscreen">
      <Modal.Header
        title="Session Statistics"
        description={`${eventName} · ${stats.totalSolves} ${stats.totalSolves === 1 ? "solve" : "solves"}${
          stats.dnfCount ? ` · ${stats.dnfCount} DNF` : ""
        }`}
      />
      <Modal.Body className="space-y-5">
        {stats.totalSolves === 0 ? (
          <EmptyState
            title="No solves in this session"
            description="Solves you time for this event will be summarized here."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Best single", value: stats.bestTime, tone: "text-(--primary)" },
                { label: "Worst single", value: stats.worstTime, tone: "text-(--error)" },
                { label: "Session mean", value: stats.mean, tone: "text-(--accent)" },
                { label: "Std deviation", value: stats.sessionStdDev, tone: "text-(--text-secondary)" },
              ].map(({ label, value, tone }) => (
                <div
                  key={label}
                  className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-3"
                >
                  <p className="type-overline">{label}</p>
                  <p className={`type-time text-lg font-bold mt-0.5 ${value === null ? "text-(--text-muted)" : tone}`}>
                    {value === null ? "–" : formatMs(value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-(--radius-panel) border border-(--border) overflow-x-auto">
              <table className="w-full text-sm font-inter">
                <thead className="bg-(--surface-elevated)">
                  <tr className="border-b border-(--border)">
                    <th scope="col" className="py-2 px-3 text-left type-overline">Average</th>
                    <th scope="col" className="py-2 pr-3 text-left type-overline">Current</th>
                    <th scope="col" className="py-2 pr-3 text-left type-overline">Best</th>
                  </tr>
                </thead>
                <tbody className="[&_th]:pl-3 [&_td:last-child]:pr-3">
                  <AverageRow
                    label="Mean of 3"
                    current={stats.mo3Current}
                    currentStdDev={stats.mo3CurrentStdDev}
                    best={stats.mo3Best}
                    bestStdDev={stats.mo3BestStdDev}
                  />
                  {([5, 12] as const).map((n) => (
                    <AverageRow key={n} label={`Avg of ${n}`} {...stats.averages[n]} />
                  ))}
                  {extendedRows.map((n) => (
                    <AverageRow key={n} label={`Avg of ${n}`} emptyAs="DNF" {...stats.averages[n]} />
                  ))}
                </tbody>
              </table>
            </div>

            <section>
              <h3 className="type-overline mb-2">Time list</h3>
              <ol className="rounded-(--radius-panel) border border-(--border) divide-y divide-(--border) max-h-72 overflow-y-auto">
                {stats.ordered.map((record, index) => (
                  <li key={record.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                    <span className="type-time text-(--text-muted) w-8 shrink-0">{index + 1}.</span>
                    <TimeValue penalty={record.penalty} className="font-semibold w-16 shrink-0">
                      {formatMs(record.finalTime)}
                      {record.penalty === "+2" && "+"}
                    </TimeValue>
                    <span className="type-time text-xs text-(--text-secondary) flex-1 break-all pt-0.5">
                      {record.scramble}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </Modal.Body>
      <Modal.Footer
        start={
          <ShareMenu
            title="Share session stats"
            placement="top-start"
            data={() => ({
              title: `CubeDev Session Stats - ${eventName}`,
              text: generateStatsText(),
            })}
            trigger={(props) => (
              <Button {...props} variant="subtle" iconLeft={<Share2 className="w-4 h-4" />}>
                Share
              </Button>
            )}
          />
        }
      >
        <Button
          variant="secondary"
          onClick={handleExportCSV}
          disabled={stats.totalSolves === 0}
          iconLeft={<Download className="w-4 h-4" />}
        >
          Export CSV
        </Button>
        <Button onClick={onClose}>Done</Button>
      </Modal.Footer>
    </Modal>
  );
}
