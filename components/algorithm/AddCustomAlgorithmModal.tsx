"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

interface AddCustomAlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; notation: string; notes?: string }) => void;
  initialData?: { name: string; notation: string; notes?: string };
}

// Common cube notation moves for validation hint
const VALID_MOVES = [
  "R",
  "L",
  "U",
  "D",
  "F",
  "B",
  "M",
  "E",
  "S",
  "r",
  "l",
  "u",
  "d",
  "f",
  "b",
  "x",
  "y",
  "z",
];

function countMoves(notation: string): number {
  if (!notation.trim()) return 0;
  const tokens = notation.trim().split(/\s+/);
  return tokens.filter((t) => t.length > 0).length;
}

function isValidMove(move: string): boolean {
  return VALID_MOVES.some(
    (m) =>
      move === m ||
      move === m + "'" ||
      move === m + "2" ||
      move === m + "2'" ||
      move === m + "w" ||
      move === m + "w'" ||
      move === m + "w2",
  );
}

export default function AddCustomAlgorithmModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AddCustomAlgorithmModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [notation, setNotation] = useState(initialData?.notation || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setNotation(initialData?.notation || "");
      setNotes(initialData?.notes || "");
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  const moveCount = countMoves(notation);
  const isValid = name.trim().length > 0 && notation.trim().length > 0;

  // Check for invalid moves in the notation to provide user feedback, but still allow saving (in case of typos or non-standard notation)
  const invalidMoves = notation.trim()
    ? notation
        .trim()
        .split(/\s+/)
        .filter((move) => move.length > 0 && !isValidMove(move))
    : [];
  const hasInvalidMoves = invalidMoves.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        notation: notation.trim(),
        notes: notes.trim() || undefined,
      });
      setName("");
      setNotation("");
      setNotes("");
    } catch (error) {
      console.error("Failed to submit algorithm:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-(--text-primary) font-statement">
              {initialData ? "Edit Algorithm" : "Add Custom Algorithm"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Algorithm Name */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Algorithm Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., T-Perm, Sune, My OLL 21 variant"
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
              autoFocus
              required
              maxLength={100}
            />
          </div>

          {/* Algorithm Notation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-(--text-primary) font-inter">
                Notation
              </label>
              {notation.trim() && (
                <span className="text-xs text-(--text-muted) font-inter">
                  {moveCount} move{moveCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <textarea
              value={notation}
              onChange={(e) => setNotation(e.target.value)}
              placeholder="e.g., R U R' U' R' F R2 U' R' U' R U R' F'"
              rows={3}
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-mono text-sm resize-none transition-all font-inter"
              required
              maxLength={500}
            />
            <p className="text-xs text-(--text-muted) mt-1.5 font-inter">
              Use standard cube notation (R, U, F, L, D, B and their
              variations). Separate moves with spaces.
            </p>
            {hasInvalidMoves && (
              <div className="flex items-start gap-2 mt-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-500 font-inter">
                    Non-standard notation detected
                  </p>
                  <p className="text-xs text-yellow-500/80 mt-0.5 font-inter">
                    {invalidMoves.map((m) => `"${m}"`).join(", ")}{" "}
                    {invalidMoves.length === 1 ? "is" : "are"} not recognized as
                    standard cube moves. You can still save, but verify your
                    notation is correct.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Notes{" "}
              <span className="text-(--text-muted) font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Finger tricks, recognition tips, or any other notes..."
              rows={2}
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
              maxLength={500}
            />
          </div>

          {/* Preview */}
          {notation.trim() && (
            <div className="timer-card bg-(--surface-elevated) p-4 border border-(--border)">
              <p className="text-sm font-medium text-(--text-primary) mb-3 font-statement">
                Preview
              </p>
              <div className="flex flex-wrap gap-1.5">
                {notation
                  .trim()
                  .split(/\s+/)
                  .map((move, i) => (
                    <span
                      key={i}
                      className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                        isValidMove(move)
                          ? "bg-(--primary)/10 text-(--primary) border border-(--primary)/20"
                          : "bg-(--surface) text-(--text-secondary) border border-(--border)"
                      }`}
                    >
                      {move}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Save Changes"
                  : "Add Algorithm"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}