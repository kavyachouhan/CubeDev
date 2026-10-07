"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import { cardClasses } from "./card-styles";
import type { CardPadding, CardVariant } from "./card-styles";

export { cardClasses };
export type { CardPadding, CardVariant };

type CardProps = {
  as?: "div" | "section" | "article" | "li" | "aside";
  variant?: CardVariant;
  padding?: CardPadding;
  selected?: boolean;
} & ComponentProps<"div">;

export function Card({
  as = "div",
  variant = "default",
  padding,
  selected,
  className,
  ...rest
}: CardProps) {
  // All allowed tags share div's props, so typing as "div" is sound here.
  const Component = as as "div";
  return (
    <Component
      className={cardClasses({ variant, padding, selected, className })}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  /**
   * Drop `actions` onto their own row below the title under `sm`. Use it when
   * the actions are wider than an icon (a SegmentedControl, a toggle pair),
   * which would otherwise squeeze the title down to an ellipsis on a phone.
   */
  stackActions?: boolean;
  /** Heading level; defaults to h3 (cards sit under a page h1/h2). */
  as?: "h2" | "h3" | "h4";
  className?: string;
}

/** Title row: optional icon, statement title, description, right-aligned actions. */
export function CardHeader({
  title,
  description,
  icon,
  actions,
  stackActions,
  as: Heading = "h3",
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cx(
        "flex gap-3 mb-4",
        stackActions
          ? "flex-col items-stretch sm:flex-row sm:items-start sm:justify-between"
          : "items-start justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && <CardIcon>{icon}</CardIcon>}
        <div className="min-w-0">
          <Heading className="type-card-title truncate">{title}</Heading>
          {description && <p className="type-caption mt-0.5">{description}</p>}
        </div>
      </div>
      {/* Without a description the title is one line, so centre the actions
          against it instead of pinning them to the top of the row. */}
      {actions && (
        <div
          className={cx(
            "flex items-center gap-1",
            stackActions ? "sm:shrink-0" : "shrink-0",
            !description && (stackActions ? "sm:self-center" : "self-center"),
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/** The tinted icon tile used in card headers, empty states and stat tiles. */
export function CardIcon({
  children,
  tone = "primary",
  className,
}: {
  children: ReactNode;
  tone?: "primary" | "success" | "warning" | "error" | "accent" | "neutral";
  className?: string;
}) {
  const tones = {
    primary: "bg-(--primary)/10 text-(--primary)",
    success: "bg-(--success)/10 text-(--success)",
    warning: "bg-(--warning)/10 text-(--warning)",
    error: "bg-(--error)/10 text-(--error)",
    accent: "bg-(--accent)/10 text-(--accent)",
    neutral: "bg-(--surface-elevated) text-(--text-secondary)",
  };
  return (
    <div
      className={cx(
        "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-(--radius-control) [&_svg]:w-5 [&_svg]:h-5",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Collapsed/expanded state that remembers itself per viewer.
 * Browser storage can be unavailable (private windows, blocked site data), so
 * every access is guarded and falls back to `defaultOpen`.
 */
export function useCollapsed(storageKey: string | undefined, defaultOpen = true) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultOpen;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved === null ? defaultOpen : saved === "true";
    } catch {
      return defaultOpen;
    }
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, String(next));
    } catch {
      // Remembering the panel state is a convenience, not a requirement.
    }
  };

  return { open, onOpenChange };
}

interface CollapsibleCardProps {
  title: ReactNode;
  /** Controlled open state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Right-side header controls (IconButtons). Stay visible when collapsed. */
  actions?: ReactNode;
  /**
   * Drop `actions` onto their own row below the title under `sm`. Use it when
   * the actions are wider than an icon (a SegmentedControl of filters), which
   * would otherwise truncate the title away on a phone.
   */
  stackActions?: boolean;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Extra attributes for the root, e.g. `data-tour`. */
  rootProps?: ComponentProps<"section"> & Record<`data-${string}`, string>;
  variant?: Exclude<CardVariant, "interactive">;
}

/**
 * The canonical CubeLab panel: statement title that toggles the body, a
 * chevron, and header actions. The body animates its measured height and
 * collapses instantly under reduced motion (handled globally in CSS).
 */
export function CollapsibleCard({
  title,
  open,
  onOpenChange,
  actions,
  stackActions,
  children,
  className,
  bodyClassName,
  rootProps,
  variant = "default",
}: CollapsibleCardProps) {
  const bodyId = useId();
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(open ? "auto" : 0);
  const firstRender = useRef(true);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    if (firstRender.current) {
      firstRender.current = false;
      setHeight(open ? "auto" : 0);
      return;
    }
    const full = inner.scrollHeight;
    if (open) {
      setHeight(full);
      const id = window.setTimeout(() => setHeight("auto"), 300);
      return () => window.clearTimeout(id);
    }
    setHeight(full);
    const frame = requestAnimationFrame(() => setHeight(0));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <section
      {...rootProps}
      className={cardClasses({ variant, className })}
    >
      <div
        className={cx(
          "flex gap-2",
          stackActions
            ? "flex-col items-stretch sm:flex-row sm:items-center sm:justify-between"
            : "items-center justify-between",
          open && "mb-4",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
          className="group flex items-center gap-1.5 -ml-1 px-1 py-1 rounded-(--radius-control) text-(--text-muted) hover:text-(--primary) transition-colors min-w-0"
        >
          <h3 className="type-card-title group-hover:text-(--primary) transition-colors truncate">
            {title}
          </h3>
          <ChevronDown
            aria-hidden
            className={cx(
              "w-4 h-4 shrink-0 transition-transform duration-(--duration-base)",
              !open && "-rotate-90",
            )}
          />
        </button>
        {actions && (
          <div
            className={cx(
              "flex items-center gap-1",
              stackActions ? "sm:shrink-0" : "shrink-0",
            )}
          >
            {actions}
          </div>
        )}
      </div>
      <div
        id={bodyId}
        hidden={!open && height === 0 ? true : undefined}
        className="overflow-hidden transition-[height,opacity] duration-(--duration-slow) ease-out"
        style={{
          height: height === "auto" ? "auto" : height,
          opacity: open ? 1 : 0,
        }}
      >
        <div ref={innerRef} className={bodyClassName}>
          {children}
        </div>
      </div>
    </section>
  );
}
