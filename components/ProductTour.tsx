"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  icon?: React.ReactNode;
}

interface ProductTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  tourId: string; // Unique ID for the tour to track completion
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

export default function ProductTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  tourId,
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStep];
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
      // If target not found, center the tooltip
      setHighlightRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        placement: "center",
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    setHighlightRect(rect);

    const tooltipWidth = 340;
    const tooltipHeight = 200;
    const padding = 16;
    const arrowSize = 12;

    let placement = step.placement || "bottom";
    let top = 0;
    let left = 0;

    // Available space around the target
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    // Adjust placement if not enough space
    if (placement === "bottom" && spaceBottom < tooltipHeight + padding) {
      placement = spaceTop > tooltipHeight + padding ? "top" : "right";
    } else if (placement === "top" && spaceTop < tooltipHeight + padding) {
      placement = spaceBottom > tooltipHeight + padding ? "bottom" : "right";
    } else if (placement === "right" && spaceRight < tooltipWidth + padding) {
      placement = spaceLeft > tooltipWidth + padding ? "left" : "bottom";
    } else if (placement === "left" && spaceLeft < tooltipWidth + padding) {
      placement = spaceRight > tooltipWidth + padding ? "right" : "bottom";
    }

    switch (placement) {
      case "top":
        top = rect.top - tooltipHeight - arrowSize - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + arrowSize + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - arrowSize - padding;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + arrowSize + padding;
        break;
      case "center":
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        break;
    }

    // Ensure tooltip is within viewport
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipWidth - padding),
    );
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipHeight - padding),
    );

    setTooltipPosition({ top, left, placement });

    // Scroll target into view
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentStep, steps, isOpen]);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true);
      return () => {
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition, true);
      };
    }
  }, [isOpen, calculatePosition]);

  // Recalculate position on step change
  useEffect(() => {
    if (isOpen) {
      // Delay to allow DOM updates
      const timer = setTimeout(calculatePosition, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen, calculatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour-completed-${tourId}`, "true");
    setCurrentStep(0);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour-completed-${tourId}`, "true");
    setCurrentStep(0);
    onClose();
  };

  // 
  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStep];
    const targetElement = document.querySelector(step.target);

    if (!targetElement) return;

    const handleTargetClick = () => {
      // Delay advancing to allow any click handlers on the target element to execute first
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          localStorage.setItem(`tour-completed-${tourId}`, "true");
          setCurrentStep(0);
          onComplete();
        }
      }, 100);
    };

    targetElement.addEventListener("click", handleTargetClick);
    return () => {
      targetElement.removeEventListener("click", handleTargetClick);
    };
  }, [isOpen, currentStep, steps, tourId, onComplete]);

  if (!mounted || !isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isCenterPlacement = tooltipPosition?.placement === "center";

  const getArrowStyles = () => {
    if (!tooltipPosition || isCenterPlacement) return {};

    const arrowBase = {
      position: "absolute" as const,
      width: 0,
      height: 0,
      borderStyle: "solid" as const,
    };

    switch (tooltipPosition.placement) {
      case "top":
        return {
          ...arrowBase,
          bottom: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: "12px 12px 0 12px",
          borderColor: "var(--surface) transparent transparent transparent",
        };
      case "bottom":
        return {
          ...arrowBase,
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          borderWidth: "0 12px 12px 12px",
          borderColor: "transparent transparent var(--surface) transparent",
        };
      case "left":
        return {
          ...arrowBase,
          right: "-12px",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "12px 0 12px 12px",
          borderColor: "transparent transparent transparent var(--surface)",
        };
      case "right":
        return {
          ...arrowBase,
          left: "-12px",
          top: "50%",
          transform: "translateY(-50%)",
          borderWidth: "12px 12px 12px 0",
          borderColor: "transparent var(--surface) transparent transparent",
        };
      default:
        return {};
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay with spotlight */}
      <div className="absolute inset-0">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

        {/* */}
        {highlightRect && !isCenterPlacement && (
          <div
            className="absolute border-2 border-[var(--primary)] rounded-lg transition-all duration-300 pointer-events-auto cursor-pointer"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: `
                0 0 0 9999px rgba(0, 0, 0, 0.6),
                0 0 20px rgba(var(--primary-rgb, 59, 130, 246), 0.3)
              `,
              // Make the highlight area clickable to advance the tour
              background: "transparent",
            }}
            onClick={(e) => {
              // Check if the click is within the target element bounds before advancing
              const targetElement = document.querySelector(
                steps[currentStep].target,
              );
              if (targetElement) {
                // Get bounding rect of the target element
                const rect = targetElement.getBoundingClientRect();
                const clickX = e.clientX;
                const clickY = e.clientY;

                // Check if click is within the target element's bounding box
                if (
                  clickX >= rect.left &&
                  clickX <= rect.right &&
                  clickY >= rect.top &&
                  clickY <= rect.bottom
                ) {
                  // Simulate click on target element
                  (targetElement as HTMLElement).click();
                }
              }
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          ref={tooltipRef}
          className={`absolute z-10 w-[340px] transition-all duration-300 pointer-events-auto ${
            isCenterPlacement ? "-translate-x-1/2 -translate-y-1/2" : ""
          }`}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          <div className="timer-card relative">
            {/* Arrow */}
            {!isCenterPlacement && <div style={getArrowStyles()} />}

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {step.icon && (
                  <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
                    <span className="text-[var(--primary)]">{step.icon}</span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--surface-elevated)]"
                aria-label="Close tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              {step.content}
            </p>

            {/* Hint to click element */}
            {!isCenterPlacement && (
              <p className="text-xs text-[var(--text-muted)] mb-3 italic">
                Click the highlighted element to interact and continue
              </p>
            )}

            {/* Progress indicator */}
            <div className="flex items-center gap-1.5 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-6 bg-[var(--primary)]"
                      : index < currentStep
                        ? "w-1.5 bg-[var(--primary)]/60"
                        : "w-1.5 bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step counter */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--text-muted)]">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

// Custom hook to manage tour state
export function useTour(tourId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Assume completed until checked

  useEffect(() => {
    const completed = localStorage.getItem(`tour-completed-${tourId}`);
    setHasCompletedTour(completed === "true");
  }, [tourId]);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const completeTour = useCallback(() => {
    setIsOpen(false);
    setHasCompletedTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(`tour-completed-${tourId}`);
    setHasCompletedTour(false);
  }, [tourId]);

  return {
    isOpen,
    hasCompletedTour,
    startTour,
    closeTour,
    completeTour,
    resetTour,
  };
}