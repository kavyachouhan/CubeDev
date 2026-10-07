import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { cardClasses } from "./card-styles";
import { CardIcon } from "./Card";

export type CalloutTone = "primary" | "success" | "warning" | "error" | "accent";

/**
 * The tone colours the whole outline, not just the left edge — the callout is
 * meant to read as active at rest, not only on hover.
 */
const ACCENT: Record<CalloutTone, string> = {
  primary: "border-(--primary)!",
  success: "border-(--success)!",
  warning: "border-(--warning)!",
  error: "border-(--error)!",
  accent: "border-(--accent)!",
};

export interface CalloutCardProps {
  /** The statement — say what is true, e.g. "You have 3 reviews due". */
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** The next step: a Button or ButtonLink. Drops below the text on a phone. */
  action?: ReactNode;
  /**
   * A small control that belongs with the heading rather than with the
   * action — a refresh IconButton, a dismiss. Stays on the title row at every
   * width, so it never strands itself on a line of its own.
   */
  adornment?: ReactNode;
  tone?: CalloutTone;
  /** Extra content below the title row — a progress bar, a row of choices. */
  children?: ReactNode;
  className?: string;
  rootProps?: ComponentProps<"div"> & Record<`data-${string}`, string>;
}

/**
 * A card that states something about the viewer and offers the next step,
 * outlined in the tone colour with a thicker rule down its left edge. Use it
 * for a standing prompt at the top of a view ("You have 3 reviews due", "You
 * have 1 registered competition") — not for transient feedback, which is
 * `Alert`.
 *
 * On a phone the action drops below the text so the heading never shares a
 * line with a button. Pass `w-full sm:w-auto` on a text button to have it fill
 * that row; small controls belong in `adornment` instead.
 */
export function CalloutCard({
  title,
  description,
  icon,
  action,
  adornment,
  tone = "primary",
  children,
  className,
  rootProps,
}: CalloutCardProps) {
  return (
    <div
      {...rootProps}
      className={cardClasses({
        className: cx("border-l-4", ACCENT[tone], className),
      })}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {icon && <CardIcon tone={tone}>{icon}</CardIcon>}
          <div className="min-w-0 flex-1">
            <h3 className="type-card-title wrap-break-word">{title}</h3>
            {description && <p className="type-caption mt-1">{description}</p>}
          </div>
          {adornment && <div className="shrink-0 -mt-1">{adornment}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
