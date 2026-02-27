"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  StickyNote,
  AlertTriangle,
} from "lucide-react";
import DeleteAlgorithmModal from "./DeleteAlgorithmModal";

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

interface CustomAlgorithm {
  id: string;
  name: string;
  notation: string;
  notes?: string;
  createdAt: number;
}

interface CustomAlgorithmCardProps {
  algorithm: CustomAlgorithm;
  onUpdate: (data: {
    name?: string;
    notation?: string;
    notes?: string;
  }) => void;
  onRemove: () => void;
}

function countMoves(notation: string): number {
  if (!notation.trim()) return 0;
  return notation
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0).length;
}

export default function CustomAlgorithmCard({
  algorithm,
  onUpdate,
  onRemove,
}: CustomAlgorithmCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editName, setEditName] = useState(algorithm.name);
  const [editNotation, setEditNotation] = useState(algorithm.notation);
  const [editNotes, setEditNotes] = useState(algorithm.notes || "");

  // Reset edit state when algorithm prop changes (avoids stale data)
  useEffect(() => {
    setEditName(algorithm.name);
    setEditNotation(algorithm.notation);
    setEditNotes(algorithm.notes || "");
  }, [algorithm.name, algorithm.notation, algorithm.notes]);

  const moveCount = countMoves(algorithm.notation);

  const handleSave = () => {
    if (!editName.trim() || !editNotation.trim()) return;

    onUpdate({
      name: editName.trim(),
      notation: editNotation.trim(),
      notes: editNotes.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(algorithm.name);
    setEditNotation(algorithm.notation);
    setEditNotes(algorithm.notes || "");
    setIsEditing(false);
  };

  const handleRemove = () => {
    setShowDeleteModal(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      editName.trim() &&
      editNotation.trim()
    ) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Check for invalid moves in the edit notation to provide immediate feedback to the user
  const editInvalidMoves = editNotation.trim()
    ? editNotation
        .trim()
        .split(/\s+/)
        .filter((move) => move.length > 0 && !isValidMove(move))
    : [];
  const hasEditInvalidMoves = editInvalidMoves.length > 0;

  if (isEditing) {
    return (
      <div className="timer-card space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 font-inter">
            Name
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm font-inter transition-all"
            autoFocus
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 font-inter">
            Notation
          </label>
          <textarea
            value={editNotation}
            onChange={(e) => setEditNotation(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm resize-none transition-all"
            maxLength={500}
          />
          {hasEditInvalidMoves && (
            <div className="flex items-start gap-2 mt-1.5 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-500/80 font-inter">
                Non-standard notation:{" "}
                {editInvalidMoves.map((m) => `"${m}"`).join(", ")}
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 font-inter">
            Notes <span className="font-normal">(optional)</span>
          </label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={2}
            placeholder="Finger tricks, tips..."
            className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm resize-none transition-all font-inter"
            maxLength={500}
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button onClick={handleCancel} className="btn-secondary text-sm py-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editName.trim() || !editNotation.trim()}
            className="btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-card overflow-hidden">
      <div className="flex items-start gap-3">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate font-inter">
              {algorithm.name}
            </h4>
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0 font-inter">
              {moveCount} move{moveCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Notation display */}
          <div className="overflow-hidden mt-1">
            <div
              className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--surface-elevated)] px-2.5 py-1.5 rounded border border-[var(--border)] inline-block max-w-full overflow-x-auto whitespace-nowrap cursor-pointer select-all"
              title="Click to select"
            >
              {algorithm.notation}
            </div>
          </div>

          {/* Notes toggle */}
          {algorithm.notes && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-inter"
            >
              <StickyNote className="w-3 h-3" />
              {isExpanded ? "Hide notes" : "Show notes"}
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Notes content */}
          {isExpanded && algorithm.notes && (
            <p className="mt-2 text-xs text-[var(--text-muted)] bg-[var(--surface-elevated)] border border-[var(--border)] rounded p-2 font-inter">
              {algorithm.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
            title="Edit algorithm"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRemove}
            className="p-2 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors"
            title="Remove from set"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteAlgorithmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={onRemove}
        algorithmName={algorithm.name}
      />
    </div>
  );
}