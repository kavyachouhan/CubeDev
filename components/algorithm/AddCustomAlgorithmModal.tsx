"use client";

import { useState, useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

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

  return (
    <Modal open={isOpen} onClose={onClose} size="lg" mobile="sheet">
      <Modal.Header
        title={initialData ? "Edit Algorithm" : "Add Custom Algorithm"}
      />
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body className="space-y-5">
          <Field label="Algorithm Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. T-Perm, Sune, My OLL 21 variant"
              required
              maxLength={100}
              data-autofocus
            />
          </Field>

          <Field
            label="Notation"
            required
            aside={
              notation.trim()
                ? `${moveCount} move${moveCount !== 1 ? "s" : ""}`
                : undefined
            }
            hint="Use standard cube notation (R, U, F, L, D, B and their variations). Separate moves with spaces."
          >
            <Textarea
              value={notation}
              onChange={(e) => setNotation(e.target.value)}
              placeholder="e.g. R U R' U' R' F R2 U' R' U' R U R' F'"
              rows={3}
              className="type-time text-sm! resize-none"
              required
              maxLength={500}
            />
          </Field>

          {hasInvalidMoves && (
            <Alert tone="warning" title="Non-standard notation detected">
              {invalidMoves.map((m) => `"${m}"`).join(", ")}{" "}
              {invalidMoves.length === 1 ? "is" : "are"} not recognized as
              standard cube moves. You can still save, but verify your notation
              is correct.
            </Alert>
          )}

          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Finger tricks, recognition tips, or any other notes…"
              rows={2}
              maxLength={500}
            />
          </Field>

          {notation.trim() && (
            <div className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4">
              <p className="type-overline mb-3">Preview</p>
              <div className="flex flex-wrap gap-1.5">
                {notation
                  .trim()
                  .split(/\s+/)
                  .map((move, i) => (
                    <span
                      key={i}
                      className={`inline-block px-2 py-1 rounded-(--radius-badge) text-xs type-time ${
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            loading={isSubmitting}
            loadingText="Saving…"
          >
            {initialData ? "Save Changes" : "Add Algorithm"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}