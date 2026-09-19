"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
} from "react";
import type {
  ComponentProps,
  ReactElement,
  ReactNode,
} from "react";
import { AlertCircle, Check, ChevronDown, Search, X } from "lucide-react";
import { cx } from "@/lib/cx";

type ControlSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ControlSize, string> = {
  sm: "input-sm",
  md: "",
  lg: "input-lg",
};

interface FieldProps {
  label?: ReactNode;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Right side of the label row, e.g. a character counter. */
  aside?: ReactNode;
  className?: string;
  /** A single form control; receives id, aria-invalid and aria-describedby. */
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Label, control, hint and error wired together. Wrap any Input, Textarea
 * or Select in a Field instead of hand-writing the label markup.
 */
export function Field({
  label,
  hideLabel,
  hint,
  error,
  required,
  aside,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const childProps = isValidElement(children)
    ? (children.props as Record<string, unknown>)
    : {};
  const id = (childProps.id as string | undefined) ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [childProps["aria-describedby"], errorId, hintId]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cx("space-y-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={id}
            className={cx("type-label block", hideLabel && "sr-only")}
          >
            {label}
            {required && (
              <span className="text-(--error) ml-0.5" aria-hidden>
                *
              </span>
            )}
          </label>
          {aside && <span className="type-caption">{aside}</span>}
        </div>
      )}
      {cloneElement(children, {
        id,
        required: required ?? childProps.required,
        "aria-invalid": error ? true : childProps["aria-invalid"],
        "aria-describedby": describedBy,
      })}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs text-(--error) font-inter"
        >
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="type-caption">
          {hint}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  size?: ControlSize;
  /** Adornment inside the left edge (icon). */
  leading?: ReactNode;
  /** Adornment inside the right edge (unit, button). */
  trailing?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", leading, trailing, invalid, className, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || rest["aria-invalid"] || undefined}
      className={cx(
        "input",
        SIZE_CLASS[size],
        leading ? "pl-10!" : undefined,
        trailing ? "pr-10!" : undefined,
        !leading && !trailing && className,
      )}
      {...rest}
    />
  );

  if (!leading && !trailing) return input;

  return (
    <div className={cx("relative", className)}>
      {leading && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) [&_svg]:w-4 [&_svg]:h-4">
          {leading}
        </span>
      )}
      {input}
      {trailing && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-(--text-muted) [&_svg]:w-4 [&_svg]:h-4">
          {trailing}
        </span>
      )}
    </div>
  );
});

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || rest["aria-invalid"] || undefined}
        className={cx("input", className)}
        {...rest}
      />
    );
  },
);

export interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  size?: ControlSize;
  invalid?: boolean;
}

/**
 * Styled native select. Prefer this for forms: it gets the platform picker
 * on mobile for free. Use `SelectMenu` only when options need rich content.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ size = "md", invalid, className, children, ...rest }, ref) {
    return (
      <div className={cx("relative", className)}>
        <select
          ref={ref}
          aria-invalid={invalid || rest["aria-invalid"] || undefined}
          className={cx("input", SIZE_CLASS[size])}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)"
        />
      </div>
    );
  },
);

export interface SearchInputProps
  extends Omit<InputProps, "leading" | "trailing" | "type" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  /** Label for the clear button. */
  clearLabel?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { value, onChange, clearLabel = "Clear search", ...rest },
    ref,
  ) {
    return (
      <Input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        leading={<Search />}
        trailing={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={clearLabel}
              className="icon-btn w-6 h-6"
            >
              <X />
            </button>
          ) : undefined
        }
        {...rest}
      />
    );
  },
);

export interface CheckboxProps
  extends Omit<ComponentProps<"input">, "type" | "size"> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, className, id, ...rest }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const box = (
      <span className="relative inline-flex shrink-0 w-[1.125rem] h-[1.125rem] mt-0.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer absolute inset-0 appearance-none rounded-[0.3125rem] border border-(--border-hover) bg-(--surface-elevated) transition-colors checked:bg-(--primary) checked:border-(--primary) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none relative m-auto w-3 h-3 text-(--on-primary) opacity-0 peer-checked:opacity-100"
        />
      </span>
    );

    if (!label) return <span className={className}>{box}</span>;

    return (
      <label
        htmlFor={inputId}
        className={cx("flex items-start gap-2.5 cursor-pointer", className)}
      >
        {box}
        <span className="min-w-0">
          <span className="type-label block">{label}</span>
          {description && (
            <span className="type-caption block mt-0.5">{description}</span>
          )}
        </span>
      </label>
    );
  },
);
