"use client";

import { useState, useEffect } from "react";
import { X, MessageSquareText } from "lucide-react";

interface FeedbackBannerProps {
  onOpenSurvey: () => void;
  onDismiss: () => void;
  delayMs?: number;
}

export default function FeedbackBanner({
  onOpenSurvey,
  onDismiss,
  delayMs = 180000, // Default 3 minutes
}: FeedbackBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      // Use requestAnimationFrame to ensure the animation classes are applied after the component is rendered
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for the animation to finish before calling onDismiss
    setTimeout(() => {
      setIsAnimating(false);
      onDismiss();
    }, 300);
  };

  const handleOpenSurvey = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsAnimating(false);
      onOpenSurvey();
    }, 300);
  };

  if (!isAnimating) return null;

  return (
    <div
      className={`fixed top-20 left-4 right-4 sm:left-auto sm:top-20 sm:right-4 sm:max-w-sm z-[60] transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Spacebar") {
          e.stopPropagation();
        }
      }}
    >
      <div className="timer-card relative border-(--primary) bg-(--surface) !p-3">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          aria-label="Dismiss feedback prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-2 pr-5">
          <div className="w-8 h-8 bg-(--primary)/10 rounded-lg flex items-center justify-center shrink-0">
            <MessageSquareText className="w-4 h-4 text-(--primary)" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-(--text-primary) font-inter leading-tight">
              Help us improve CubeDev
            </h3>
            <p className="text-xs text-(--text-muted) font-inter mt-0.5 leading-snug">
              Share your feedback to help make CubeDev better.
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleOpenSurvey}
                className="px-3 py-1 bg-(--primary) hover:bg-(--primary-hover) text-white text-xs font-medium rounded-lg transition-colors font-inter"
              >
                Give Feedback
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1 text-(--text-muted) hover:text-(--text-primary) text-xs font-medium rounded-lg transition-colors hover:bg-(--surface-elevated) font-inter"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}