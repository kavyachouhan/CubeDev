"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Info,
  Target,
} from "lucide-react";

interface JudgeError {
  id: string;
  type: "misalignment" | "timer-stop" | "timer-start" | "move-during-inspect";
  description: string;
  isPenalty: boolean; // true = should be +2, false = no penalty
  threshold?: number; // for misalignment, the angle threshold
}

interface JudgeErrorStats {
  totalAttempts: number;
  correctDecisions: number;
  falsePositives: number; // Incorrectly said penalty when there wasn't one
  falseNegatives: number; // Incorrectly said no penalty when there was one
}

const STORAGE_KEY = "cubedev_judge_error_stats";

const SCENARIOS: JudgeError[] = [
  {
    id: "1",
    type: "misalignment",
    description: "Single layer misaligned by approximately 35 degrees",
    isPenalty: false,
    threshold: 35,
  },
  {
    id: "2",
    type: "misalignment",
    description: "Two layers misaligned by approximately 50 degrees each",
    isPenalty: true,
    threshold: 50,
  },
  {
    id: "3",
    type: "misalignment",
    description: "Top layer misaligned by 48 degrees",
    isPenalty: true,
    threshold: 48,
  },
  {
    id: "4",
    type: "misalignment",
    description: "Single layer misaligned by 42 degrees",
    isPenalty: false,
    threshold: 42,
  },
  {
    id: "5",
    type: "timer-stop",
    description: "Competitor stopped timer with backs of hands flat on pads",
    isPenalty: false,
  },
  {
    id: "6",
    type: "timer-stop",
    description: "Competitor stopped timer with fingertips only",
    isPenalty: true,
  },
  {
    id: "7",
    type: "timer-stop",
    description:
      "Competitor stopped timer with palms facing down, then quickly lifted",
    isPenalty: false,
  },
  {
    id: "8",
    type: "timer-start",
    description: "Competitor started timer before judge reset it completely",
    isPenalty: true,
  },
  {
    id: "9",
    type: "timer-start",
    description: "Competitor lifted hands after green light, timer showed 0.00",
    isPenalty: false,
  },
  {
    id: "10",
    type: "move-during-inspect",
    description: "Competitor made one move during inspection, then undid it",
    isPenalty: false,
  },
  {
    id: "11",
    type: "move-during-inspect",
    description:
      "Competitor made a full rotation during inspection without undoing it",
    isPenalty: true,
  },
  {
    id: "12",
    type: "misalignment",
    description: "Three layers each misaligned by 30 degrees",
    isPenalty: false,
    threshold: 30,
  },
  {
    id: "13",
    type: "timer-stop",
    description:
      "One hand stopped timer slightly before the other (within 0.1s)",
    isPenalty: false,
  },
  {
    id: "14",
    type: "timer-stop",
    description: "Competitor used wrists to stop timer instead of palms",
    isPenalty: true,
  },
  {
    id: "15",
    type: "misalignment",
    description: "Single layer at exactly 45 degrees",
    isPenalty: false,
    threshold: 45,
  },
  {
    id: "16",
    type: "misalignment",
    description: "Single layer at 46 degrees",
    isPenalty: true,
    threshold: 46,
  },
];

interface JudgeErrorSimulatorProps {
  onComplete?: (stats: JudgeErrorStats) => void;
}

