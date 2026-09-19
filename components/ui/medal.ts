import type { CSSProperties } from "react";

/**
 * Podium colors for leaderboards. Gold/silver/bronze are the one place where
 * a fixed hue carries meaning, so they live in tokens (`--medal-*`) that are
 * tuned per theme rather than in Tailwind palette classes.
 */
export function medalColor(rank: number | null | undefined): string | null {
  if (rank === 1) return "var(--medal-gold)";
  if (rank === 2) return "var(--medal-silver)";
  if (rank === 3) return "var(--medal-bronze)";
  return null;
}

/** Tinted row background + border for a podium position. */
export function medalRowStyle(rank: number | null | undefined): CSSProperties {
  const color = medalColor(rank);
  if (!color) return {};
  return {
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
  };
}

/** Solid badge fill for a rank; falls back to the muted text token. */
export function medalBadgeStyle(rank: number | null | undefined): CSSProperties {
  return { background: medalColor(rank) ?? "var(--text-muted)" };
}
