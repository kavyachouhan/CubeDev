"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cx } from "@/lib/cx";
import { Button } from "./Button";
import { CardIcon } from "./Card";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Primary next step, usually a Button or ButtonLink. */
  action?: ReactNode;
  secondaryAction?: ReactNode;
  /** `compact` for inside a card or list, `page` for a whole view. */
  size?: "compact" | "page";
  className?: string;
}

/** Nothing here yet: say why and offer the next step. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "compact",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center text-center",
        size === "page" ? "py-16 px-4" : "py-8 px-4",
        className,
      )}
    >
      {icon && (
        <CardIcon
          tone="neutral"
          className={cx(
            "mb-3 text-(--text-muted)",
            size === "page" && "w-12 h-12 [&_svg]:w-6 [&_svg]:h-6",
          )}
        >
          {icon}
        </CardIcon>
      )}
      <p className={size === "page" ? "type-section-title" : "type-label"}>
        {title}
      </p>
      {description && (
        <p className="type-body mt-1 max-w-sm">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  size?: "compact" | "page";
  className?: string;
}

/** Something failed: say what, and offer a retry when one makes sense. */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  action,
  size = "compact",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cx(
        "flex flex-col items-center text-center",
        size === "page" ? "py-16 px-4" : "py-8 px-4",
        className,
      )}
    >
      <CardIcon
        tone="error"
        className={cx("mb-3", size === "page" && "w-12 h-12 [&_svg]:w-6 [&_svg]:h-6")}
      >
        <AlertTriangle />
      </CardIcon>
      <p className={size === "page" ? "type-section-title" : "type-label"}>
        {title}
      </p>
      {description && <p className="type-body mt-1 max-w-sm">{description}</p>}
      {(onRetry || action) && (
        <div className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
          {action}
          {onRetry && (
            <Button
              variant="secondary"
              onClick={onRetry}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
