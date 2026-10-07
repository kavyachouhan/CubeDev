import { cx } from "@/lib/cx";
import { medalColor } from "./medal";

const SIZES = {
  sm: "w-5 h-5 text-[0.625rem]",
  md: "w-7 h-7 text-xs",
  lg: "w-9 h-9 text-sm",
} as const;

export interface RankBadgeProps {
  /** Finishing position. `null` renders nothing — no placeholder disc. */
  rank: number | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * A finishing position. The top three get their medal fill; everything else is
 * a plain numeral, because a filled grey disc reads as a broken avatar rather
 * than as "fourth place".
 */
export function RankBadge({ rank, size = "md", className }: RankBadgeProps) {
  if (rank === null || rank === undefined) return null;

  const color = medalColor(rank);
  const label = `Rank ${rank}`;

  if (!color) {
    return (
      <span
        aria-label={label}
        className={cx(
          "inline-flex items-center justify-center shrink-0 type-time font-semibold text-(--text-muted)",
          SIZES[size],
          className,
        )}
      >
        #{rank}
      </span>
    );
  }

  return (
    <span
      aria-label={label}
      style={{ background: color }}
      className={cx(
        "inline-flex items-center justify-center shrink-0 rounded-full font-bold text-(--on-media)",
        SIZES[size],
        className,
      )}
    >
      {rank}
    </span>
  );
}
