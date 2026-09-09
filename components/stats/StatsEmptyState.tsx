"use client";

import Link from "next/link";
import { BarChart3, Timer } from "lucide-react";
import PersonalBestsCard from "./PersonalBestsCard";
import SolveHeatmap from "./SolveHeatmap";
import TimeDistributionChart from "./TimeDistributionChart";
import TimeProgressChart from "./TimeProgressChart";

const NO_SOLVES: [] = [];

/**
 * Shown when the user has no solves yet.
 *
 * Renders the real dashboard components with empty data rather than bespoke
 * placeholders, so the layout, card chrome and panel headers are identical to
 * the populated page — only the values are missing. Each component already
 * has its own in-card empty copy ("No records yet", "No data to display").
 */
export default function StatsEmptyState() {
  return (
    <div className="p-4 sm:p-6 space-y-4 md:space-y-6">
      {/* Banner — takes the slot the filters occupy on the populated page */}
      <div className="timer-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-3 rounded-xl bg-(--primary)/10 shrink-0">
              <BarChart3 className="w-6 h-6 text-(--primary)" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-semibold text-(--text-primary) font-statement">
                No Statistics Yet
              </h2>
              <p className="text-sm text-(--text-secondary) mt-1">
                Complete some solves in the timer to start tracking your
                progress and personal bests.
              </p>
            </div>
          </div>

          <Link
            href="/cube-lab/timer"
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm w-full md:w-auto shrink-0"
          >
            <Timer className="w-4 h-4" />
            Start Solving
          </Link>
        </div>
      </div>

      {/* Time Progress Chart */}
      <div className="timer-card lg:col-span-2">
        <TimeProgressChart solves={NO_SOLVES} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Personal Bests */}
        <div className="timer-card">
          <PersonalBestsCard solves={NO_SOLVES} />
        </div>

        {/* Time Distribution */}
        <div className="timer-card">
          <TimeDistributionChart solves={NO_SOLVES} />
        </div>
      </div>

      {/* Solve Heatmap */}
      <div className="timer-card">
        <SolveHeatmap heatmapData={NO_SOLVES} />
      </div>
    </div>
  );
}
