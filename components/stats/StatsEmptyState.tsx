"use client";

import { BarChart3, Timer } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardIcon } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
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
    <div className="container-responsive py-4 md:py-8 space-y-4 md:space-y-6">
      <PageHeader
        title="Statistics"
        description="Trends, personal bests and practice activity across your solves."
        hideTitleOnMobile
      />

      {/* Banner — takes the slot the filters occupy on the populated page */}
      <Card variant="static">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <CardIcon className="w-12 h-12 [&_svg]:w-6 [&_svg]:h-6">
              <BarChart3 />
            </CardIcon>
            <div className="min-w-0">
              <h2 className="type-section-title">No Statistics Yet</h2>
              <p className="type-body mt-1">
                Complete some solves in the timer to start tracking your
                progress and personal bests.
              </p>
            </div>
          </div>

          <ButtonLink
            href="/cube-lab/timer"
            iconLeft={<Timer className="w-4 h-4" />}
            className="w-full md:w-auto shrink-0"
          >
            Start Solving
          </ButtonLink>
        </div>
      </Card>

      <TimeProgressChart solves={NO_SOLVES} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        <PersonalBestsCard solves={NO_SOLVES} />
        <TimeDistributionChart solves={NO_SOLVES} />
      </div>

      <SolveHeatmap heatmapData={NO_SOLVES} />
    </div>
  );
}
