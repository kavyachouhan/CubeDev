"use client";

import dynamic from "next/dynamic";
import { LoadingState, Spinner } from "@/components/ui/Spinner";

// Dynamically import ScramblePreview for 3D visualization
const ScramblePreview = dynamic(
  () => import("@/components/timer/ScramblePreview"),
  {
    loading: () => (
      <div className="h-40 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
    ssr: false,
  }
);

interface CompetitionScramblePanelProps {
  scramble: string;
  eventId: string;
  solveNumber: number;
  totalSolves: number;
  isLoading?: boolean;
  onRegenerateScramble?: () => void;
}

export default function CompetitionScramblePanel({
  scramble,
  eventId,
  solveNumber,
  totalSolves,
  isLoading = false,
}: CompetitionScramblePanelProps) {
  return (
    <div className="space-y-4">
      <div className="timer-card space-y-4">
        <div className="text-center">
          <div className="type-caption">
            Scramble {solveNumber}/{totalSolves}
          </div>
        </div>

        <div className="min-h-12">
          {isLoading ? (
            <LoadingState label="Generating scramble…" className="py-4" />
          ) : (
            <div className="font-mono text-base sm:text-lg text-(--text-primary) wrap-break-word text-center leading-relaxed">
              {scramble}
            </div>
          )}
        </div>
      </div>

      {/*
        ScramblePreview is a Card that owns its own show/hide and 3D/2D
        controls, so it sits beside the scramble rather than nested inside it
        — one card header, one set of controls.
      */}
      {!isLoading && scramble && (
        <ScramblePreview scramble={scramble} event={eventId} />
      )}
    </div>
  );
}
