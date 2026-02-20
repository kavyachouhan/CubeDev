"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface AlgorithmCaseCardProps {
  caseId: string;
  caseSlug: string;
  setId: string;
  setSlug: string;
  caseName: string;
  difficulty: number; // 1-10
  frequency: number; // 1-5
  learningStage?: "new" | "learning" | "reviewing" | "mastered";
  nextReviewDate?: number;
  accuracyRate?: number;
  reviewCount?: number;
  userId?: string;
}

export default function AlgorithmCaseCard({
  caseId,
  caseSlug,
  setId,
  setSlug,
  caseName,
  difficulty,
  frequency,
  learningStage = "new",
  nextReviewDate,
  accuracyRate,
  reviewCount = 0,
  userId,
}: AlgorithmCaseCardProps) {
  const [isMarking, setIsMarking] = useState(false);
  const markAsLearned = useMutation(api.algorithms.markAsLearned);

  const difficultyStars = Math.ceil(difficulty / 2); // Convert to 1-5 scale
  const isDue =
    nextReviewDate && learningStage !== "new" && learningStage !== "mastered"
      ? nextReviewDate <= Date.now()
      : false;

  const stageColors = {
    new: "border-[var(--border)]",
    learning: "border-yellow-500/50",
    reviewing: "border-blue-500/50",
    mastered: "border-green-500/50",
  };

  const stageBadges = {
    new: <span className="text-xs text-[var(--text-muted)]">Not Learned</span>,
    learning: (
      <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded">
        Learning
      </span>
    ),
    reviewing: (
      <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
        Reviewing
      </span>
    ),
    mastered: (
      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded flex items-center gap-1">
        <Star className="w-3 h-3" />
        Mastered
      </span>
    ),
  };

  const handleMarkAsLearned = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || isMarking) return;

    setIsMarking(true);
    try {
      await markAsLearned({
        userId: userId as Id<"users">,
        caseId: caseId as Id<"algorithmCases">,
      });
    } catch (error) {
      console.error("Failed to mark as learned:", error);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Link href={`/cube-lab/algorithm-trainer/cases/${caseSlug}`}>
      <div
        className={`p-4 bg-[var(--surface)] border-2 ${stageColors[learningStage]} rounded-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-1">
              {caseName}
            </h3>
            {stageBadges[learningStage]}
          </div>

          <div className="flex items-center gap-2">
            {isDue && (
              <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500 font-medium">
                Due
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          {/* Difficulty */}
          <div className="flex items-center gap-1">
            <Brain className="w-4 h-4 text-[var(--text-muted)]" />
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < difficultyStars
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-3 mx-0.5 rounded ${
                    i < frequency ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Accuracy */}
          {accuracyRate !== undefined && learningStage !== "new" && (
            <div className="ml-auto text-right">
              <div className="text-xs text-[var(--text-muted)]">Accuracy</div>
              <div
                className={`text-sm font-bold ${
                  reviewCount === 0
                    ? "text-[var(--text-muted)]"
                    : accuracyRate >= 90
                      ? "text-green-500"
                      : accuracyRate >= 70
                        ? "text-yellow-500"
                        : "text-red-500"
                }`}
              >
                {reviewCount === 0 ? "N/A" : `${Math.round(accuracyRate)}%`}
              </div>
            </div>
          )}
        </div>

        {/* Mark as Known Button — only for new cases */}
        {learningStage === "new" && userId && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <button
              onClick={handleMarkAsLearned}
              disabled={isMarking}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isMarking ? "Marking..." : "Already Know This"}
            </button>
          </div>
        )}

        {/* Next Review */}
        {nextReviewDate &&
          learningStage !== "new" &&
          learningStage !== "mastered" && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <div className="text-xs text-[var(--text-muted)]">
                Next review:{" "}
                <span
                  className={
                    isDue
                      ? "text-red-500 font-medium"
                      : "text-[var(--text-primary)]"
                  }
                >
                  {isDue
                    ? "Now"
                    : new Date(nextReviewDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
      </div>
    </Link>
  );
}
