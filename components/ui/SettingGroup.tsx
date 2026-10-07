import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { CardIcon } from "./Card";

export interface SettingGroupProps {
  /** Short noun phrase, e.g. "Profile visibility". */
  title: ReactNode;
  icon?: ReactNode;
  tone?: "primary" | "accent" | "success" | "warning" | "error" | "neutral";
  children: ReactNode;
  className?: string;
}

/**
 * A group of related settings, with a heading and optional icon. Use this
 * component to visually separate different sections of a settings page.
 */
export function SettingGroup({
  title,
  icon,
  tone = "primary",
  children,
  className,
}: SettingGroupProps) {
  return (
    <section
      className={cx(
        "rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <CardIcon tone={tone} className="w-7 h-7 [&_svg]:w-4 [&_svg]:h-4">
            {icon}
          </CardIcon>
        )}
        <h3 className="type-label">{title}</h3>
      </div>
      {children}
    </section>
  );
}
