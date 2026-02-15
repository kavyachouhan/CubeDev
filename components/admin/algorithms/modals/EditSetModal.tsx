"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Plus, Trash2 } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="timer-card max-w-lg w-full my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
            {isNew ? "New Algorithm Set" : "Edit Set"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
              placeholder="e.g., OLL, PLL, F2L"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
              placeholder="auto-generated-from-name"
            />
          </div>

          {/* Category with Custom Option */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Category *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={showCustomCategory ? "custom" : formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
              >
                {ALGORITHM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
                <option value="custom">+ Custom Category</option>
              </select>
              {!showCustomCategory && (
                <button
                  type="button"
                  onClick={() => setShowCustomCategory(true)}
                  className="px-3 py-2.5 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-colors font-inter text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Custom</span>
                </button>
              )}
            </div>

            {showCustomCategory && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={formData.customCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, customCategory: e.target.value })
                  }
                  placeholder="Enter custom category name"
                  className="flex-1 px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
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
                  className="p-2.5 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm resize-none"
              placeholder="Brief description of this algorithm set"
            />
          </div>

          {/* Difficulty & Puzzle Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    difficulty: e.target.value as SetFormData["difficulty"],
                  })
                }
                className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Puzzle Type
              </label>
              <select
                value={formData.puzzleType}
                onChange={(e) =>
                  setFormData({ ...formData, puzzleType: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
              >
                {PUZZLE_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
              Display Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
            />
          </div>

          {/* Published Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) =>
                setFormData({ ...formData, isPublished: e.target.checked })
              }
              className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--text-primary)] font-inter">
              Published (visible to users)
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors font-inter text-sm order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition-colors font-inter text-sm disabled:opacity-50 order-1 sm:order-2"
            >
              {isSubmitting
                ? "Saving..."
                : isNew
                  ? "Create Set"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
