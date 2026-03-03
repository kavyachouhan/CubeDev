"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";
import { calculateMoveCount } from "../shared";

interface AlgorithmFormData {
  notation: string;
  moveCount: number;
  fingerTricks: string;
  isDefault: boolean;
}

interface EditAlgorithmModalProps {
  algorithm?: {
    _id: Id<"algorithms">;
    notation: string;
    moveCount?: number;
    fingerTricks?: string;
    isDefault?: boolean;
  } | null;
  caseId: Id<"algorithmCases">;
  onClose: () => void;
  isNew?: boolean;
}

export function EditAlgorithmModal({
  algorithm,
  caseId,
  onClose,
  isNew = false,
}: EditAlgorithmModalProps) {
  const [formData, setFormData] = useState<AlgorithmFormData>({
    notation: algorithm?.notation || "",
    moveCount: algorithm?.moveCount || 0,
    fingerTricks: algorithm?.fingerTricks || "",

    isDefault: algorithm?.isDefault ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoMoveCount, setAutoMoveCount] = useState(true);

  const createAlg = useMutation(api.admin.createAlgorithm);
  const updateAlg = useMutation(api.admin.updateAlgorithm);

  // Auto-calculate move count when notation changes
  useEffect(() => {
    if (autoMoveCount && formData.notation) {
      const count = calculateMoveCount(formData.notation);
      setFormData((prev) => ({ ...prev, moveCount: count }));
    }
  }, [formData.notation, autoMoveCount]);

  const handleNotationChange = (notation: string) => {
    setFormData({ ...formData, notation });
  };

  const handleMoveCountChange = (value: string) => {
    setAutoMoveCount(false);
    setFormData({ ...formData, moveCount: parseInt(value) || 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isNew) {
        await createAlg({
          caseId,
          notation: formData.notation,
          moveCount: formData.moveCount,
          fingerTricks: formData.fingerTricks || undefined,
          isDefault: formData.isDefault,
        });
      } else if (algorithm) {
        await updateAlg({
          algId: algorithm._id,
          notation: formData.notation,
          moveCount: formData.moveCount,
          fingerTricks: formData.fingerTricks || undefined,
          isDefault: formData.isDefault,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save algorithm:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="timer-card max-w-lg w-full my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-(--text-primary) font-statement">
            {isNew ? "New Algorithm" : "Edit Algorithm"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-(--surface-elevated) rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notation */}
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
              Notation *
            </label>
            <input
              type="text"
              value={formData.notation}
              onChange={(e) => handleNotationChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-mono text-sm"
              placeholder="R U R' U R U2 R'"
            />
          </div>

          {/* Move Count with Auto-calculate toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-(--text-secondary) font-inter">
                Move Count
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoMoveCount}
                  onChange={(e) => {
                    setAutoMoveCount(e.target.checked);
                    if (e.target.checked) {
                      const count = calculateMoveCount(formData.notation);
                      setFormData((prev) => ({ ...prev, moveCount: count }));
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-(--border) bg-(--surface-elevated) text-(--primary) focus:ring-(--primary)"
                />
                <span className="text-xs text-(--text-muted) font-inter">
                  Auto
                </span>
              </label>
            </div>
            <input
              type="number"
              min={0}
              value={formData.moveCount}
              onChange={(e) => handleMoveCountChange(e.target.value)}
              disabled={autoMoveCount}
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm disabled:opacity-60"
            />
          </div>

          {/* Finger Tricks */}
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
              Finger Tricks
            </label>
            <input
              type="text"
              value={formData.fingerTricks}
              onChange={(e) =>
                setFormData({ ...formData, fingerTricks: e.target.value })
              }
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              placeholder="e.g., Push with right index, pull with left thumb"
            />
          </div>

          {/* Default Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              className="w-4 h-4 rounded border-(--border) bg-(--surface-elevated) text-(--primary) focus:ring-(--primary)"
            />
            <span className="text-sm text-(--text-primary) font-inter">
              Default algorithm for this case
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-(--surface-elevated) hover:bg-(--border) text-(--text-primary) font-medium rounded-lg transition-colors font-inter text-sm order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-(--primary) hover:bg-(--primary-hover) text-white font-medium rounded-lg transition-colors font-inter text-sm disabled:opacity-50 order-1 sm:order-2"
            >
              {isSubmitting ? "Saving..." : isNew ? "Add" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
