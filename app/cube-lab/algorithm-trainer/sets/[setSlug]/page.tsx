"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import CubeLabLayout from "@/components/CubeLabLayout";
import { AlgorithmCaseCard } from "@/components/algorithm";
import { AlgorithmSetDetailSkeleton } from "@/components/SkeletonLoaders";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
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
      <div className="container-responsive py-4 md:py-8">
        <div className="space-y-4 md:space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: "Algorithm Trainer", href: "/cube-lab/algorithm-trainer" },
              { label: set.name },
            ]}
            title={set.name}
            description={set.description}
          />

          {/* Progress Bar */}
          {user && userProgress && (
            <div className="timer-card">
              <div className="flex items-center justify-between mb-2">
                <span className="type-label">
                  {userProgress.learned}/{userProgress.total} learned
                </span>
                <span className="type-caption">
                  {Math.round(
                    (userProgress.learned / userProgress.total) * 100
                  )}
                  %
                </span>
              </div>
              <div className="h-3 bg-(--surface-elevated) rounded-full overflow-hidden">
                <div
                  className="h-full bg-(--primary) transition-all duration-500"
                  style={{
                    width: `${(userProgress.learned / userProgress.total) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-4">
                <StatTile
                  size="sm"
                  mono={false}
                  mobileLayout="row"
                  label="Learning"
                  value={userProgress.learned - userProgress.mastered}
                  tone="warning"
                />
                <StatTile
                  size="sm"
                  mono={false}
                  mobileLayout="row"
                  label="Mastered"
                  value={userProgress.mastered}
                  tone="success"
                />
                <StatTile
                  size="sm"
                  mono={false}
                  mobileLayout="row"
                  label="Not Started"
                  value={userProgress.total - userProgress.learned}
                />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <SearchInput
                placeholder="Search cases…"
                aria-label="Search cases"
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {user && (
              <SelectMenu
                label="Filter cases by stage"
                value={filterStage}
                onChange={setFilterStage}
                fullWidth={false}
                className="w-full sm:w-44"
                options={[
                  { value: "all", label: "All Cases" },
                  { value: "new", label: "Not Learned" },
                  { value: "learning", label: "Learning" },
                  { value: "reviewing", label: "Reviewing" },
                  { value: "mastered", label: "Mastered" },
                ]}
              />
            )}

            {user && unlearnedCaseIds.length > 0 && (
              <Button
                variant="subtle"
                onClick={handleBulkMarkAsLearned}
                loading={isBulkMarking}
                loadingText="Marking…"
                iconLeft={<CheckCircle2 className="w-4 h-4" />}
                className="shrink-0"
              >
                Mark All as Known ({unlearnedCaseIds.length})
              </Button>
            )}
          </div>

          {/* Cases Grid */}
          {filteredCases.length === 0 ? (
            <div className="timer-card text-center py-12">
              <p className="text-(--text-muted)">
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