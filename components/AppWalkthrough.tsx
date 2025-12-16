"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface AppWalkthroughProps {
  steps: WalkthroughStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  walkthroughId: string;
  title?: string;
  subtitle?: string;
}

export default function AppWalkthrough({
  steps,
  isOpen,
  onClose,
  onComplete,
  walkthroughId,
  title = "Welcome",
  subtitle,
}: AppWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
    localStorage.setItem(`walkthrough-completed-${walkthroughId}`, "true");
    setCurrentStep(0);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(`walkthrough-completed-${walkthroughId}`, "true");
    setCurrentStep(0);
    onClose();
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  if (!mounted || !isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg timer-card border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors z-10"
          aria-label="Close walkthrough"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-statement">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
          )}
        </div>

        {/* Step Navigation Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => handleStepClick(index)}
              className={`group relative transition-all duration-200 ${
                index === currentStep ? "scale-110" : "hover:scale-105"
              }`}
              aria-label={`Go to step ${index + 1}: ${s.title}`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  index === currentStep
                    ? "bg-[var(--primary)]"
                    : index < currentStep
                      ? "bg-[var(--primary)]/50"
                      : "bg-[var(--border)] hover:bg-[var(--border-hover)]"
                }`}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-elevated)] border border-[var(--border)] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="min-h-[140px] sm:min-h-[160px]">
          <div className="flex items-start gap-4">
            {step.icon && (
              <div className="shrink-0 p-3 bg-[var(--primary)]/10 rounded-xl">
                <span className="text-[var(--primary)]">{step.icon}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-2"
            >
              Skip
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] hover:border-[var(--border-hover)] text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Get Started</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Custom hook to manage walkthrough state
export function useWalkthrough(walkthroughId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true); // Assume completed until checked

  useEffect(() => {
    const completed = localStorage.getItem(
      `walkthrough-completed-${walkthroughId}`
    );
    setHasCompleted(completed === "true");

    // If not completed, open the walkthrough
    if (completed !== "true") {
      // Delay opening to avoid jank on initial load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [walkthroughId]);

  const openWalkthrough = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeWalkthrough = useCallback(() => {
    setIsOpen(false);
  }, []);

  const completeWalkthrough = useCallback(() => {
    setIsOpen(false);
    setHasCompleted(true);
  }, []);

  const resetWalkthrough = useCallback(() => {
    localStorage.removeItem(`walkthrough-completed-${walkthroughId}`);
    setHasCompleted(false);
  }, [walkthroughId]);

  return {
    isOpen,
    hasCompleted,
    openWalkthrough,
    closeWalkthrough,
    completeWalkthrough,
    resetWalkthrough,
  };
}