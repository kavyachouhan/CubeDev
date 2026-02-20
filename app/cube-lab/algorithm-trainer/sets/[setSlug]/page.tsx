"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import CubeLabLayout from "@/components/CubeLabLayout";
import { AlgorithmCaseCard } from "@/components/algorithm";
import { AlgorithmSetDetailSkeleton } from "@/components/SkeletonLoaders";
import { ArrowLeft, Filter, Search, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function AlgorithmSetPage() {
  const params = useParams();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [isBulkMarking, setIsBulkMarking] = useState(false);

  const setSlug = params.setSlug as string;

  // Get set details and cases
  const setData = useQuery(api.algorithms.getSetBySlugWithCases, {
    slug: setSlug,
  });

  // Get user progress for this set
  const userProgress = useQuery(
    api.algorithms.getUserSetProgress,
    user?.convexId && setData?.set?._id
      ? { userId: user.convexId, setId: setData.set._id }
      : "skip"
  );

  const bulkMarkAsLearned = useMutation(api.algorithms.bulkMarkAsLearned);

  if (setData === undefined) {
    return (
      <CubeLabLayout activeSection="algorithm-trainer">
        <AlgorithmSetDetailSkeleton />
      </CubeLabLayout>
    );
  }

  const { set, cases } = setData;

  // Get unlearned case IDs for bulk marking
  const unlearnedCaseIds = cases
    .filter((c: any) => !userProgress?.progressMap?.[c._id])
    .map((c: any) => c._id);

  const handleBulkMarkAsLearned = async () => {
    if (!user?.convexId || isBulkMarking || unlearnedCaseIds.length === 0) return;
    setIsBulkMarking(true);
    try {
      await bulkMarkAsLearned({
        userId: user.convexId as Id<"users">,
        caseIds: unlearnedCaseIds as Id<"algorithmCases">[],
      });
    } catch (error) {
      console.error("Failed to bulk mark as learned:", error);
    } finally {
      setIsBulkMarking(false);
    }
  };

  // Filter cases based on search and learning stage
  const filteredCases = cases.filter((c: any) => {
    const matchesSearch = c.caseName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (filterStage === "all") return matchesSearch;

    // Get progress for this case
    const progress = userProgress?.progressMap?.[c._id];

    if (filterStage === "new") return matchesSearch && !progress;
    if (filterStage === "learning")
      return matchesSearch && progress?.learningStage === "learning";
    if (filterStage === "reviewing")
      return matchesSearch && progress?.learningStage === "reviewing";
    if (filterStage === "mastered")
      return matchesSearch && progress?.learningStage === "mastered";

    return matchesSearch;
  });

  return (
    <CubeLabLayout activeSection="algorithm-trainer">
      <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Link
              href="/cube-lab/algorithm-trainer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors w-fit mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Algorithm Trainer
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-statement">
                  {set.name}
                </h1>
                <p className="text-[var(--text-muted)] mt-2">
                  {set.description}
                </p>
              </div>

              {user && userProgress && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--primary)] font-statement">
                    {userProgress.learned}/{userProgress.total}
                  </div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Learned
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {user && userProgress && (
            <div className="timer-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Overall Progress
                </span>
                <span className="text-sm text-[var(--text-muted)]">
                  {Math.round(
                    (userProgress.learned / userProgress.total) * 100
                  )}
                  %
                </span>
              </div>
              <div className="h-3 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-500"
                  style={{
                    width: `${(userProgress.learned / userProgress.total) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-500 font-statement">
                    {userProgress.learned - userProgress.mastered}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Learning
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-500 font-statement">
                    {userProgress.mastered}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Mastered
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[var(--text-muted)] font-statement">
                    {userProgress.total - userProgress.learned}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Not Started
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Filter by Stage */}
            {user && (
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[var(--text-muted)]" />
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  <option value="all">All Cases</option>
                  <option value="new">Not Learned</option>
                  <option value="learning">Learning</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>
            )}

            {/* Bulk Mark as Known */}
            {user && unlearnedCaseIds.length > 0 && (
              <button
                onClick={handleBulkMarkAsLearned}
                disabled={isBulkMarking}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isBulkMarking
                  ? "Marking..."
                  : `Mark All as Known (${unlearnedCaseIds.length})`}
              </button>
            )}
          </div>

          {/* Cases Grid */}
          {filteredCases.length === 0 ? (
            <div className="timer-card text-center py-12">
              <p className="text-[var(--text-muted)]">
                No cases found matching your criteria
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((algorithmCase: any) => {
                const progress = userProgress?.progressMap?.[algorithmCase._id];

                return (
                  <AlgorithmCaseCard
                    key={algorithmCase._id}
                    caseId={algorithmCase._id}
                    caseSlug={
                      algorithmCase.slug ||
                      algorithmCase.caseName.toLowerCase().replace(/\s+/g, "-")
                    }
                    setId={set._id}
                    setSlug={set.slug || set.name.toLowerCase()}
                    caseName={algorithmCase.caseName}
                    difficulty={algorithmCase.difficulty}
                    frequency={algorithmCase.frequency}
                    learningStage={progress?.learningStage || "new"}
                    nextReviewDate={progress?.nextReviewDate}
                    accuracyRate={progress?.accuracyRate}
                    reviewCount={progress?.reviewCount || 0}
                    userId={user?.convexId}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CubeLabLayout>
  );
}