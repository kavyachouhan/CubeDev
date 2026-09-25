"use client";

import { useId, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface CaseFormData {
  caseName: string;
  slug: string;
  setupMoves: string;
  recognition: string;
  difficulty: number;
  frequency: number;
  order: number;
}

interface EditCaseModalProps {
  caseItem?: {
    _id: Id<"algorithmCases">;
    caseName: string;
    slug?: string;
    setupMoves: string;
    recognition?: string[];
    difficulty: number;
    frequency: number;
    order?: number;
  };
  setId: Id<"algorithmSets">;
  onClose: () => void;
  isNew?: boolean;
  caseCount?: number;
}

export function EditCaseModal({
  caseItem,
  setId,
  onClose,
  isNew = false,
  caseCount = 0,
}: EditCaseModalProps) {
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const [formData, setFormData] = useState<CaseFormData>({
    caseName: caseItem?.caseName || "",
    slug: caseItem?.slug || "",
    setupMoves: caseItem?.setupMoves || "",
    recognition: caseItem?.recognition?.join(", ") || "",
    difficulty: caseItem?.difficulty ?? 5,
    frequency: caseItem?.frequency ?? 3,
    order: caseItem?.order ?? caseCount,
  });
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCase = useMutation(api.admin.createAlgorithmCase);
  const updateCase = useMutation(api.admin.updateAlgorithmCase);

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      caseName: name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Parse recognition as array
    const recognitionArray = formData.recognition
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      if (isNew) {
        await createCase({
          setId,
          caseName: formData.caseName,
          slug: formData.slug || generateSlug(formData.caseName),
          setupMoves: formData.setupMoves,
          recognition: recognitionArray,
          difficulty: formData.difficulty,
          frequency: formData.frequency,
          order: formData.order,
        });
      } else if (caseItem) {
        await updateCase({
          caseId: caseItem._id,
          caseName: formData.caseName,
          slug: formData.slug,
          setupMoves: formData.setupMoves,
          recognition: recognitionArray,
          difficulty: formData.difficulty,
          frequency: formData.frequency,
          order: formData.order,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save case:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="lg" mobile="fullscreen">
      <Modal.Header title={isNew ? "New Case" : "Edit Case"} />
      <Modal.Body>
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {/* Case Name */}
          <div>
            <label className="type-label block mb-1.5">Case Name *</label>
            <Input
              value={formData.caseName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="e.g., OLL 1, T Perm, etc."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="type-label block mb-1.5">Slug</label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="auto-generated-from-name"
            />
          </div>

          {/* Setup Moves */}
          <div>
            <label className="type-label block mb-1.5">Setup Moves *</label>
            <Input
              value={formData.setupMoves}
              onChange={(e) =>
                setFormData({ ...formData, setupMoves: e.target.value })
              }
              required
              placeholder="R U R' U R U2 R'"
            />
          </div>

          {/* Recognition */}
          <div>
            <label className="type-label block mb-1.5">Recognition Tips</label>
            <Input
              value={formData.recognition}
              onChange={(e) =>
                setFormData({ ...formData, recognition: e.target.value })
              }
              placeholder="Comma-separated tips"
            />
            <p className="text-xs text-(--text-muted) font-inter mt-1">
              Comma-separated recognition cues
            </p>
          </div>

          {/* Difficulty, Frequency & Order Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="type-label block mb-1.5">
                Difficulty (1-10)
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: parseInt(e.target.value) || 5,
                  })
                }
              />
            </div>
            <div>
              <label className="type-label block mb-1.5">Frequency (1-5)</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: parseInt(e.target.value) || 3,
                  })
                }
              />
            </div>
            <div>
              <label className="type-label block mb-1.5">Order</label>
              <Input
                type="number"
                min={0}
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
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
          {isNew ? "Add Case" : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
