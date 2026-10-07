import { cx } from "@/lib/cx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "ghost"
  | "danger"
  /* Status fills: only for actions that *are* the status (OK / +2 / DNF). */
  | "success"
  | "warning";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button classes without the component. Lives outside Button.tsx because that
 * file is a client module, and a server component that needs to style a plain
 * `<a>` must still be able to call this.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cx(
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && "w-full",
    className,
  );
}
