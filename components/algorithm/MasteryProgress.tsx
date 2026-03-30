"use client";

import { Award, BookOpen, RefreshCw } from "lucide-react";

interface MasteryProgressProps {
  totalCases: number;
  mastered: number;
  learning?: number;
  reviewing?: number;
}

export default function MasteryProgress({
  totalCases,
  mastered,
  learning = 0,
  reviewing = 0,
}: MasteryProgressProps) {
  const masteryPercentage = totalCases > 0 ? (mastered / totalCases) * 100 : 0;

  const stages = [
    {
      icon: Award,
      bg: "bg-yellow-500/10",
      text: "text-yellow-500 dark:text-yellow-400",
      value: mastered,
      label: "Mastered",
    },
    {
      icon: BookOpen,
      bg: "bg-blue-500/10",
      text: "text-blue-500 dark:text-blue-400",
      value: learning,
      label: "Learning",
    },
    {
      icon: RefreshCw,
      bg: "bg-purple-500/10",
      text: "text-purple-500 dark:text-purple-400",
      value: reviewing,
      label: "Reviewing",
    },
  ];

  return (
    <div className="timer-card">
      <h3 className="text-lg font-bold text-(--text-primary) font-statement mb-6">
        Mastery Progress
      </h3>
      <div className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-(--text-secondary)">
              Cases Mastered
            </span>
            <span className="text-sm font-semibold text-(--text-primary) font-statement">
              {mastered} / {totalCases}
            </span>
          </div>
          <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
            <div
              className="h-full bg-(--primary) transition-all duration-300"
              style={{ width: `${Math.min(masteryPercentage, 100)}%` }}
            />
          </div>
          <div className="text-right mt-1 text-xs text-(--text-muted)">
            {masteryPercentage.toFixed(0)}% Complete
          </div>
        </div>

        {/* Stage Breakdown */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-(--border)">
          {stages.map((stage) => (
            <div
              key={stage.label}
              className="text-center p-3 rounded-lg bg-(--surface-elevated)"
            >
              <div
                className={`p-2 ${stage.bg} rounded-lg inline-flex items-center justify-center mb-2`}
              >
                <stage.icon className={`w-4 h-4 ${stage.text}`} />
              </div>
              <div className="text-xl font-bold text-(--text-primary) font-statement">
                {stage.value}
              </div>
              <div className="text-xs text-(--text-muted)">
                {stage.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}