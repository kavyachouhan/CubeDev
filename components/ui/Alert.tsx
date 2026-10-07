"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cx } from "@/lib/cx";

export type AlertTone = "info" | "success" | "warning" | "error" | "primary";

const TONE: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "bg-(--info)/10 border-(--info)/25", icon: "text-(--info)", Icon: Info },
  primary: { box: "bg-(--primary)/10 border-(--primary)/25", icon: "text-(--primary)", Icon: Info },
  success: { box: "bg-(--success)/10 border-(--success)/25", icon: "text-(--success)", Icon: CheckCircle2 },
  warning: { box: "bg-(--warning)/10 border-(--warning)/25", icon: "text-(--warning)", Icon: AlertTriangle },
  error: { box: "bg-(--error)/10 border-(--error)/25", icon: "text-(--error)", Icon: XCircle },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Override the default icon for the tone; pass `null` for none. */
  icon?: ReactNode | null;
  action?: ReactNode;
  onDismiss?: () => void;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Inline, persistent message tied to a region of the page (form errors,
 * warnings, notices). For transient feedback use a toast instead.
 */
export function Alert({
  tone = "info",
  title,
  children,
  icon,
  action,
  onDismiss,
  size = "md",
  className,
}: AlertProps) {
  const { box, icon: iconColor, Icon } = TONE[tone];
  const assertive = tone === "error" || tone === "warning";

  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cx(
        "flex items-start gap-2.5 border rounded-(--radius-control) font-inter",
        size === "sm" ? "p-2.5 text-xs" : "p-3 text-sm",
        box,
        className,
      )}
    >
      {icon !== null && (
        <span className={cx("shrink-0 mt-px [&_svg]:w-4 [&_svg]:h-4", iconColor)}>
          {icon ?? <Icon aria-hidden />}
        </span>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-(--text-primary)">{title}</p>
        )}
        {children && (
          <div className={cx("text-(--text-secondary)", title ? "mt-0.5" : undefined)}>
            {children}
          </div>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="icon-btn w-6 h-6 -m-0.5 [&_svg]:w-4 [&_svg]:h-4"
        >
          <X />
        </button>
      )}
    </div>
  );
}