export default function JudgeErrorSimulator({
  onComplete,
}: JudgeErrorSimulatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<JudgeError | null>(
    null
  );
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [stats, setStats] = useState<JudgeErrorStats>({
    totalAttempts: 0,
    correctDecisions: 0,
    falsePositives: 0,
    falseNegatives: 0,
  });
  const [usedScenarios, setUsedScenarios] = useState<Set<string>>(new Set());

  // Load stats
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load judge error stats:", e);
      }
    }
  }, []);

  // Save stats
  useEffect(() => {
    if (stats.totalAttempts > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  const getRandomScenario = useCallback(() => {
    // Filter out used scenarios if possible
    const available = SCENARIOS.filter((s) => !usedScenarios.has(s.id));
    const pool = available.length > 0 ? available : SCENARIOS;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const scenario = pool[randomIndex];

    // Track used scenarios
    if (available.length > 0) {
      setUsedScenarios((prev) => new Set([...prev, scenario.id]));
    } else {
      // Reset if all used
      setUsedScenarios(new Set([scenario.id]));
    }

    return scenario;
  }, [usedScenarios]);

  const startPractice = () => {
    const scenario = getRandomScenario();
    setCurrentScenario(scenario);
    setShowResult(false);
    setUserAnswer(null);
  };

  const submitAnswer = (isPenalty: boolean) => {
    if (!currentScenario || showResult) return;

    setUserAnswer(isPenalty);
    setShowResult(true);

    const isCorrect = isPenalty === currentScenario.isPenalty;

    setStats((prev) => {
      const newStats = {
        totalAttempts: prev.totalAttempts + 1,
        correctDecisions: prev.correctDecisions + (isCorrect ? 1 : 0),
        falsePositives:
          prev.falsePositives +
          (isPenalty && !currentScenario.isPenalty ? 1 : 0),
        falseNegatives:
          prev.falseNegatives +
          (!isPenalty && currentScenario.isPenalty ? 1 : 0),
      };
      onComplete?.(newStats);
      return newStats;
    });
  };

  const resetStats = () => {
    setStats({
      totalAttempts: 0,
      correctDecisions: 0,
      falsePositives: 0,
      falseNegatives: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correctDecisions / stats.totalAttempts) * 100)
      : 0;

  const getTypeIcon = (type: JudgeError["type"]) => {
    switch (type) {
      case "misalignment":
        return "cube";
      case "timer-stop":
        return "hand";
      case "timer-start":
        return "timer";
      case "move-during-inspect":
        return "eye";
      default:
        return "alert";
    }
  };

  const getTypeLabel = (type: JudgeError["type"]) => {
    switch (type) {
      case "misalignment":
        return "Cube Alignment";
      case "timer-stop":
        return "Timer Stop";
      case "timer-start":
        return "Timer Start";
      case "move-during-inspect":
        return "Inspection Move";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="timer-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
          <div className="text-left">
            <h3 className="font-bold text-[var(--text-primary)]">
              Judge Error Trainer
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Practice identifying +2 penalty situations
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {stats.totalAttempts}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Total</div>
            </div>
            <div className="p-2 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-lg font-bold text-[var(--success)]">
                {stats.correctDecisions}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Correct</div>
            </div>
            <div className="p-2 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-lg font-bold text-[var(--warning)]">
                {stats.falsePositives}
              </div>
              <div className="text-xs text-[var(--text-muted)]">False +2</div>
            </div>
            <div className="p-2 bg-[var(--surface-elevated)] rounded-lg text-center">
              <div className="text-lg font-bold text-[var(--error)]">
                {stats.falseNegatives}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Missed +2</div>
            </div>
          </div>

          {/* Scenario Area */}
          {!currentScenario ? (
            <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
              <AlertTriangle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                Judge Decision Practice
              </h4>
              <p className="text-sm text-[var(--text-muted)] mb-4 max-w-md mx-auto">
                Practice identifying whether situations require a +2 penalty
                according to WCA regulations.
              </p>
              <button
                onClick={startPractice}
                className="px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Start Practice
              </button>
            </div>
          ) : (
            <div
              className={`p-6 rounded-xl border-2 transition-all ${
                showResult
                  ? userAnswer === currentScenario.isPenalty
                    ? "border-[var(--success)] bg-[var(--success)]/5"
                    : "border-[var(--error)] bg-[var(--error)]/5"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              {/* Scenario Type Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-medium bg-[var(--surface-elevated)] text-[var(--text-secondary)] rounded">
                  {getTypeLabel(currentScenario.type)}
                </span>
              </div>

              {/* Scenario Description */}
              <div className="mb-6">
                <p className="text-lg text-[var(--text-primary)] font-medium">
                  {currentScenario.description}
                </p>
                {currentScenario.threshold && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    (WCA regulation: &gt;45° misalignment = +2 penalty)
                  </p>
                )}
              </div>

              {/* Answer Buttons or Result */}
              {!showResult ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => submitAnswer(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 border-2 border-[var(--success)] text-[var(--success)] font-medium rounded-lg hover:bg-[var(--success)]/10 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    No Penalty
                  </button>
                  <button
                    onClick={() => submitAnswer(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 border-2 border-[var(--error)] text-[var(--error)] font-medium rounded-lg hover:bg-[var(--error)]/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                    +2 Penalty
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Result */}
                  <div
                    className={`flex items-center gap-3 p-4 rounded-lg ${
                      userAnswer === currentScenario.isPenalty
                        ? "bg-[var(--success)]/20"
                        : "bg-[var(--error)]/20"
                    }`}
                  >
                    {userAnswer === currentScenario.isPenalty ? (
                      <Check className="w-6 h-6 text-[var(--success)]" />
                    ) : (
                      <X className="w-6 h-6 text-[var(--error)]" />
                    )}
                    <div>
                      <div
                        className={`font-bold ${
                          userAnswer === currentScenario.isPenalty
                            ? "text-[var(--success)]"
                            : "text-[var(--error)]"
                        }`}
                      >
                        {userAnswer === currentScenario.isPenalty
                          ? "Correct!"
                          : "Incorrect"}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {currentScenario.isPenalty
                          ? "This IS a +2 penalty situation"
                          : "This is NOT a penalty situation"}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[var(--info)] mt-0.5 shrink-0" />
                      <div className="text-sm text-[var(--text-secondary)]">
                        {currentScenario.type === "misalignment" &&
                          "According to WCA Regulation 10f, a misalignment greater than 45° requires a +2 penalty."}
                        {currentScenario.type === "timer-stop" &&
                          "WCA Regulation A6d requires the competitor to stop the timer with both palms facing down."}
                        {currentScenario.type === "timer-start" &&
                          "The timer must show 0.00 and the green light must be on before starting."}
                        {currentScenario.type === "move-during-inspect" &&
                          "Moves made during inspection must be undone before starting, otherwise it's a +2 penalty."}
                      </div>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={startPractice}
                    className="w-full py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    Next Scenario
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {accuracy}% accuracy
              </span>
            </div>
            {stats.totalAttempts > 0 && (
              <button
                onClick={resetStats}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Stats
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}