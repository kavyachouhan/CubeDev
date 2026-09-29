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
  Brain,
  Star,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";

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
      // If the user has a preferred algorithm, select it. Otherwise, select the default algorithm or the first available algorithm.
      const preferred = userProgress?.preferredAlgId
        ? caseData.algorithms.find(
            (a: any) => a._id === userProgress.preferredAlgId,
          )
        : undefined;

      if (preferred) {
        setSelectedAlgId(preferred._id);
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

  // Determine which algorithm to visualize: preferred, default, or setup moves
  const visualizedAlgorithm =
    selectedAlgorithm?.notation ||
    algorithms[0]?.notation ||
    algorithmCase?.setupMoves ||
    "";

  if (!algorithmCase || !set) {
    return (
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="container-responsive py-4 md:py-8">
          <Card variant="static">
            <EmptyState
              size="page"
              icon={<Search />}
              title="Case not found"
              action={
                <ButtonLink href="/cube-lab/algorithm-trainer">
                  Back to Algorithm Trainer
                </ButtonLink>
              }
            />
          </Card>
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
              <PageHeader
                breadcrumbs={[
                  { label: "Algorithm Trainer", href: "/cube-lab/algorithm-trainer" },
                  {
                    label: set.name,
                    href: `/cube-lab/algorithm-trainer/sets/${set.slug || set.name.toLowerCase()}`,
                  },
                  { label: algorithmCase.caseName },
                ]}
                title={algorithmCase.caseName}
                description={`${set.name} Algorithm`}
                eyebrow={
                  userProgress?.learningStage === "mastered" ? (
                    <Badge tone="success" shape="pill" size="md" icon={<Star />}>
                      Mastered
                    </Badge>
                  ) : undefined
                }
              />

              {/* Progress Stats (if learning) */}
              {userProgress && userProgress.learningStage !== "new" && (
                <Card variant="static" className="border-l-4 border-(--primary)">
                  {/* Wraps instead of scrolling sideways: the row used
                      `min-w-max` inside `overflow-x-auto`, so on a phone the
                      last two stats sat off the edge of the card. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <StatTile
                      size="sm"
                      mobileLayout="row"
                      mono={false}
                      tone="primary"
                      label="Status"
                      value={
                        <span className="capitalize">
                          {userProgress.learningStage}
                        </span>
                      }
                    />
                    <StatTile
                      size="sm"
                      mobileLayout="row"
                      mono={false}
                      label="Reviews"
                      value={userProgress.reviewCount}
                    />
                    <StatTile
                      size="sm"
                      mobileLayout="row"
                      mono={false}
                      label="Accuracy"
                      tone={
                        userProgress.reviewCount === 0
                          ? "default"
                          : userProgress.accuracyRate >= 90
                            ? "success"
                            : userProgress.accuracyRate >= 70
                              ? "warning"
                              : "error"
                      }
                      value={
                        userProgress.reviewCount === 0
                          ? "N/A"
                          : `${Math.round(userProgress.accuracyRate)}%`
                      }
                    />
                    <StatTile
                      size="sm"
                      mobileLayout="row"
                      mono={false}
                      label="Next Review"
                      value={
                        userProgress.learningStage === "mastered"
                          ? "Complete"
                          : userProgress.nextReviewDate
                            ? new Date(
                                userProgress.nextReviewDate,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "Not set"
                      }
                    />
                  </div>
                </Card>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Left: Cube Visualization */}
                <div className="timer-card">
                  <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4">
                    Visualization
                  </h3>
                  {visualizedAlgorithm ? (
                    <CubeVisualizer3D
                      algorithm={visualizedAlgorithm}
                      puzzle={(set.puzzleType as any) || "3x3x3"}
                      autoPlay={false}
                      showControls={true}
                      height="350px"
                    />
                  ) : (
                    <div className="h-87.5 bg-(--surface-elevated) rounded-(--radius-control) flex items-center justify-center border border-(--border)">
                      <p className="text-sm text-(--text-muted)">
                        No algorithm available for this case yet
                      </p>
                    </div>
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
                                  ? "fill-(--warning) text-(--warning)"
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
                    <div className="p-4 bg-(--surface-elevated) rounded-(--radius-control) overflow-x-auto">
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
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {!userProgress || userProgress.learningStage === "new" ? (
                  <>
                    <Button
                      fullWidth
                      onClick={handleStartLearning}
                      iconLeft={<PlayCircle className="w-4 h-4 shrink-0" />}
                    >
                      <span className="sm:hidden">Learn</span>
                      <span className="hidden sm:inline">
                        Start Learning This Case
                      </span>
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={handleMarkAsLearned}
                      loading={isMarkingLearned}
                      loadingText="Marking…"
                      iconLeft={<CheckCircle2 className="w-4 h-4 shrink-0" />}
                    >
                      <span className="sm:hidden">Know it</span>
                      <span className="hidden sm:inline">Already Know This</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <ButtonLink
                      fullWidth
                      href={`/cube-lab/algorithm-trainer/practice?mode=all&case=${algorithmCase.slug || caseSlug}`}
                      iconLeft={<Brain className="w-4 h-4 shrink-0" />}
                    >
                      <span className="sm:hidden">Practice</span>
                      <span className="hidden sm:inline">Practice This Case</span>
                    </ButtonLink>
                    <ButtonLink
                      fullWidth
                      variant="secondary"
                      href={`/cube-lab/algorithm-trainer/practice?mode=infinite&case=${algorithmCase.slug || caseSlug}`}
                      iconLeft={<PlayCircle className="w-4 h-4 shrink-0" />}
                    >
                      <span className="sm:hidden">Drill</span>
                      <span className="hidden sm:inline">Drill This Case</span>
                    </ButtonLink>
                  </>
                )}
              </div>

              {/* Prev / Next Case Navigation */}
              {caseSlugs && caseSlugs.length > 1 && (
                <nav
                  aria-label="Case navigation"
                  className="timer-card p-2 sm:p-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                >
                  {prevCase ? (
                    <ButtonLink
                      size="sm"
                      variant="secondary"
                      href={`/cube-lab/algorithm-trainer/cases/${prevCase.slug}`}
                      className="justify-self-start min-w-0 max-w-full sm:max-w-[16rem]"
                      iconLeft={<ChevronLeft className="w-4 h-4 shrink-0" />}
                    >
                      <span className="truncate">{prevCase.caseName}</span>
                    </ButtonLink>
                  ) : (
                    <span />
                  )}

                  <span className="type-caption px-1 text-center">
                    {currentIndex + 1} / {caseSlugs.length}
                  </span>

                  {nextCase ? (
                    <ButtonLink
                      size="sm"
                      variant="secondary"
                      href={`/cube-lab/algorithm-trainer/cases/${nextCase.slug}`}
                      className="justify-self-end min-w-0 max-w-full sm:max-w-[16rem]"
                      iconRight={<ChevronRight className="w-4 h-4 shrink-0" />}
                    >
                      <span className="truncate">{nextCase.caseName}</span>
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}