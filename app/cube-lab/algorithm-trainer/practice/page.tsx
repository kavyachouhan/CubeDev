"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import {
  RecognitionFlashCard,
  ExecutionPracticeCard,
} from "@/components/algorithm";
import { AlgorithmPracticeSkeleton } from "@/components/SkeletonLoaders";
import { ArrowLeft, Check, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function PracticePage() {
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
    recognitionTimes: [] as number[],
    executionTimes: [] as number[],
  });
  const [sessionStartTime] = useState(Date.now());

  const mode = (searchParams.get("mode") || "due") as
    | "due"
    | "all"
    | "recognition"
    | "execution"; // "due", "all", "recognition", or "execution"
  const specificCase = searchParams.get("case");

  // Get reviews based on mode
  const dueReviews = useQuery(
    api.algorithms.getDueReviews,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Get all learned cases for free practice
  const allLearnedCases = useQuery(
    api.algorithms.getAllLearnedCases,
    user?.convexId &&
      (mode === "all" || mode === "recognition" || mode === "execution")
      ? { userId: user.convexId }
      : "skip"
  );

  // Select which cases to use based on mode
  const casesToReview = mode === "due" ? dueReviews : allLearnedCases;

  // Mutation to record review
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

    // Update session stats
    setSessionStats((prev) => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: !correct ? prev.incorrect + 1 : prev.incorrect,
      totalTime: prev.totalTime + timeMs,
      recognitionTimes:
        mode === "recognition" || mode === "all" || mode === "due"
          ? [...prev.recognitionTimes, timeMs]
          : prev.recognitionTimes,
      executionTimes: prev.executionTimes,
    }));

    // Record the review - behavior differs based on mode
    if (mode === "due" && rating) {
      // SRS mode: record with rating for spaced repetition
      try {
        await recordReview({
          userId: user.convexId as Id<"users">,
          caseId: currentReview.case!._id,
          rating,
          recognitionTime: timeMs,
          wasCorrect: correct,
        });
      } catch (error) {
        console.error("Failed to record SRS review:", error);
      }
    } else if (mode === "recognition" && rating) {
      // Recognition practice mode: record recognition time only
      try {
        await recordReview({
          userId: user.convexId as Id<"users">,
          caseId: currentReview.case!._id,
          rating, // Use the rating for tracking
          recognitionTime: timeMs,
          wasCorrect: correct,
        });
      } catch (error) {
        console.error("Failed to record recognition practice:", error);
      }
    }

    // Move to next case or finish
    if (currentIndex < casesToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete - save practice session
      await finishSession();
    }
  };

  const handleExecutionComplete = async (timeMs: number) => {
    if (!casesToReview || casesToReview.length === 0 || !user) return;

    const currentReview = casesToReview[currentIndex];

    // Update session stats for execution practice
    setSessionStats((prev) => ({
      ...prev,
      correct: prev.correct + 1,
      totalTime: prev.totalTime + timeMs,
      executionTimes: [...prev.executionTimes, timeMs],
    }));

    // For execution practice, record the execution time in backend
    // Use "good" rating by default for execution practice
    try {
      await recordReview({
        userId: user.convexId as Id<"users">,
        caseId: currentReview.case!._id,
        rating: "good",
        executionTime: timeMs,
        wasCorrect: true, // Execution practice is always "correct" - they completed it
      });
    } catch (error) {
      console.error("Failed to record execution review:", error);
    }

    // Move to next case or finish
    if (currentIndex < casesToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete - save practice session
      await finishSession();
    }
  };

  const finishSession = async () => {
    if (!user) return;

    const totalCases = sessionStats.correct + sessionStats.incorrect;
    const sessionDuration = Date.now() - sessionStartTime;

    // Calculate averages
    const avgRecognitionTime =
      sessionStats.recognitionTimes.length > 0
        ? sessionStats.recognitionTimes.reduce((a, b) => a + b, 0) /
          sessionStats.recognitionTimes.length
        : undefined;

    const avgExecutionTime =
      sessionStats.executionTimes.length > 0
        ? sessionStats.executionTimes.reduce((a, b) => a + b, 0) /
          sessionStats.executionTimes.length
        : undefined;

    const accuracyRate =
      totalCases > 0 ? (sessionStats.correct / totalCases) * 100 : 100;

    // Determine session type
    let sessionType: "recognition" | "execution" | "mixed";
    if (mode === "recognition") {
      sessionType = "recognition";
    } else if (mode === "execution") {
      sessionType = "execution";
    } else {
      sessionType = "mixed";
    }

    try {
      await recordPracticeSession({
        userId: user.convexId as Id<"users">,
        sessionType,
        casesReviewed: totalCases,
        averageRecognitionTime: avgRecognitionTime,
        averageExecutionTime: avgExecutionTime,
        accuracyRate,
        duration: sessionDuration,
      });
    } catch (error) {
      console.error("Failed to record practice session:", error);
    }

    // Mark session as completed instead of redirecting
    setSessionCompleted(true);
  };

  // Early returns must happen AFTER all hooks
  if (!user) {
    return null; // ProtectedRoute will handle redirect
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
                {mode === "due" ? (
                  <Check className="w-16 h-16 text-green-500 mx-auto" />
                ) : (
                  <X className="w-16 h-16 text-red-500 mx-auto" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-4">
                {mode === "due" ? "All Caught Up" : "No Cases to Practice"}
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                {mode === "due"
                  ? "You don't have any reviews due right now. Great job!"
                  : "You haven't started learning any cases yet. Start learning cases to practice them here!"}
              </p>
              <div className="flex flex-col gap-3">
                {mode === "due" && (
                  <>
                    <Link
                      href="/cube-lab/algorithm-trainer/practice?mode=recognition"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                    >
                      Recognition Practice
                    </Link>
                    <Link
                      href="/cube-lab/algorithm-trainer/practice?mode=execution"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                    >
                      Execution Practice
                    </Link>
                  </>
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

  // Show completion screen
  if (sessionCompleted) {
    const totalCases = sessionStats.correct + sessionStats.incorrect;
    const accuracyRate =
      totalCases > 0 ? (sessionStats.correct / totalCases) * 100 : 100;
    const avgTime =
      sessionStats.totalTime > 0 && totalCases > 0
        ? (sessionStats.totalTime / totalCases / 1000).toFixed(1)
        : "0.0";

    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="h-full flex items-center justify-center p-4">
            <div className="timer-card max-w-2xl w-full text-center">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-[var(--text-primary)] font-statement mb-2">
                Session Complete!
              </h2>
              <p className="text-[var(--text-muted)] mb-8">
                Great work! You've completed your practice session.
              </p>

              {/* Session Summary - Hide for recognition mode */}
              {mode !== "recognition" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="text-2xl font-bold text-[var(--primary)] font-statement">
                      {totalCases}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Cases Reviewed
                    </div>
                  </div>
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="text-2xl font-bold text-green-500 font-statement">
                      {accuracyRate.toFixed(0)}%
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Accuracy
                    </div>
                  </div>
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="text-2xl font-bold text-blue-500 font-statement">
                      {avgTime}s
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Avg Time
                    </div>
                  </div>
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <div className="text-2xl font-bold text-purple-500 font-statement">
                      {sessionStats.correct}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] mt-1">
                      Correct
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/cube-lab/algorithm-trainer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium"
                >
                  Back to Algorithm Trainer
                </Link>
                <button
                  onClick={() => {
                    setSessionCompleted(false);
                    setCurrentIndex(0);
                    setHasStarted(false);
                    setSessionStats({
                      correct: 0,
                      incorrect: 0,
                      totalTime: 0,
                      recognitionTimes: [],
                      executionTimes: [],
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
                className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Algorithm Trainer
              </Link>

              <h1 className="text-3xl font-bold text-[var(--text-primary)] font-statement mb-2">
                {mode === "due"
                  ? "Spaced Repetition Review"
                  : mode === "recognition"
                    ? "Recognition Practice"
                    : mode === "execution"
                      ? "Execution Practice"
                      : "Free Practice"}
              </h1>
              <p className="text-[var(--text-muted)]">
                {mode === "due" ? "Review" : "Practice"} {casesToReview.length}{" "}
                algorithm
                {casesToReview.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="timer-card">
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

              {/* Session Stats - Only show for non-recognition modes */}
              {mode !== "recognition" && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xl font-bold text-green-500 font-statement">
                        {sessionStats.correct}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Correct
                    </div>
                  </div>
                  {mode !== "execution" && (
                    <div className="text-center">
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
                  <div className="text-center">
                    <div className="text-xl font-bold text-[var(--primary)] font-statement mb-1">
                      {sessionStats.totalTime > 0 &&
                      sessionStats.correct + sessionStats.incorrect > 0
                        ? (
                            sessionStats.totalTime /
                            (mode === "execution"
                              ? sessionStats.correct
                              : sessionStats.correct + sessionStats.incorrect) /
                            1000
                          ).toFixed(1)
                        : "0.0"}
                      s
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Avg Time
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Practice Card - Different based on mode */}
            {currentReview && currentReview.case && (
              <>
                {mode === "execution" ? (
                  // Execution practice mode
                  <ExecutionPracticeCard
                    caseName={currentReview.case.caseName}
                    algorithm={
                      currentReview.algorithm?.notation ||
                      currentReview.case.setupMoves
                    }
                    setupMoves={currentReview.case.setupMoves}
                    onComplete={handleExecutionComplete}
                    mode={mode}
                    hasStarted={hasStarted}
                    onStart={() => setHasStarted(true)}
                  />
                ) : (
                  // Recognition practice mode (default for all other modes)
                  <RecognitionFlashCard
                    caseName={currentReview.case.caseName}
                    setupMoves={currentReview.case.setupMoves}
                    recognition={currentReview.case.recognition}
                    algorithm={currentReview.algorithm?.notation}
                    onAnswer={handleAnswer}
                    mode={mode}
                    hasStarted={hasStarted}
                    onStart={() => setHasStarted(true)}
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
