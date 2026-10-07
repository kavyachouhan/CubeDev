"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Target, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface TimerGettingStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNow: () => void;
  onCreateFocusedSession: () => Promise<void> | void;
  isCreatingSession?: boolean;
}

const STEPS = [
  {
    icon: Upload,
    title: "Import previous solves",
    body: "Start with real history, not an empty graph.",
  },
  {
    icon: Target,
    title: "Create a focused session",
    body: "Keep practice structured and measurable.",
  },
  {
    icon: TrendingUp,
    title: "Turn stats into decisions",
    body: "Use analytics and Coach to adjust what to train next.",
  },
];

export default function TimerGettingStartedModal({
  isOpen,
  onClose,
  onImportNow,
  onCreateFocusedSession,
  isCreatingSession = false,
}: TimerGettingStartedModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} size="lg" mobile="sheet" closeOnBackdrop={false}>
      <Modal.Header
        title="Getting Started"
        description="Bring your old solves into CubeDev."
        closeLabel="Close getting started"
      />
      <Modal.Body className="space-y-5">
        <p className="type-body">
          Import from csTimer, CubeDesk, CubeTime, Twisty Timer, or any timer to
          unlock deeper stats and cleaner progress tracking instantly.
        </p>

        <div className="space-y-2">
          <div
            role="progressbar"
            aria-label="Setup progress"
            aria-valuenow={25}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full rounded-full bg-(--surface-elevated)"
          >
            <div className="h-full w-1/4 rounded-full bg-(--primary)" />
          </div>
          <p className="type-caption">
            Quick start: import, set one focused session, then train with
            data-backed feedback.
          </p>
        </div>

        <ol className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4 space-y-3">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 shrink-0 text-(--primary)" aria-hidden />
              <div>
                <p className="type-label">{title}</p>
                <p className="type-caption">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-between text-sm font-inter">
          <button
            type="button"
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            Maybe later
          </button>
          <Link
            href="/cube-lab/coach"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-(--primary) hover:text-(--primary-hover) transition-colors"
          >
            Try Coach
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onCreateFocusedSession}
          loading={isCreatingSession}
          loadingText="Creating session…"
        >
          Create Focused Session
        </Button>
        <Button
          onClick={onImportNow}
          iconLeft={<Upload className="w-4 h-4" />}
          iconRight={<ArrowRight className="w-4 h-4" />}
          data-autofocus
        >
          Import Solves Now
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
