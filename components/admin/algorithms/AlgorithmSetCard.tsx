"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Edit2, Trash2, Eye, CheckCircle2 } from "lucide-react";

interface AlgorithmSetCardProps {
  set: {
    _id: Id<"algorithmSets">;
    name: string;
    slug?: string;
    category: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    puzzleType?: string;
    caseCount: number;
    actualCaseCount: number;
    order: number;
    isPublished: boolean;
    totalProgressCount: number;
    masteredCount: number;
    learningCount: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onViewCases: () => void;
}

export function AlgorithmSetCard({
  set,
  onEdit,
  onDelete,
  onViewCases,
}: AlgorithmSetCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-(--success)";
      case "intermediate":
        return "text-(--warning)";
      case "advanced":
        return "text-(--error)";
      default:
        return "text-(--text-muted)";
    }
  };

  const completionRate =
    set.totalProgressCount > 0
      ? Math.round((set.masteredCount / set.totalProgressCount) * 100)
      : 0;

  return (
    <div className="timer-card hover:border-(--border-hover) transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-(--surface-elevated) text-(--text-muted) rounded-full font-inter">
              {set.category}
            </span>
            <span
              className={`text-xs font-medium ${getDifficultyColor(set.difficulty)}`}
            >
              {set.difficulty.charAt(0).toUpperCase() + set.difficulty.slice(1)}
            </span>
            {set.puzzleType && set.puzzleType !== "3x3x3" && (
              <span className="text-xs px-2 py-0.5 bg-(--surface-elevated) text-(--text-muted) rounded-full font-inter">
                {set.puzzleType}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-(--text-primary) font-statement truncate">
            {set.name}
          </h3>
          {set.description && (
            <p className="text-xs text-(--text-muted) font-inter line-clamp-2 mt-1">
              {set.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {set.isPublished ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-(--success)/10 text-(--success) rounded-full text-xs">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Published</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-(--warning)/10 text-(--warning) rounded-full text-xs">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm mb-3">
        <div>
          <p className="text-xs text-(--text-muted) font-inter">Cases</p>
          <p className="font-bold text-(--text-primary) font-statement">
            {set.actualCaseCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--text-muted) font-inter">
            Learning
          </p>
          <p className="font-bold text-(--text-primary) font-statement">
            {set.learningCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--text-muted) font-inter">
            Mastered
          </p>
          <p className="font-bold text-(--success) font-statement">
            {set.masteredCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-(--text-muted) font-inter">
            Learners
          </p>
          <p className="font-bold text-(--text-primary) font-statement">
            {set.totalProgressCount}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {set.totalProgressCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-(--text-muted) font-inter">
              Mastery Rate
            </span>
            <span className="text-xs font-medium text-(--text-primary) font-inter">
              {completionRate}%
            </span>
          </div>
          <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
            <div
              className="h-full bg-(--success) rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-(--border)">
        <button
          onClick={onViewCases}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-(--primary)/10 hover:bg-(--primary)/20 text-(--primary) rounded-lg transition-colors font-inter"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden xs:inline sm:hidden md:inline">
            View Cases
          </span>
          <span className="xs:hidden sm:inline md:hidden">Cases</span>
        </button>
        <button
          onClick={onEdit}
          className="p-2 hover:bg-(--surface-elevated) text-(--text-muted) hover:text-(--primary) rounded-lg transition-colors"
          title="Edit set"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 rounded-lg transition-colors"
          title="Delete set"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
