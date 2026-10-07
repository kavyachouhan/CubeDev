import { cx } from "@/lib/cx";

export type CardVariant =
  /** Top-level content card; border turns primary on hover (`.timer-card`). */
  | "default"
  /** Top-level card that doesn't react to hover (dashboards, forms). */
  | "static"
  /** A card inside a card: elevated surface, tighter padding, no shadow. */
  | "nested"
  /** Clickable card; adds pointer, focus ring and pressed feedback. */
  | "interactive";

export type CardPadding = "none" | "sm" | "md" | "responsive";

const PADDING: Record<CardPadding, string> = {
  none: "p-0!",
  sm: "p-3!",
  md: "p-4!",
  responsive: "",
};

/** Class string for a card surface; usable from server and client code. */
export function cardClasses({
  variant = "default",
  padding,
  selected,
  className,
}: {
  variant?: CardVariant;
  padding?: CardPadding;
  selected?: boolean;
  className?: string;
} = {}) {
  const pad = padding ?? (variant === "nested" ? "md" : "responsive");
  return cx(
    variant === "nested"
      ? "bg-(--surface-elevated) border border-(--border) rounded-(--radius-panel)"
      : "timer-card",
    variant === "static" && "card-static",
    variant === "interactive" &&
      "cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-2 active:scale-[0.995]",
    selected && "border-(--primary)! bg-(--primary)/5",
    PADDING[pad],
    className,
  );
}
