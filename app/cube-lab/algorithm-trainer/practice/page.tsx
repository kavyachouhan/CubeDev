"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import {
  RecognitionFlashCard,
  ExecutionPracticeCard,
  BlindRecognitionCard,
} from "@/components/algorithm";
import { AlgorithmPracticeSkeleton } from "@/components/SkeletonLoaders";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

type PracticeMode = "srs" | "drill" | "all" | "infinite" | "custom";
type DrillType = "rec" | "exec" | "pattern" | "blind";

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalTime: 0,
    times: [] as number[],
  });
  const [sessionStartTime] = useState(Date.now());
  const [randomizedCases, setRandomizedCases] = useState<any[] | null>(null);
  const [infiniteRepeatCount, setInfiniteRepeatCount] = useState(0);

  const mode = (searchParams.get("mode") || "srs") as PracticeMode;
  const drillType = (searchParams.get("type") || "rec") as DrillType;
  const caseSlug = searchParams.get("case");
  const customSetId = searchParams.get("setId");

  // Determine drill focus and options
  const drillFocus = drillType === "exec" ? "execution" : "recognition";
  const usePatternMemory = drillType === "pattern";
  const useBlindRecognition = drillType === "blind";
  const isInfiniteMode = mode === "infinite";

  // Queries based on mode
  const dueReviews = useQuery(
    api.algorithms.getDueReviews,
    user?.convexId && mode === "srs" ? { userId: user.convexId } : "skip"
  );

  const drillCases = useQuery(
    api.algorithms.getRandomPracticeCases,
    user?.convexId && mode === "drill"
      ? { userId: user.convexId, count: 15 }
      : "skip"
  );

  // Queries based on mode
  const singleCase = useQuery(
    api.algorithms.getCaseForPractice,
    user?.convexId && caseSlug && (mode === "all" || mode === "infinite")
      ? { userId: user.convexId, caseSlug }
      : "skip"
  );

  // Queries based on mode
  const customSetCases = useQuery(
    api.algorithms.getCustomSetCasesForPractice,
    user?.convexId && mode === "custom" && customSetId
      ? {
          userId: user.convexId,
          setId: customSetId as Id<"customAlgorithmSets">,
        }
      : "skip"
  );

  // Queries based on mode
  const allCaseNames = useQuery(
    api.algorithms.getAllCaseNames,
    useBlindRecognition ? {} : "skip"
  );

  // Determine raw cases based on mode
  const rawCases =
    mode === "infinite" && singleCase
      ? singleCase
      : mode === "all" && singleCase
        ? singleCase
        : mode === "custom"
          ? customSetCases
          : mode === "srs"
            ? dueReviews
            : drillCases;

  if (rawCases && !randomizedCases) {
    const shuffled = [...rawCases].sort(() => Math.random() - 0.5);
    setRandomizedCases(shuffled);
  }

  const casesToReview = randomizedCases || rawCases;

  const recordReview = useMutation(api.algorithms.recordReview);
  const recordPracticeSession = useMutation(
    api.algorithms.recordPracticeSession
  );

  const handleAnswer = async (
    timeMs: number,
    correct: boolean,
    rating?: "again" | "hard" | "good" | "easy"
  ) => {
    if (!casesToReview || casesToReview.length === 0 || !user) return;

    const currentReview = casesToReview[currentIndex];

    setSessionStats((prev) => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: !correct ? prev.incorrect + 1 : prev.incorrect,
      totalTime: prev.totalTime + timeMs,
      times: [...prev.times, timeMs],
    }));

    // In infinite mode, just repeat the same case indefinitely
    if (isInfiniteMode) {
      setInfiniteRepeatCount((prev) => prev + 1);
      // Re-apply randomization to avoid pattern learning
      setRandomizedCases((prev) => (prev ? [...prev] : null));
      return;
    }

    try {
      await recordReview({
        userId: user.convexId as Id<"users">,
        caseId: currentReview.case!._id,
        rating: rating || (correct ? "good" : "again"),
        recognitionTime: drillFocus === "recognition" ? timeMs : undefined,
        executionTime: drillFocus === "execution" ? timeMs : undefined,
        wasCorrect: correct,
      });
    } catch (error) {
      console.error("Failed to record review:", error);
    }

    if (currentIndex < casesToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await finishSession();
    }
  };

  const handleExecutionComplete = async (timeMs: number) => {
    await handleAnswer(timeMs, true);
  };

  const finishSession = async () => {
    if (!user) return;

    const totalCases = sessionStats.correct + sessionStats.incorrect;
    const sessionDuration = Date.now() - sessionStartTime;
    const avgTime =
      sessionStats.times.length > 0
        ? sessionStats.times.reduce((a, b) => a + b, 0) /
          sessionStats.times.length
        : undefined;
    const accuracyRate =
      totalCases > 0 ? (sessionStats.correct / totalCases) * 100 : 100;

    // Determine session type
    let sessionType: "recognition" | "execution" | "drill" | "mixed";
    if (mode === "srs") {
      sessionType = "mixed";
    } else if (drillType === "blind") {
      sessionType = "drill";
    } else if (drillType === "exec") {
      sessionType = "execution";
    } else {
      sessionType = "recognition";
    }

    try {
      await recordPracticeSession({
        userId: user.convexId as Id<"users">,
        sessionType,
        casesReviewed: totalCases,
        averageRecognitionTime:
          drillFocus === "recognition" ? avgTime : undefined,
        averageExecutionTime: drillFocus === "execution" ? avgTime : undefined,
        accuracyRate,
        duration: sessionDuration,
      });
    } catch (error) {
      console.error("Failed to record session:", error);
    }

    setSessionCompleted(true);
  };

  if (!user) {
    return null;
  }

  if (casesToReview === undefined) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <AlgorithmPracticeSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  if (casesToReview.length === 0) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="h-full flex items-center justify-center p-4">
            <div className="timer-card max-w-md text-center">
              <div className="mb-4">
                {mode === "srs" ? (
                  <Check className="w-16 h-16 text-green-500 mx-auto" />
                ) : (
                  <X className="w-16 h-16 text-red-500 mx-auto" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-4">
                {mode === "srs" ? "All Caught Up" : "No Cases to Practice"}
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                {mode === "srs"
                  ? "You don't have any reviews due right now. Great job!"
                  : "You haven't started learning any cases yet."}
              </p>
              <div className="flex flex-col gap-3">
                {mode === "srs" && (
                  <Link
                    href="/cube-lab/algorithm-trainer/practice?mode=drill&type=rec"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                  >
                    Start Drill Practice
                  </Link>
                )}
                <Link
                  href="/cube-lab/algorithm-trainer"
                  className="inline-flex items-center gap-2 justify-center px-6 py-3 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Algorithm Trainer
                </Link>
              </div>
            </div>
          </div>
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  const currentReview = casesToReview[currentIndex];
  const progressPercentage = ((currentIndex + 1) / casesToReview.length) * 100;

  if (sessionCompleted) {
    const totalCases = sessionStats.correct + sessionStats.incorrect;
    const accuracyRate =
      totalCases > 0 ? (sessionStats.correct / totalCases) * 100 : 100;
    const avgTime =
      sessionStats.totalTime > 0 && totalCases > 0
        ? (sessionStats.totalTime / totalCases / 1000).toFixed(1)
        : "0.0";
    const totalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
    const totalTimeStr =
      totalTime >= 60
        ? `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`
        : `${totalTime}s`;

    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="h-full flex items-center justify-center p-4">
            <div className="timer-card max-w-2xl w-full text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-2">
                {mode === "srs" ? "Review Complete" : "Session Complete"}
              </h2>
              <p className="text-[var(--text-muted)] mb-8">
                {mode === "srs"
                  ? "All due reviews completed! Come back later for more."
                  : "Great work! You've completed your practice session."}
              </p>

              {/* Stats Grid - Different for each mode */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {/* Cases Reviewed - Always show */}
                <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--primary)] font-statement">
                    {totalCases}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">
                    Cases
                  </div>
                </div>

                {/* Correct/Accuracy - Show for pattern, blind, SRS */}
                {(drillType === "pattern" ||
                  drillType === "blind" ||
                  mode === "srs") && (
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="text-2xl font-bold text-green-500 font-statement">
                      {accuracyRate.toFixed(0)}%
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Accuracy
                    </div>
                  </div>
                )}

                {/* Avg Time - Show for execution and recognition */}
                {(drillType === "exec" || drillType === "rec") &&
                  sessionStats.times.length > 0 && (
                    <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                      <div className="text-2xl font-bold text-blue-500 font-statement">
                        {avgTime}s
                      </div>
                      <div className="text-sm text-[var(--text-muted)] mt-1">
                        Avg Time
                      </div>
                    </div>
                  )}

                {/* Session Duration - Always show */}
                <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                  <div className="text-2xl font-bold text-orange-500 font-statement">
                    {totalTimeStr}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] mt-1">
                    Duration
                  </div>
                </div>

                {/* Correct Count - Show for SRS */}
                {mode === "srs" && (
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="text-2xl font-bold text-green-500 font-statement">
                      {sessionStats.correct}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Remembered
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/cube-lab/algorithm-trainer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium"
                >
                  Back to Trainer
                </Link>
                <button
                  onClick={() => {
                    setSessionCompleted(false);
                    setCurrentIndex(0);
                    setHasStarted(false);
                    setRandomizedCases(null);
                    setSessionStats({
                      correct: 0,
                      incorrect: 0,
                      totalTime: 0,
                      times: [],
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors font-medium"
                >
                  Practice Again
                </button>
              </div>
            </div>
          </div>
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Link
                href="/cube-lab/algorithm-trainer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors w-fit mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Algorithm Trainer
              </Link>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement mb-2">
                    {mode === "srs"
                      ? "SRS Review"
                      : mode === "infinite"
                        ? "Infinite Drill"
                        : mode === "custom"
                          ? "Custom Set Practice"
                          : "Drill Practice"}
                  </h1>
                  <p className="text-[var(--text-muted)]">
                    {mode === "infinite"
                      ? `Drilling: ${casesToReview[0]?.case?.caseName || "Loading..."}`
                      : mode === "srs"
                        ? "Review"
                        : "Practice"}{" "}
                    {mode !== "infinite" && (
                      <>
                        {casesToReview.length} case
                        {casesToReview.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </p>
                </div>

                {/* Toggle Controls */}
                {mode === "drill" && !hasStarted && (
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {/* Recognition/Execution/Blind Toggle */}
                    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 w-full sm:w-auto flex-wrap">
                      <Link
                        href="/cube-lab/algorithm-trainer/practice?mode=drill&type=rec"
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors text-center ${
                          drillType === "rec"
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        Recognition
                      </Link>
                      <Link
                        href="/cube-lab/algorithm-trainer/practice?mode=drill&type=exec"
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors text-center ${
                          drillType === "exec"
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        Execution
                      </Link>
                      <Link
                        href="/cube-lab/algorithm-trainer/practice?mode=drill&type=blind"
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors text-center ${
                          drillType === "blind"
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        Blind
                      </Link>
                    </div>

                    {/* Pattern Memory Toggle - Only for Recognition */}
                    {(drillType === "rec" || drillType === "pattern") && (
                      <Link
                        href={`/cube-lab/algorithm-trainer/practice?mode=drill&type=${drillType === "pattern" ? "rec" : "pattern"}`}
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border w-full sm:w-auto ${
                          drillType === "pattern"
                            ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                        }`}
                      >
                        {drillType === "pattern" && (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Pattern Memory
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar - different for infinite mode */}
            <div className="timer-card">
              {isInfiniteMode ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      Infinite Drill
                    </span>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-sm text-[var(--text-muted)]">
                        {infiniteRepeatCount} repetitions
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Keep practicing until you feel confident. Use the back
                    button to exit.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      Progress
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">
                      {currentIndex + 1} / {casesToReview.length}
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </>
              )}

              {hasStarted && (
                <div
                  className={`grid gap-4 mt-4 ${drillType === "rec" && !isInfiniteMode ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  <div className="text-center p-3 rounded-lg bg-[var(--surface-elevated)]">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xl font-bold text-green-500 font-statement">
                        {sessionStats.correct}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {drillType === "rec" && !isInfiniteMode
                        ? "Completed"
                        : "Correct"}
                    </div>
                  </div>

                  {(drillType === "pattern" ||
                    drillType === "blind" ||
                    isInfiniteMode) && (
                    <div className="text-center p-3 rounded-lg bg-[var(--surface-elevated)]">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-xl font-bold text-red-500 font-statement">
                          {sessionStats.incorrect}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Incorrect
                      </div>
                    </div>
                  )}

                  {drillType === "exec" && sessionStats.times.length > 0 && (
                    <div className="text-center p-3 rounded-lg bg-[var(--surface-elevated)]">
                      <div className="text-xl font-bold text-[var(--primary)] font-statement mb-1">
                        {(
                          sessionStats.times.reduce((a, b) => a + b, 0) /
                          sessionStats.times.length /
                          1000
                        ).toFixed(1)}
                        s
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Avg Time
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Practice Card */}
            {currentReview && currentReview.case && (
              <>
                {drillType === "exec" ? (
                  <ExecutionPracticeCard
                    caseName={currentReview.case.caseName}
                    algorithm={
                      currentReview.algorithm?.notation ||
                      currentReview.case.setupMoves
                    }
                    setupMoves={currentReview.case.setupMoves}
                    onComplete={handleExecutionComplete}
                    hasStarted={hasStarted}
                    onStart={() => setHasStarted(true)}
                  />
                ) : useBlindRecognition ? (
                  <BlindRecognitionCard
                    caseName={currentReview.case.caseName}
                    setupMoves={currentReview.case.setupMoves}
                    recognition={currentReview.case.recognition}
                    algorithm={currentReview.algorithm?.notation}
                    allCaseNames={allCaseNames || []}
                    onAnswer={handleAnswer}
                    hasStarted={hasStarted}
                    onStart={() => setHasStarted(true)}
                  />
                ) : (
                  <RecognitionFlashCard
                    key={
                      isInfiniteMode
                        ? `infinite-${infiniteRepeatCount}`
                        : `case-${currentIndex}`
                    }
                    caseName={currentReview.case.caseName}
                    setupMoves={currentReview.case.setupMoves}
                    recognition={currentReview.case.recognition}
                    algorithm={currentReview.algorithm?.notation}
                    onAnswer={handleAnswer}
                    mode={mode}
                    usePatternMemory={usePatternMemory}
                    hasStarted={hasStarted}
                    onStart={() => setHasStarted(true)}
                    showSrsRatings={mode === "srs"}
                    isInfiniteMode={isInfiniteMode}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <CubeLabLayout activeSection="algorithm-trainer">
            <AlgorithmPracticeSkeleton />
          </CubeLabLayout>
        </ProtectedRoute>
      }
    >
      <PracticePageContent />
    </Suspense>
  );
}