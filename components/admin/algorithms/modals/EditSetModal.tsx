"use client";

import { useId, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { AdminSelect } from "../../AdminDropdown";
import {
  ALGORITHM_CATEGORIES,
  DIFFICULTY_OPTIONS,
  PUZZLE_TYPES,
} from "../shared";

interface SetFormData {
  name: string;
  slug: string;
  category: string;
  customCategory: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  puzzleType: string;
  order: number;
  isPublished: boolean;
}

interface EditSetModalProps {
  set?: {
    _id: Id<"algorithmSets">;
    name: string;
    slug?: string;
    category: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    puzzleType?: string;
    order: number;
    isPublished: boolean;
  };
  onClose: () => void;
  isNew?: boolean;
}

export function EditSetModal({
  set,
  onClose,
  isNew = false,
}: EditSetModalProps) {
  // Check if the set's category is custom (not in predefined list)
  const isCustomCategory =
    set?.category &&
    !ALGORITHM_CATEGORIES.some((c) => c.value === set.category);

  const [formData, setFormData] = useState<SetFormData>({
    name: set?.name || "",
    slug: set?.slug || "",
    category: isCustomCategory ? "custom" : set?.category || "CFOP",
    customCategory: isCustomCategory ? set?.category || "" : "",
    description: set?.description || "",
    difficulty: set?.difficulty || "beginner",
    puzzleType: set?.puzzleType || "3x3x3",
    order: set?.order ?? 0,
    isPublished: set?.isPublished ?? false,
  });
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomCategory, setShowCustomCategory] =
    useState(isCustomCategory);

  const createSet = useMutation(api.admin.createAlgorithmSet);
  const updateSet = useMutation(api.admin.updateAlgorithmSet);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: "custom", customCategory: "" });
    } else {
      setShowCustomCategory(false);
      setFormData({ ...formData, category: value, customCategory: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Determine final category
    const finalCategory =
      showCustomCategory && formData.customCategory.trim()
        ? formData.customCategory.trim()
        : formData.category === "custom"
          ? "Other"
          : formData.category;

    try {
      if (isNew) {
        await createSet({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          category: finalCategory,
          description: formData.description,
          difficulty: formData.difficulty,
          puzzleType: formData.puzzleType,
          order: formData.order,
          isPublished: formData.isPublished,
        });
      } else if (set) {
        await updateSet({
          setId: set._id,
          name: formData.name,
          slug: formData.slug,
          category: finalCategory,
          description: formData.description,
          difficulty: formData.difficulty,
          puzzleType: formData.puzzleType,
          order: formData.order,
          isPublished: formData.isPublished,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save set:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="lg" mobile="fullscreen">
      <Modal.Header title={isNew ? "New Algorithm Set" : "Edit Set"} />
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="type-label block mb-1.5">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              placeholder="e.g., OLL, PLL, F2L"
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

          {/* Category with Custom Option */}
          <div>
            <label className="type-label block mb-1.5">Category *</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <AdminSelect
                value={showCustomCategory ? "custom" : formData.category}
                onChange={(val) => handleCategoryChange(val)}
                options={[
                  ...ALGORITHM_CATEGORIES.map((cat) => ({
                    value: cat.value,
                    label: cat.label,
                  })),
                  { value: "custom", label: "+ Custom Category" },
                ]}
                className="flex-1"
                fullWidth
              />
              {!showCustomCategory && (
                <button
                  type="button"
                  onClick={() => setShowCustomCategory(true)}
                  className="px-3 py-2.5 bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-(--radius-control) text-(--text-secondary) transition-colors font-inter text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Custom</span>
                </button>
              )}
            </div>

            {showCustomCategory && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={formData.customCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, customCategory: e.target.value })
                  }
                  placeholder="Enter custom category name"
                  className="flex-1 px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-(--radius-control) text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setFormData({
                      ...formData,
                      category: "CFOP",
                      customCategory: "",
                    });
                  }}
                  className="p-2.5 hover:bg-(--error)/10 text-(--text-muted) hover:text-(--error) rounded-(--radius-control) transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="type-label block mb-1.5">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              placeholder="Brief description of this algorithm set"
            />
          </div>

          {/* Difficulty & Puzzle Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="type-label block mb-1.5">Difficulty</label>
              <AdminSelect
                value={formData.difficulty}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    difficulty: val as SetFormData["difficulty"],
                  })
                }
                options={DIFFICULTY_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                fullWidth
              />
            </div>
            <div>
              <label className="type-label block mb-1.5">Puzzle Type</label>
              <AdminSelect
                value={formData.puzzleType}
                onChange={(val) =>
                  setFormData({ ...formData, puzzleType: val })
                }
                options={PUZZLE_TYPES.map((pt) => ({
                  value: pt.value,
                  label: pt.label,
                }))}
                fullWidth
              />
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="type-label block mb-1.5">Display Order</label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Published Toggle */}
          <Checkbox
            label="Published (visible to users)"
            checked={formData.isPublished}
            onChange={(e) =>
              setFormData({ ...formData, isPublished: e.target.checked })
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
          {isNew ? "Create set" : "Save changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
