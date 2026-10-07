"use client";

import type { ReactNode } from "react";
import { useTheme, type TimerLayout } from "@/lib/theme-context";
import { cx } from "@/lib/cx";
import { OptionTiles } from "@/components/ui/OptionTiles";

/*
 * Miniatures of the two layouts, drawn in the same shapes the real pages use:
 * rounded cards with gaps between them. `--border` fills the blocks so they
 * show on the light themes too, where surface and elevated are both white.
 */

/** One card in a miniature. */
function Block({ className }: { className?: string }) {
  return (
    <div className={cx("rounded-(--radius-badge) bg-(--border)", className)} />
  );
}

/** The timer card: a block with the time drawn as a primary stroke. */
function TimerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-(--radius-badge) bg-(--border)",
        className,
      )}
    >
      <span className="h-2 w-2/5 rounded-full bg-(--primary)" />
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="mt-1 w-full h-20 p-1.5 flex flex-col gap-1 rounded-(--radius-badge) border border-(--border) bg-(--surface-elevated)"
    >
      {children}
    </div>
  );
}

/** Compact: selector chips, scramble, a dominant timer with a side column, stats dock. */
function CompactPreview() {
  return (
    <Frame>
      <div className="flex justify-center gap-1">
        <Block className="h-1.5 w-5" />
        <Block className="h-1.5 w-5" />
      </div>
      <Block className="h-2.5" />
      <div className="flex-1 min-h-0 flex gap-1">
        <TimerBlock className="flex-1" />
        <div className="w-1/4 flex flex-col gap-1">
          <Block className="h-3" />
          <Block className="flex-1" />
        </div>
      </div>
      <Block className="h-2" />
    </Frame>
  );
}

/** Cards: two columns of stacked cards, one per concern; the page scrolls. */
function CardsPreview() {
  return (
    <Frame>
      <div className="flex-1 min-h-0 flex gap-1">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex gap-1">
            <Block className="flex-1 h-2.5" />
            <Block className="flex-1 h-2.5" />
          </div>
          <Block className="h-3" />
          <TimerBlock className="flex-1" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <Block className="h-5" />
          <Block className="flex-1" />
        </div>
      </div>
    </Frame>
  );
}

export default function TimerLayoutSelector() {
  const { timerLayout, setTimerLayout } = useTheme();

  return (
    <OptionTiles<TimerLayout>
      legend="Timer Layout"
      value={timerLayout}
      onChange={setTimerLayout}
      columns="grid-cols-2"
      hint="Compact fits the timer, scramble and stats on one screen. Cards stacks each panel and scrolls."
      options={[
        {
          value: "compact",
          label: "Compact",
          description: "Traditional single-screen layout",
          preview: <CompactPreview />,
        },
        {
          value: "cards",
          label: "Cards",
          description: "Collapsible cards for each panel",
          preview: <CardsPreview />,
        },
      ]}
    />
  );
}
