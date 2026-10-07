"use client";

import { useId, useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
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
  const formId = useId();
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
    <Modal open onClose={onClose} size="lg" mobile="fullscreen">
      <Modal.Header title={isNew ? "New Algorithm" : "Edit Algorithm"} />
      <Modal.Body>
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {/* Notation */}
          <div>
            <label className="type-label block mb-1.5">Notation *</label>
            <Input
              value={formData.notation}
              onChange={(e) => handleNotationChange(e.target.value)}
              required
              placeholder="R U R' U R U2 R'"
            />
          </div>

          {/* Move Count with Auto-calculate toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="type-label">Move Count</label>
              <Checkbox
                label="Auto"
                checked={autoMoveCount}
                onChange={(e) => {
                  setAutoMoveCount(e.target.checked);
                  if (e.target.checked) {
                    const count = calculateMoveCount(formData.notation);
                    setFormData((prev) => ({ ...prev, moveCount: count }));
                  }
                }}
              />
            </div>
            <Input
              type="number"
              min={0}
              value={formData.moveCount}
              onChange={(e) => handleMoveCountChange(e.target.value)}
              disabled={autoMoveCount}
            />
          </div>

          {/* Finger Tricks */}
          <div>
            <label className="type-label block mb-1.5">Finger Tricks</label>
            <Input
              value={formData.fingerTricks}
              onChange={(e) =>
                setFormData({ ...formData, fingerTricks: e.target.value })
              }
              placeholder="e.g., Push with right index, pull with left thumb"
            />
          </div>

          {/* Default Checkbox */}
          <Checkbox
            label="Default algorithm for this case"
            checked={formData.isDefault}
            onChange={(e) =>
              setFormData({ ...formData, isDefault: e.target.checked })
            }
          />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          loading={isSubmitting}
          loadingText="Saving…"
        >
          {isNew ? "Add" : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
