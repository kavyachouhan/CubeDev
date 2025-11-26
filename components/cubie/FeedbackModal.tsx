"use client";

import { useState } from "react";
import { X, ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackType: "like" | "dislike";
  onSubmit: (comment: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  feedbackType,
  onSubmit,
  isSubmitting,
}: FeedbackModalProps) {
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    await onSubmit(comment);
    setComment("");
  };

  const handleSkip = async () => {
    await onSubmit("");
    setComment("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {feedbackType === "like" ? (
              <div className="p-2 bg-[var(--success)]/10 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-[var(--success)]" />
              </div>
            ) : (
              <div className="p-2 bg-[var(--error)]/10 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-[var(--error)]" />
              </div>
            )}
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] font-statement">
              {feedbackType === "like"
                ? "What did you like?"
                : "What went wrong?"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-[var(--text-secondary)] font-inter">
            {feedbackType === "like"
              ? "Help us understand what worked well so we can improve Cubie AI."
              : "Help us understand what went wrong so we can improve Cubie AI."}
          </p>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback (optional)..."
            disabled={isSubmitting}
            className="w-full px-3 py-2 min-h-[120px] bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--primary)] focus:outline-none rounded-lg resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-inter transition-colors disabled:opacity-50"
            maxLength={500}
          />

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-inter">
            <span>Your feedback helps improve Cubie AI</span>
            <span>{comment.length}/500</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-4 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg transition-colors font-button text-sm disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-white rounded-lg transition-colors font-button text-sm disabled:opacity-50 ${
              feedbackType === "like"
                ? "bg-[var(--success)] hover:bg-[var(--success)]/90"
                : "bg-[var(--error)] hover:bg-[var(--error)]/90"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
