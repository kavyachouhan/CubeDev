"use client";

import { useState } from "react";
import { CheckCircle2, TrendingUp, Users, Zap } from "lucide-react";
import CubeVisualizer3D from "./CubeVisualizer3D";

interface Algorithm {
  _id: string;
  notation: string;
  moveCount: number;
  popularity: number;
  fingerTricks?: string;
  averageSpeed?: number;
  isDefault: boolean;
  videoUrl?: string;
  notes?: string;
}

interface AlternativeAlgorithmsProps {
  algorithms: Algorithm[];
  currentAlgId: string;
  onSelectAlgorithm: (algId: string) => void;
}

export default function AlternativeAlgorithms({
  algorithms,
  currentAlgId,
  onSelectAlgorithm,
}: AlternativeAlgorithmsProps) {
  const [expandedAlg, setExpandedAlg] = useState<string | null>(null);

  if (algorithms.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
        Alternative Algorithms ({algorithms.length - 1})
      </h4>

      <div className="space-y-3">
        {algorithms
          .filter((alg) => alg._id !== currentAlgId)
          .map((alg) => {
            const isExpanded = expandedAlg === alg._id;

            return (
              <div
                key={alg._id}
                className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg"
              >
                {/* Algorithm Header */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    {/* Algorithm Notation */}
                    <div className="overflow-x-auto mb-2">
                      <p className="font-mono text-sm text-[var(--text-primary)] whitespace-nowrap">
                        {alg.notation}
                      </p>
                    </div>

                    {/* Algorithm Stats */}
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 flex-shrink-0" />
                        <span>{alg.moveCount} moves</span>
                      </div>

                      {alg.popularity && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span>{alg.popularity}% use this</span>
                        </div>
                      )}

                      {alg.averageSpeed && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 flex-shrink-0" />
                          <span>{alg.averageSpeed.toFixed(2)}s avg</span>
                        </div>
                      )}

                      {alg.isDefault && (
                        <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
                          Recommended
                        </span>
                      )}
                    </div>

                    {/* Fingertricks */}
                    {alg.fingerTricks && (
                      <div className="mt-2 text-xs text-[var(--text-muted)] break-words">
                        <span className="font-medium">Fingertricks:</span>{" "}
                        {alg.fingerTricks}
                      </div>
                    )}

                    {/* Notes */}
                    {alg.notes && (
                      <div className="mt-2 text-xs text-[var(--text-muted)] break-words">
                        <span className="font-medium">Notes:</span> {alg.notes}
                      </div>
                    )}
                  </div>

                  {/* Current Selection Indicator */}
                  {currentAlgId === alg._id && (
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-green-500/10 border border-green-500/20 rounded">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setExpandedAlg(isExpanded ? null : alg._id)}
                    className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--text-secondary)] rounded transition-colors"
                  >
                    {isExpanded ? "Hide Preview" : "Preview"}
                  </button>

                  {currentAlgId !== alg._id && (
                    <button
                      onClick={() => onSelectAlgorithm(alg._id)}
                      className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm rounded transition-colors whitespace-nowrap"
                    >
                      Use This Algorithm
                    </button>
                  )}

                  {alg.videoUrl && (
                    <a
                      href={alg.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--text-secondary)] rounded transition-colors whitespace-nowrap"
                    >
                      Video Tutorial
                    </a>
                  )}
                </div>

                {/* 3D Preview (Expandable) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <CubeVisualizer3D
                      algorithm={alg.notation}
                      puzzle="3x3x3"
                      autoPlay={false}
                      showControls={true}
                      height="250px"
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
