"use client";

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cx } from "@/lib/cx";

export interface StepperStep {
  /** 1-based step number. */
  id: number;
  title: string;
  icon?: ReactNode;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number;
  /** Omit to make completed steps non-clickable. */
  onStepClick?: (id: number) => void;
  className?: string;
}

/**
 * Progress through a multi-step wizard. Completed steps are reachable again;
 * upcoming ones are not. Titles hide below `sm`, where the labelled current
 * step in the dialog body already says where you are.
 */
export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: StepperProps) {
  const currentStep = steps.find((step) => step.id === current);

  return (
    <nav
      aria-label="Progress"
      className={cx("flex items-center justify-center", className)}
    >
      <p className="sr-only" aria-live="polite">
        {currentStep
          ? `Step ${current} of ${steps.length}: ${currentStep.title}`
          : `Step ${current} of ${steps.length}`}
      </p>
      {steps.map((step, index) => {
        const isActive = current === step.id;
        const isCompleted = current > step.id;
        const reachable = isCompleted && !!onStepClick;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={reachable ? () => onStepClick(step.id) : undefined}
                disabled={!reachable}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${step.id}: ${step.title}`}
                className={cx(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-5 sm:[&_svg]:h-5",
                  isActive
                    ? "bg-(--primary) text-(--on-primary)"
                    : isCompleted
                      ? "bg-(--success) text-white cursor-pointer"
                      : "bg-(--surface-elevated) text-(--text-muted)",
                )}
              >
                {isCompleted ? <CheckCircle2 aria-hidden /> : step.icon}
              </button>
              <span
                className={cx(
                  "mt-1 text-xs font-medium font-inter hidden sm:block",
                  isActive ? "text-(--primary)" : "text-(--text-muted)",
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                aria-hidden
                className={cx(
                  "w-4 sm:w-12 lg:w-16 h-0.5 mx-1 sm:mx-2 rounded-full shrink-0",
                  isCompleted ? "bg-(--success)" : "bg-(--border)",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
