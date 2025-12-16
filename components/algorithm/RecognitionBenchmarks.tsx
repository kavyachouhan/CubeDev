"use client";

import { useMemo } from "react";
import { Award, AlertTriangle, Lightbulb } from "lucide-react";

interface RecognitionBenchmark {
  level: "pro" | "advanced" | "intermediate" | "beginner" | "needs-work";
  label: string;
  description: string;
  threshold: number; // ms
}

const RECOGNITION_BENCHMARKS: RecognitionBenchmark[] = [
  {
    level: "pro",
    label: "Pro",
    description: "World-class recognition speed",
    threshold: 500,
  },
  {
    level: "advanced",
    label: "Advanced",
    description: "Excellent recognition, competition ready",
    threshold: 1000,
  },
  {
    level: "intermediate",
    label: "Intermediate",
    description: "Good progress, keep practicing",
    threshold: 2000,
  },
  {
    level: "beginner",
    label: "Beginner",
    description: "Recognition is developing",
    threshold: 3500,
  },
  {
    level: "needs-work",
    label: "Needs Work",
    description: "Focus on learning recognition patterns",
    threshold: Infinity,
  },
];

interface RecognitionBenchmarksProps {
  averageRecognitionTime: number; // in ms
  fastestRecognition: number; // in ms
  totalCases: number;
  showGoals?: boolean;
}

// Helper to get styles based on level
function getLevelStyles(level: string, isActive: boolean = false) {
  const styles: Record<
    string,
    { text: string; bg: string; border: string; activeBg: string }
  > = {
    pro: {
      text: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      activeBg: "bg-purple-500",
    },
    advanced: {
      text: "text-green-500 dark:text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      activeBg: "bg-green-500",
    },
    intermediate: {
      text: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      activeBg: "bg-blue-500",
    },
    beginner: {
      text: "text-yellow-500 dark:text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      activeBg: "bg-yellow-500",
    },
    "needs-work": {
      text: "text-red-500 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      activeBg: "bg-red-500",
    },
  };
  return styles[level] || styles["needs-work"];
}

export default function RecognitionBenchmarks({
  averageRecognitionTime,
  fastestRecognition,
  totalCases,
  showGoals = true,
}: RecognitionBenchmarksProps) {
  const currentLevel = useMemo(() => {
    for (const benchmark of RECOGNITION_BENCHMARKS) {
      if (averageRecognitionTime <= benchmark.threshold) {
        return benchmark;
      }
    }
    return RECOGNITION_BENCHMARKS[RECOGNITION_BENCHMARKS.length - 1];
  }, [averageRecognitionTime]);

  const nextLevel = useMemo(() => {
    const currentIndex = RECOGNITION_BENCHMARKS.findIndex(
      (b) => b.level === currentLevel.level
    );
    if (currentIndex > 0) {
      return RECOGNITION_BENCHMARKS[currentIndex - 1];
    }
    return null;
  }, [currentLevel]);

  const progressToNextLevel = useMemo(() => {
    if (!nextLevel) return 100;
    const currentThreshold = currentLevel.threshold;
    const nextThreshold = nextLevel.threshold;
    const range = currentThreshold - nextThreshold;
    const progress = currentThreshold - averageRecognitionTime;
    return Math.max(0, Math.min(100, (progress / range) * 100));
  }, [nextLevel, currentLevel, averageRecognitionTime]);

  const formatTime = (ms: number): string => {
    if (ms === 0) return "N/A";
    return (ms / 1000).toFixed(2) + "s";
  };

  const currentStyles = getLevelStyles(currentLevel.level);

  // Tips based on current level
  const tips = useMemo(() => {
    switch (currentLevel.level) {
      case "needs-work":
        return [
          "Focus on learning recognition patterns one at a time",
          "Study the unique features of each case",
        ];
      case "beginner":
        return [
          "Practice pattern memory mode to build visual memory",
          "Focus on the most common cases first",
        ];
      case "intermediate":
        return [
          "Use blind recognition mode to test yourself",
          "Practice cases you struggle with more frequently",
        ];
      case "advanced":
        return [
          "Focus on instant recognition without hesitation",
          "Practice all angles and AUF variations",
        ];
      case "pro":
        return [
          "Maintain your skills with regular practice",
          "Help others learn recognition techniques",
        ];
      default:
        return [];
    }
  }, [currentLevel.level]);

  if (totalCases === 0) {
    return (
      <div className="timer-card">
        <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-4">
          Recognition Benchmarks
        </h3>
        <div className="text-center py-6">
          <AlertTriangle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">
            Start practicing to see your recognition benchmarks
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-card">
      <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-6">
        Recognition Benchmarks
      </h3>

      <div className="space-y-6">
        {/* Current Level Display */}
        <div
          className={`p-4 rounded-lg border ${currentStyles.bg} ${currentStyles.border}`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className={`w-5 h-5 ${currentStyles.text}`} />
            <span
              className={`text-xl font-bold font-statement uppercase tracking-wide ${currentStyles.text}`}
            >
              {currentLevel.label}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] text-center">
            {currentLevel.description}
          </p>
          <div className="mt-3 text-sm text-[var(--text-muted)] text-center">
            Avg: {formatTime(averageRecognitionTime)} | Best:{" "}
            {formatTime(fastestRecognition)}
          </div>
        </div>

        {/* Progress to Next Level */}
        {showGoals && nextLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                Progress to {nextLevel.label}
              </span>
              <span
                className={`font-semibold ${getLevelStyles(nextLevel.level).text}`}
              >
                Target: {formatTime(nextLevel.threshold)}
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getLevelStyles(nextLevel.level).activeBg}`}
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
            <div className="text-xs text-[var(--text-muted)] text-right">
              {isNaN(progressToNextLevel) ? 0 : progressToNextLevel.toFixed(0)}%
              there
            </div>
          </div>
        )}

        {/* Benchmark Tiers */}
        <div className="pt-4 border-t border-[var(--border)]">
          <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-3">
            Benchmark Tiers
          </h4>
          <div className="space-y-2">
            {RECOGNITION_BENCHMARKS.filter((b) => b.threshold !== Infinity).map(
              (benchmark) => {
                const styles = getLevelStyles(benchmark.level);
                const isActive = currentLevel.level === benchmark.level;

                return (
                  <div
                    key={benchmark.level}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? `${styles.bg} ${styles.border} border`
                        : "bg-[var(--surface-elevated)]"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isActive ? styles.text : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {benchmark.label}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      &lt; {formatTime(benchmark.threshold)}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Tips Section */}
        {tips.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-[var(--primary)]" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Tips to Improve
              </h4>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] mt-2 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}