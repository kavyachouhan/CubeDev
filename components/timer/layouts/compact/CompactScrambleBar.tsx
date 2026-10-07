"use client";

import { Box } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "@/components/ui/IconButton";
import {
  ScrambleBody,
  ScrambleNavActions,
  type ScrambleController,
} from "../../ScrambleDisplay";

interface CompactScrambleBarProps {
  controller: ScrambleController;
  /** Hides the prev/new buttons when the user has turned them off. */
  showNav: boolean;
  /** Opens the preview sheet; only offered where there is no aside. */
  onOpenPreview: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * The scramble, sized to sit directly above the timer.
 *
 * The panel spans the full width and the controls sit under it: a scramble is
 * the widest thing on the page, and stealing 100px of its line for buttons
 * forces an extra wrap on every 4x4 and above.
 *
 * Moves stay individually tappable for the partial preview, so the preview
 * button is separate rather than making the whole panel a tap target. Long
 * scrambles (7x7, Megaminx) scroll inside the panel so the timer keeps its
 * height.
 */
export default function CompactScrambleBar({
  controller,
  showNav,
  onOpenPreview,
  disabled = false,
  className,
}: CompactScrambleBarProps) {
  return (
    <div
      className={cx("flex flex-col gap-1.5", className)}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        className={
          "max-h-[20vh] overflow-y-auto bg-(--surface) border border-(--border) rounded-(--radius-card) shadow-(--shadow-card)"
        }
      >
        <ScrambleBody
          controller={controller}
          className="px-4 py-3 sm:px-6 sm:py-4"
          moveClassName="text-base sm:text-xl tracking-wide"
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        {showNav && <ScrambleNavActions controller={controller} />}
        <IconButton
          size="sm"
          className="lg:hidden"
          disabled={disabled}
          aria-label="Show scramble preview"
          icon={<Box />}
          onClick={onOpenPreview}
        />
      </div>
    </div>
  );
}
