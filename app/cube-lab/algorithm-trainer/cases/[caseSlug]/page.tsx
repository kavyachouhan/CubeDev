"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import {
  CubeVisualizer3D,
  AlternativeAlgorithms,
} from "@/components/algorithm";
import { AlgorithmCaseDetailSkeleton } from "@/components/SkeletonLoaders";
import {
  ArrowLeft,
  Brain,
  Star,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function AlgorithmCasePage() {
  const params = useParams();
  const { user } = useUser();

  const caseSlug = params.caseSlug as string;

  // Queries
  const caseData = useQuery(api.algorithms.getCaseBySlugWithAlgorithms, {
    slug: caseSlug,
  });

  // Queries dependent on user and case data
  const userProgress = useQuery(
    api.algorithms.getUserCaseProgress,
    user?.convexId && caseData?.case?._id
      ? { userId: user.convexId, caseId: caseData.case._id }
      : "skip",
  );

  // Get sibling case slugs for navigation
  const caseSlugs = useQuery(
    api.algorithms.getSetCaseSlugs,
    caseData?.set?._id ? { setId: caseData.set._id } : "skip",
  );

  // Mutations
  const startLearning = useMutation(api.algorithms.startLearning);
  const changePreferredAlgorithm = useMutation(
    api.algorithms.changePreferredAlgorithm,
  );
  const markAsLearned = useMutation(api.algorithms.markAsLearned);

  const [selectedAlgId, setSelectedAlgId] = useState<string | null>(null);
  const [isMarkingLearned, setIsMarkingLearned] = useState(false);

  useEffect(() => {
    if (caseData) {
      // Set selected algorithm based on user progress or default
      if (userProgress?.preferredAlgId) {
        setSelectedAlgId(userProgress.preferredAlgId);
      } else {
        const defaultAlg = caseData.algorithms.find((a: any) => a.isDefault);
        setSelectedAlgId(defaultAlg?._id || caseData.algorithms[0]?._id);
      }
    }
  }, [caseData, userProgress]);

  const handleStartLearning = async () => {
    if (!selectedAlgId || !user || !caseData?.case) return;

    try {
      await startLearning({
        userId: user.convexId as Id<"users">,
        caseId: caseData.case._id,
        preferredAlgId: selectedAlgId as Id<"algorithms">,
      });
    } catch (error) {
      console.error("Failed to start learning:", error);
    }
  };

  const handleSelectAlgorithm = async (algId: string) => {
    setSelectedAlgId(algId);

    if (userProgress && user && caseData?.case) {
      try {
        await changePreferredAlgorithm({
          userId: user.convexId as Id<"users">,
          caseId: caseData.case._id,
          newAlgId: algId as Id<"algorithms">,
        });
      } catch (error) {
        console.error("Failed to change algorithm:", error);
      }
    }
  };

  const handleMarkAsLearned = async () => {
    if (!user?.convexId || !caseData?.case || isMarkingLearned) return;
    setIsMarkingLearned(true);
    try {
      await markAsLearned({
        userId: user.convexId as Id<"users">,
        caseId: caseData.case._id,
        preferredAlgId: selectedAlgId
          ? (selectedAlgId as Id<"algorithms">)
          : undefined,
      });
    } catch (error) {
      console.error("Failed to mark as learned:", error);
    } finally {
      setIsMarkingLearned(false);
    }
  };

  // Navigation helpers
  const currentIndex =
    caseSlugs?.findIndex((c: any) => c.slug === caseSlug) ?? -1;
  const prevCase = currentIndex > 0 ? caseSlugs?.[currentIndex - 1] : null;
  const nextCase =
    caseSlugs && currentIndex < caseSlugs.length - 1
      ? caseSlugs[currentIndex + 1]
      : null;

  // Loading state
  if (!user) {
    return null; // Let ProtectedRoute handle redirect
  }

  if (caseData === undefined) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <AlgorithmCaseDetailSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  const { case: algorithmCase, algorithms, set } = caseData;
  const selectedAlgorithm = algorithms.find(
    (a: any) => a._id === selectedAlgId,
  );

  if (!algorithmCase || !set) {
    return (
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-(--text-muted)">Case not found</p>
          </div>
        </div>
      </CubeLabLayout>
    );
  }

  const difficultyStars = Math.ceil(algorithmCase.difficulty / 2);

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <div className="container-responsive py-4 md:py-8">
            <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
              {/* Header */}
              <div>
                <Link
                  href={`/cube-lab/algorithm-trainer/sets/${set.slug || set.name.toLowerCase()}`}
                  className="inline-flex items-center gap-2 text-(--text-muted) hover:text-(--primary) transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to {set.name}
                </Link>

                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-(--text-primary) font-statement wrap-break-word">
                        {algorithmCase.caseName}
                      </h1>
                      {userProgress?.learningStage === "mastered" && (
                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1 shrink-0">
                          <Star className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">
                            Mastered
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-(--text-muted)">
                      {set.name} Algorithm
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Stats (if learning) */}
              {userProgress && userProgress.learningStage !== "new" && (
                <div className="timer-card border-l-4 border-(--primary) overflow-x-auto">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-max lg:min-w-0">
                    <div>
                      <div className="text-xs text-(--text-muted) mb-1">
                        Status
                      </div>
                      <div className="text-lg font-bold text-(--primary) font-statement capitalize">
                        {userProgress.learningStage}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-(--text-muted) mb-1">
                        Reviews
                      </div>
                      <div className="text-lg font-bold text-(--text-primary) font-statement">
                        {userProgress.reviewCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-(--text-muted) mb-1">
                        Accuracy
                      </div>
                      <div
                        className={`text-lg font-bold font-statement ${
                          userProgress.reviewCount === 0
                            ? "text-(--text-muted)"
                            : userProgress.accuracyRate >= 90
                              ? "text-green-500"
                              : userProgress.accuracyRate >= 70
                                ? "text-yellow-500"
                                : "text-red-500"
                        }`}
                      >
                        {userProgress.reviewCount === 0
                          ? "N/A"
                          : `${Math.round(userProgress.accuracyRate)}%`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-(--text-muted) mb-1">
                        Next Review
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-(--text-primary) font-statement">
                        {userProgress.learningStage === "mastered"
                          ? "Complete"
                          : userProgress.nextReviewDate
                            ? new Date(
                                userProgress.nextReviewDate,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "Not set"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Left: 3D Visualization */}
                <div className="timer-card">
                  <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4">
                    3D Visualization
                  </h3>
                  {selectedAlgorithm && (
                    <CubeVisualizer3D
                      algorithm={selectedAlgorithm.notation}
                      puzzle={(set.puzzleType as any) || "3x3x3"}
                      autoPlay={false}
                      showControls={true}
                      height="350px"
                    />
                  )}
                </div>

                {/* Right: Case Info */}
                <div className="space-y-4 md:space-y-6">
                  {/* Recognition Tips */}
                  <div className="timer-card">
                    <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-3">
                      Recognition Tips
                    </h3>
                    <ul className="space-y-2">
                      {algorithmCase.recognition.map(
                        (tip: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-(--text-secondary)"
                          >
                            <span className="text-(--primary) mt-0.5 shrink-0">
                              •
                            </span>
                            <span>{tip}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Case Stats */}
                  <div className="timer-card">
                    <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-3">
                      Case Information
                    </h3>
                    <div className="space-y-3">
                      {/* Difficulty */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-(--text-muted)">
                          Difficulty
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < difficultyStars
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-(--border)"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Frequency */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-(--text-muted)">
                          Frequency
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-4 rounded ${
                                i < algorithmCase.frequency
                                  ? "bg-(--primary)"
                                  : "bg-(--border)"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Setup Moves */}
                      <div>
                        <div className="text-sm text-(--text-muted) mb-1">
                          Setup Moves
                        </div>
                        <div className="bg-(--surface-elevated) p-2 rounded overflow-x-auto">
                          <p className="text-sm font-mono text-(--text-primary) whitespace-nowrap">
                            {algorithmCase.setupMoves}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Algorithm */}
              <div className="timer-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
                    {userProgress ? "Your Algorithm" : "Recommended Algorithm"}
                  </h3>
                  {selectedAlgorithm?.isDefault && (
                    <span className="px-2 py-1 bg-(--primary)/10 text-(--primary) text-xs rounded shrink-0">
                      Recommended
                    </span>
                  )}
                </div>

                {selectedAlgorithm && (
                  <div className="space-y-4">
                    {/* Algorithm Notation */}
                    <div className="p-4 bg-(--surface-elevated) rounded-lg overflow-x-auto">
                      <p className="text-base sm:text-lg lg:text-xl font-mono text-(--text-primary) text-center whitespace-nowrap">
                        {selectedAlgorithm.notation}
                      </p>
                    </div>

                    {/* Algorithm Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                      <div className="text-center p-3 bg-(--surface-elevated) rounded">
                        <div className="text-lg font-bold text-(--primary) font-statement">
                          {selectedAlgorithm.moveCount}
                        </div>
                        <div className="text-xs text-(--text-muted)">
                          Moves
                        </div>
                      </div>
                      <div className="text-center p-3 bg-(--surface-elevated) rounded">
                        <div className="text-lg font-bold text-(--primary) font-statement">
                          {selectedAlgorithm.popularity}%
                        </div>
                        <div className="text-xs text-(--text-muted)">
                          Popularity
                        </div>
                      </div>
                      {selectedAlgorithm.averageSpeed && (
                        <div className="text-center p-3 bg-(--surface-elevated) rounded col-span-2 sm:col-span-1">
                          <div className="text-lg font-bold text-(--primary) font-statement">
                            {selectedAlgorithm.averageSpeed.toFixed(2)}s
                          </div>
                          <div className="text-xs text-(--text-muted)">
                            Avg Speed
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fingertricks & Notes */}
                    {(selectedAlgorithm.fingerTricks ||
                      selectedAlgorithm.notes) && (
                      <div className="space-y-2">
                        {selectedAlgorithm.fingerTricks && (
                          <div className="p-3 bg-(--surface-elevated) rounded">
                            <div className="text-xs font-semibold text-(--text-muted) mb-1">
                              Fingertricks
                            </div>
                            <p className="text-sm text-(--text-secondary)">
                              {selectedAlgorithm.fingerTricks}
                            </p>
                          </div>
                        )}
                        {selectedAlgorithm.notes && (
                          <div className="p-3 bg-(--surface-elevated) rounded">
                            <div className="text-xs font-semibold text-(--text-muted) mb-1">
                              Notes
                            </div>
                            <p className="text-sm text-(--text-secondary)">
                              {selectedAlgorithm.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alternative Algorithms */}
              {algorithms.length > 1 && (
                <div className="timer-card">
                  <AlternativeAlgorithms
                    algorithms={algorithms}
                    currentAlgId={selectedAlgId || ""}
                    onSelectAlgorithm={handleSelectAlgorithm}
                    puzzleType={(set.puzzleType as any) || "3x3x3"}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!userProgress || userProgress.learningStage === "new" ? (
                  <>
                    <button
                      onClick={handleStartLearning}
                      className="w-full sm:flex-1 py-3 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5 shrink-0" />
                      <span className="truncate">Start Learning This Case</span>
                    </button>
                    <button
                      onClick={handleMarkAsLearned}
                      disabled={isMarkingLearned}
                      className="w-full sm:flex-1 py-3 border border-(--primary) text-(--primary) hover:bg-(--primary)/10 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="truncate">
                        {isMarkingLearned ? "Marking..." : "Already Know This"}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/cube-lab/algorithm-trainer/practice?mode=all&case=${algorithmCase.slug || caseSlug}`}
                      className="w-full sm:flex-1 py-3 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Brain className="w-5 h-5 shrink-0" />
                      <span className="truncate">Practice This Case</span>
                    </Link>
                    <Link
                      href={`/cube-lab/algorithm-trainer/practice?mode=infinite&case=${algorithmCase.slug || caseSlug}`}
                      className="w-full sm:flex-1 py-3 border border-(--primary) text-(--primary) hover:bg-(--primary)/10 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5 shrink-0" />
                      <span className="truncate">Drill This Case</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Prev / Next Case Navigation */}
              {caseSlugs && caseSlugs.length > 1 && (
                <div className="timer-card">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    {/* Mobile: Navigation row with icons only */}
                    <div className="flex sm:hidden items-center justify-between w-full gap-2">
                      {prevCase ? (
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${prevCase.slug}`}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-(--text-primary) bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors flex-1 min-w-0 max-w-[40%]"
                        >
                          <ChevronLeft className="w-4 h-4 shrink-0" />
                          <span className="truncate">{prevCase.caseName}</span>
                        </Link>
                      ) : (
                        <div className="flex-1 max-w-[40%]" />
                      )}

                      <span className="text-xs text-(--text-muted) shrink-0 px-2">
                        {currentIndex + 1} / {caseSlugs.length}
                      </span>

                      {nextCase ? (
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${nextCase.slug}`}
                          className="flex items-center justify-end gap-1.5 px-3 py-2 text-xs font-medium text-(--text-primary) bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors flex-1 min-w-0 max-w-[40%]"
                        >
                          <span className="truncate">{nextCase.caseName}</span>
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </Link>
                      ) : (
                        <div className="flex-1 max-w-[40%]" />
                      )}
                    </div>

                    {/* Desktop: Full navigation */}
                    <div className="hidden sm:flex items-center justify-between w-full gap-4">
                      {prevCase ? (
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${prevCase.slug}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-(--text-primary) bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors min-w-0"
                        >
                          <ChevronLeft className="w-4 h-4 shrink-0" />
                          <span className="truncate">{prevCase.caseName}</span>
                        </Link>
                      ) : (
                        <div />
                      )}

                      <span className="text-xs text-(--text-muted) shrink-0">
                        {currentIndex + 1} / {caseSlugs.length}
                      </span>

                      {nextCase ? (
                        <Link
                          href={`/cube-lab/algorithm-trainer/cases/${nextCase.slug}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-(--text-primary) bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors min-w-0"
                        >
                          <span className="truncate">{nextCase.caseName}</span>
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </Link>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}