import Image from "next/image";
import { cx } from "@/lib/cx";
import { getEventIconPath, getTimerEvent } from "@/lib/timer-events";

const SIZES = {
  sm: { box: "w-6 h-6 p-0.5 rounded-(--radius-badge)", px: 20 },
  md: { box: "w-8 h-8 p-1 rounded-(--radius-control)", px: 24 },
  lg: { box: "w-10 h-10 p-1.5 rounded-(--radius-control)", px: 28 },
} as const;

/**
 * WCA event glyph on a primary tile — the cube-specific mark used wherever an
 * event is chosen or labelled. The SVGs are monochrome, so they're forced to
 * white on the primary fill.
 */
export function EventIcon({
  eventId,
  size = "md",
  tone = "primary",
  className,
}: {
  eventId: string;
  size?: keyof typeof SIZES;
  /** `muted` for unselected rows in dense lists. */
  tone?: "primary" | "muted";
  className?: string;
}) {
  const { box, px } = SIZES[size];
  return (
    <span
      className={cx(
        "shrink-0 inline-flex items-center justify-center",
        tone === "primary" ? "bg-(--primary)" : "bg-(--text-muted)",
        box,
        className,
      )}
    >
      <Image
        src={getEventIconPath(eventId)}
        alt={getTimerEvent(eventId).name}
        width={px}
        height={px}
        className="w-full h-full object-contain brightness-0 invert"
      />
    </span>
  );
}
