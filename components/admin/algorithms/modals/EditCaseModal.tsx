"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="timer-card max-w-lg w-full my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-(--text-primary) font-statement">
            {isNew ? "New Case" : "Edit Case"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-(--surface-elevated) rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-(--text-muted)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Case Name */}
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
              Case Name *
            </label>
            <input
              type="text"
              value={formData.caseName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              placeholder="e.g., OLL 1, T Perm, etc."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              placeholder="auto-generated-from-name"
            />
          </div>

          {/* Setup Moves */}
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
              Setup Moves *
            </label>
            <input
              type="text"
              value={formData.setupMoves}
              onChange={(e) =>
                setFormData({ ...formData, setupMoves: e.target.value })
              }
              required
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-mono text-sm"
              placeholder="R U R' U R U2 R'"
            />
          </div>

          {/* Recognition */}
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
              Recognition Tips
            </label>
            <input
              type="text"
              value={formData.recognition}
              onChange={(e) =>
                setFormData({ ...formData, recognition: e.target.value })
              }
              className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              placeholder="Comma-separated tips"
            />
            <p className="text-xs text-(--text-muted) font-inter mt-1">
              Comma-separated recognition cues
            </p>
          </div>

          {/* Difficulty, Frequency & Order Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
                Difficulty (1-10)
              </label>
              <input
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
                className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
                Frequency (1-5)
              </label>
              <input
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
                className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-1.5">
                Order
              </label>
              <input
                type="number"
                min={0}
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
              />
            </div>
          </div>

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
              {isSubmitting ? "Saving..." : isNew ? "Add Case" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
