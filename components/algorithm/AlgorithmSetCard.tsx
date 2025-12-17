"use client";

import Link from "next/link";
import { Lock, CheckCircle, Clock } from "lucide-react";

interface AlgorithmSetCardProps {
  setId: string;
  setSlug: string;
  name: string;
  description: string;
  caseCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  puzzleType?: string;
  learned: number;
  mastered: number;
  isLocked?: boolean;
}

export default function AlgorithmSetCard({
  setId,
  setSlug,
  name,
  description,
  caseCount,
  difficulty,
  puzzleType,
  learned,
  mastered,
  isLocked = false,
}: AlgorithmSetCardProps) {
  const progress = (learned / caseCount) * 100;
  const masteryProgress = (mastered / caseCount) * 100;

  const difficultyColors = {
    beginner: "text-green-500",
    intermediate: "text-yellow-500",
    advanced: "text-red-500",
  };

  const difficultyLabels = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };

  const CardContent = () => (
    <div
      className={`timer-card h-full transition-all duration-300 ${
        isLocked
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] font-statement">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p
              className={`text-sm font-medium ${difficultyColors[difficulty]}`}
            >
              {difficultyLabels[difficulty]}
            </p>
            {puzzleType && puzzleType !== "3x3x3" && (
              <span className="text-xs px-2 py-0.5 bg-[var(--surface-elevated)] text-[var(--text-muted)] rounded-full border border-[var(--border)]">
                {puzzleType}
              </span>
            )}
          </div>
        </div>
        {isLocked && <Lock className="w-5 h-5 text-[var(--text-muted)]" />}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
        {description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-[var(--surface-elevated)] rounded">
          <div className="text-lg font-bold text-[var(--text-primary)] font-statement">
            {caseCount}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Cases</div>
        </div>
        <div className="text-center p-2 bg-[var(--surface-elevated)] rounded">
          <div className="text-lg font-bold text-[var(--primary)] font-statement">
            {learned}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Learning</div>
        </div>
        <div className="text-center p-2 bg-[var(--surface-elevated)] rounded">
          <div className="text-lg font-bold text-green-500 font-statement">
            {mastered}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Mastered</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-2">
        {/* Learning Progress */}
        <div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Learning Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Mastery Progress */}
        <div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Mastery</span>
            <span>{Math.round(masteryProgress)}%</span>
          </div>
          <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${masteryProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Badge */}
      {!isLocked && (
        <div className="mt-4">
          {mastered === caseCount ? (
            <div className="flex items-center justify-center gap-2 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                Fully Mastered!
              </span>
            </div>
          ) : learned > 0 ? (
            <div className="flex items-center justify-center gap-2 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--primary)]">
                In Progress
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Not Started
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isLocked) {
    return <CardContent />;
  }

  return (
    <Link href={`/cube-lab/algorithm-trainer/sets/${setSlug}`}>
      <CardContent />
    </Link>
  );
}
