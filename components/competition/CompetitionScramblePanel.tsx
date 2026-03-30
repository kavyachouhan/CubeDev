"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import ScramblePreview for 3D visualization
const ScramblePreview = dynamic(
  () => import("@/components/timer/ScramblePreview"),
  {
    loading: () => (
      <div className="h-40 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-(--text-muted) animate-spin" />
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
  showPreviewByDefault?: boolean;
}

export default function CompetitionScramblePanel({
  scramble,
  eventId,
  solveNumber,
  totalSolves,
  isLoading = false,
  onRegenerateScramble,
  showPreviewByDefault = false,
}: CompetitionScramblePanelProps) {
  const [showPreview, setShowPreview] = useState(showPreviewByDefault);

  return (
    <div className="timer-card space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs text-(--text-muted)">
          Scramble {solveNumber}/{totalSolves}
        </div>
      </div>

      {/* Scramble Text */}
      <div className="min-h-[3rem]">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-(--text-muted) animate-spin" />
            <span className="ml-2 text-sm text-(--text-muted)">
              Generating scramble...
            </span>
          </div>
        ) : (
          <div className="font-mono text-base sm:text-lg text-(--text-primary) wrap-break-word text-center leading-relaxed">
            {scramble}
          </div>
        )}
      </div>

      {/* Scramble Preview Toggle */}
      <div className="border-t border-(--border) pt-3">
        <button
          onClick={() => setShowPreview(!showPreview)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-(--text-muted) hover:text-(--primary) transition-colors disabled:opacity-50"
        >
          {showPreview ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide 3D Preview
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show 3D Preview
            </>
          )}
        </button>

        {/* 3D Preview */}
        {showPreview && !isLoading && scramble && (
          <div className="mt-3">
            <ScramblePreview scramble={scramble} event={eventId} />
          </div>
        )}
      </div>
    </div>
  );
}