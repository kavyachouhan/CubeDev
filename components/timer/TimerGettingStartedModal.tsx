"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Target,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";

interface TimerGettingStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNow: () => void;
  onCreateFocusedSession: () => Promise<void> | void;
  isCreatingSession?: boolean;
}

export default function TimerGettingStartedModal({
  isOpen,
  onClose,
  onImportNow,
  onCreateFocusedSession,
  isCreatingSession = false,
}: TimerGettingStartedModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-(--text-primary) font-statement">
            Getting Started
          </h2>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
            aria-label="Close getting started"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-(--text-primary) font-semibold font-inter mb-1">
              Bring your old solves into CubeDev.
            </p>
            <p className="text-sm text-(--text-secondary) font-inter leading-relaxed">
              Import from csTimer, CubeDesk, CubeTime, Twisty Timer, or any
              timer to unlock deeper stats and cleaner progress tracking
              instantly.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-2 w-full rounded-full bg-(--surface-elevated)">
              <div className="h-full w-1/4 rounded-full bg-(--primary)" />
            </div>
            <p className="text-xs text-(--text-muted) font-inter">
              Quick start: import, set one focused session, then train with
              data-backed feedback.
            </p>
          </div>

          <div className="timer-card bg-(--surface-elevated) border border-(--border) p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Upload className="w-4 h-4 mt-0.5 text-(--primary)" />
              <div>
                <p className="text-sm font-medium text-(--text-primary) font-inter">
                  Import previous solves
                </p>
                <p className="text-xs text-(--text-muted) font-inter">
                  Start with real history, not an empty graph.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-4 h-4 mt-0.5 text-(--primary)" />
              <div>
                <p className="text-sm font-medium text-(--text-primary) font-inter">
                  Create a focused session
                </p>
                <p className="text-xs text-(--text-muted) font-inter">
                  Keep practice structured and measurable.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 mt-0.5 text-(--primary)" />
              <div>
                <p className="text-sm font-medium text-(--text-primary) font-inter">
                  Turn stats into decisions
                </p>
                <p className="text-xs text-(--text-muted) font-inter">
                  Use analytics and Coach to adjust what to train next.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <button onClick={onImportNow} className="w-full btn-primary">
              <span className="inline-flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Import Solves Now
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={onCreateFocusedSession}
              disabled={isCreatingSession}
              className="w-full btn-secondary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreatingSession
                ? "Creating Session..."
                : "Create Focused Session"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={onClose}
                className="text-(--text-muted) hover:text-(--text-primary) transition-colors font-inter"
              >
                Maybe Later
              </button>
              <Link
                href="/cube-lab/coach"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-(--primary) hover:text-(--primary-hover) transition-colors font-inter"
              >
                Try Coach
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
