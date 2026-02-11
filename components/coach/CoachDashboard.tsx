"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Calendar, BookOpen, TrendingUp, Heart, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CoachTrainingPlan from "./CoachTrainingPlan";
import CoachJournalEntry from "./CoachJournalEntry";
import CoachJournalCalendar from "./CoachJournalCalendar";
import CoachProgress from "./CoachProgress";
import CoachTour from "./CoachTour";
import GoalSummaryCard from "./GoalSummaryCard";

// Dynamically import modals to reduce initial bundle size
const DailyJournalModal = dynamic(() => import("./DailyJournalModal"), {
  ssr: false,
});
const JournalEntryViewModal = dynamic(() => import("./JournalEntryViewModal"), {
  ssr: false,
});
const CoachOnboardingModal = dynamic(() => import("./CoachOnboardingModal"), {
  ssr: false,
});
const CoachWalkthrough = dynamic(() => import("./CoachWalkthrough"), {
  ssr: false,
});
import {
  CoachDashboardSkeleton,
  CoachTrainingPlanSkeleton,
} from "@/components/SkeletonLoaders";
import {
  getCachedCoachProfile,
  cacheCoachProfile,
  getCachedTrainingPlan,
  cacheTrainingPlan,
  getCachedProgressStats,
  cacheProgressStats,
  getCachedProgressSnapshots,
  cacheProgressSnapshots,
  invalidateTrainingPlan,
  invalidateJournalEntries,
  invalidateProgressStats,
  CachedCoachProfile,
  CachedTrainingPlan,
  CachedProgressStats,
  CachedProgressSnapshot,
} from "@/lib/coach-cache";

// Memoized components to prevent unnecessary re-renders
const MemoizedCoachTrainingPlan = memo(CoachTrainingPlan);
const MemoizedCoachProgress = memo(CoachProgress);
const MemoizedCoachJournalCalendar = memo(CoachJournalCalendar);

interface JournalEntry {
  _id: Id<"coachJournalEntries">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  entryDate: number;
  solveCount?: number;
  sessionAverage?: number;
  bestSingle?: number;
  practiceMinutes?: number;
  customAverage?: number;
  customSolveCount?: number;
  mood: "great" | "good" | "okay" | "frustrated" | "tired";
  wentWell?: string;
  challenges?: string;
  notes?: string;
  focusAreas?: string[];
  completedTaskIndices?: number[];
  mediaUrls?: string[];
  mediaFileIds?: string[];
  mediaTypes?: string[];
  createdAt: number;
}

interface CoachDashboardProps {
  userId: Id<"users">;
}

type TabId = "plan" | "journal" | "progress";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "plan", label: "Training Plan", icon: Calendar },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

export default function CoachDashboard({ userId }: CoachDashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get tab from URL query param, default to "plan"
  const tabFromUrl = searchParams.get("tab") as TabId | null;
  const initialTab: TabId =
    tabFromUrl && ["plan", "journal", "progress"].includes(tabFromUrl)
      ? tabFromUrl
      : "plan";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showViewEntryModal, setShowViewEntryModal] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] =
    useState<JournalEntry | null>(null);
  const [selectedJournalDate, setSelectedJournalDate] = useState<
    number | undefined
  >(undefined);
  const [editingEntryId, setEditingEntryId] = useState<
    Id<"coachJournalEntries"> | undefined
  >(undefined);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [journalRefreshKey, setJournalRefreshKey] = useState(0);
  const [walkthroughCompleted, setWalkthroughCompleted] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("walkthrough-completed-coach-feature") === "true"
    );
  });
  const [contributeBannerDismissed, setContributeBannerDismissed] = useState(
    () => {
      if (typeof window === "undefined") return false;
      return (
        localStorage.getItem("coach-contribute-banner-dismissed") === "true"
      );
    },
  );
  const [showContributeBanner, setShowContributeBanner] = useState(false);

  // Determine which tour steps to show based on user state
  const hasSubmittedVolunteer = useQuery(
    api.feedbackResponses.hasRecentFeedback,
    userId ? { userId, surveyType: "coach-volunteer", daysAgo: 365 } : "skip",
  );

  // Show contribution banner after delay if not dismissed and user hasn't submitted volunteer feedback
  useEffect(() => {
    if (contributeBannerDismissed || hasSubmittedVolunteer) return;

    const timer = setTimeout(() => {
      setShowContributeBanner(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [contributeBannerDismissed, hasSubmittedVolunteer]);

  // Initialize with cached data
  const [cachedProfile, setCachedProfile] = useState<CachedCoachProfile | null>(
    () => getCachedCoachProfile(userId),
  );
  const [cachedPlan, setCachedPlan] = useState<CachedTrainingPlan | null>(() =>
    getCachedTrainingPlan(userId),
  );
  const [cachedStats, setCachedStats] = useState<CachedProgressStats | null>(
    () => getCachedProgressStats(userId),
  );
  const [cachedSnapshots, setCachedSnapshots] = useState<
    CachedProgressSnapshot[] | null
  >(() => getCachedProgressSnapshots(userId));

  // Sync activeTab with URL changes
  useEffect(() => {
    if (tabFromUrl && ["plan", "journal", "progress"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const profileQuery = useQuery(api.coach.getCoachProfile, { userId });
  const activePlanQuery = useQuery(api.coach.getActiveTrainingPlan, { userId });
  const progressSnapshotsQuery = useQuery(api.coach.getProgressSnapshots, {
    userId,
    limit: 10,
  });
  const progressStatsQuery = useQuery(api.coach.getProgressStats, { userId });

  const generatePlan = useMutation(api.coach.generateTrainingPlan);

  // Cache profile when fresh data arrives
  useEffect(() => {
    if (profileQuery) {
      const profileData: CachedCoachProfile = {
        _id: profileQuery._id,
        userId: profileQuery.userId,
        currentAverage: profileQuery.currentAverage,
        skillLevel: profileQuery.skillLevel,
        primaryEvent: profileQuery.primaryEvent,
        goalType: profileQuery.goalType,
        customGoalTime: profileQuery.customGoalTime,
        targetDate: profileQuery.targetDate,
        dailyPracticeMinutes: profileQuery.dailyPracticeMinutes,
        practiceSchedule: profileQuery.practiceSchedule,
        onboardingCompleted: profileQuery.onboardingCompleted,
      };
      cacheCoachProfile(userId, profileData);
      setCachedProfile(profileData);
    }
  }, [profileQuery, userId]);

  // Determine which tour steps to show based on user state
  useEffect(() => {
    if (activePlanQuery) {
      const planData: CachedTrainingPlan = {
        _id: activePlanQuery._id,
        userId: activePlanQuery.userId,
        profileId: activePlanQuery.profileId,
        weekNumber: activePlanQuery.weekNumber,
        weekStartDate: activePlanQuery.weekStartDate,
        weekEndDate: activePlanQuery.weekEndDate,
        status: activePlanQuery.status,
        dailyPlans: activePlanQuery.dailyPlans,
        completedDays: activePlanQuery.completedDays,
        totalDays: activePlanQuery.totalDays,
      };
      cacheTrainingPlan(userId, planData);
      setCachedPlan(planData);
    }
  }, [activePlanQuery, userId]);

  // Cache progress stats when fresh data arrives
  useEffect(() => {
    if (progressStatsQuery) {
      cacheProgressStats(userId, progressStatsQuery);
      setCachedStats(progressStatsQuery);
    }
  }, [progressStatsQuery, userId]);

  // Cache progress snapshots when fresh data arrives
  useEffect(() => {
    if (progressSnapshotsQuery) {
      // Only cache if we have valid data (not undefined which means loading)
      cacheProgressSnapshots(
        userId,
        progressSnapshotsQuery as CachedProgressSnapshot[],
      );
      setCachedSnapshots(progressSnapshotsQuery as CachedProgressSnapshot[]);
    }
  }, [progressSnapshotsQuery, userId]);

  // For profile: Always use fresh data when available, but fall back to cache while loading
  const profile = profileQuery ?? (cachedProfile as typeof profileQuery);

  // Determine loading state for active plan query
  const isActivePlanLoading = activePlanQuery === undefined;

  // For active plan: Use fresh data when available. If query is still loading, use cache if available to prevent empty state flashing. Once query returns, it will overwrite cache with fresh data.
  const activePlan: typeof activePlanQuery = isActivePlanLoading
    ? (cachedPlan as unknown as typeof activePlanQuery)
    : activePlanQuery;

  const progressStats = progressStatsQuery ?? cachedStats;
  // For progress snapshots: Use fresh data when available, but fall back to cache while loading. This prevents flashing empty state in progress tab while data is loading.
  const progressSnapshots =
    progressSnapshotsQuery !== undefined
      ? progressSnapshotsQuery
      : (cachedSnapshots ?? []);

  // Calculate current average for goal status
  const currentAverage = useMemo(() => {
    if (progressStats?.monthly?.average) {
      return progressStats.monthly.average;
    }
    if (progressStats?.weekly?.average) {
      return progressStats.weekly.average;
    }
    return profile?.currentAverage;
  }, [progressStats, profile?.currentAverage]);

  // Determine which tour steps to show based on user state
  const [hasAttemptedAutoGenerate, setHasAttemptedAutoGenerate] =
    useState(false);

  // Automatically generate new week when current plan expires or when onboarding is completed and no plan exists. This effect runs whenever the profile or active plan changes to ensure the dashboard always shows an active plan if possible.
  useEffect(() => {
    const checkAndGenerateNewWeek = async () => {
      // Prevent multiple simultaneous generation attempts
      if (!profile || isGeneratingPlan || hasAttemptedAutoGenerate) return;

      // Don't attempt auto-generation until we know the loading state of the active plan query to avoid generating multiple plans due to multiple re-renders while loading
      if (isActivePlanLoading) return;

      const now = Date.now();

      // If there's an active plan and it's expired, generate the next week
      if (activePlan) {
        if (activePlan.weekEndDate < now) {
          // Current plan has expired, generate new one
          setHasAttemptedAutoGenerate(true);
          setIsGeneratingPlan(true);
          try {
            await generatePlan({
              userId,
              profileId: profile._id,
              weekNumber: activePlan.weekNumber + 1,
            });
            // Invalidate cache after successful auto-generation to ensure fresh data is loaded
            invalidateTrainingPlan(userId);
          } catch (error) {
            console.error("Failed to auto-generate plan:", error);
            // Reset flag on error to allow retry on next check
            setHasAttemptedAutoGenerate(false);
          } finally {
            setIsGeneratingPlan(false);
          }
        }
      } else if (profile.onboardingCompleted) {
        // No active plan exists, and onboarding is completed, so generate the first week
        setHasAttemptedAutoGenerate(true);
        setIsGeneratingPlan(true);
        try {
          await generatePlan({
            userId,
            profileId: profile._id,
            weekNumber: 1,
          });
          // Invalidate cache after successful auto-generation to ensure fresh data is loaded
          invalidateTrainingPlan(userId);
        } catch (error) {
          console.error("Failed to generate initial plan:", error);
          // Reset flag on error to allow retry on next check
          setHasAttemptedAutoGenerate(false);
        } finally {
          setIsGeneratingPlan(false);
        }
      }
    };

    checkAndGenerateNewWeek();
  }, [
    profile,
    activePlan,
    userId,
    generatePlan,
    isGeneratingPlan,
    hasAttemptedAutoGenerate,
    isActivePlanLoading,
  ]);

  // Reset auto-generation attempt flag whenever a new valid plan is loaded to allow future auto-generations when that plan expires. This ensures the dashboard can continue to auto-generate new weeks indefinitely as long as the user keeps their plan up to date.
  useEffect(() => {
    // If we have a valid active plan, reset the auto-generation attempt flag to allow future auto-generations when the plan expires
    if (activePlanQuery && activePlanQuery._id) {
      setHasAttemptedAutoGenerate(false);
    }
  }, [activePlanQuery]);

  const handleGenerateNewWeek = async () => {
    if (!profile) return;

    setIsGeneratingPlan(true);
    try {
      const nextWeekNumber = activePlan ? activePlan.weekNumber + 1 : 1;
      await generatePlan({
        userId,
        profileId: profile._id,
        weekNumber: nextWeekNumber,
      });
      // Invalidate cache after successful generation to ensure fresh data is loaded
      invalidateTrainingPlan(userId);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Invalidate caches when journal entries are modified
  const handleJournalSave = () => {
    invalidateJournalEntries(userId);
    invalidateProgressStats(userId);
    setShowJournalModal(false);
    setSelectedJournalDate(undefined);
    setEditingEntryId(undefined);
    setJournalRefreshKey((k) => k + 1);
  };

  const handleJournalDelete = () => {
    invalidateJournalEntries(userId);
    invalidateProgressStats(userId);
    setJournalRefreshKey((k) => k + 1);
  };

  // Show loading state (only if no cached data available)
  if (profileQuery === undefined && !cachedProfile) {
    return <CoachDashboardSkeleton />;
  }

  // Check if onboarding is needed and show modal
  const needsOnboarding = !profile || !profile.onboardingCompleted;

  return (
    <>
      {/* Coach Walkthrough */}
      {needsOnboarding && (
        <CoachWalkthrough
          onComplete={() => setWalkthroughCompleted(true)}
          showFloatingButton={true}
        />
      )}

      {/* Onboarding Modal */}
      <CoachOnboardingModal
        isOpen={needsOnboarding || showOnboardingModal}
        userId={userId}
        onComplete={() => {
          setShowOnboardingModal(false);
          // Profile will be refetched automatically by Convex
        }}
      />

      {/* Main Dashboard - Only show when onboarding is complete */}
      {!needsOnboarding && (
        <div className="space-y-6">
          {/* Goal Summary Card */}
          <GoalSummaryCard profile={profile} currentAverage={currentAverage} />

          {/* Contribution Banner */}
          {showContributeBanner &&
            !contributeBannerDismissed &&
            !hasSubmittedVolunteer && (
              <div className="timer-card relative border-[var(--primary)]/30">
                <button
                  onClick={() => {
                    localStorage.setItem(
                      "coach-contribute-banner-dismissed",
                      "true",
                    );
                    setContributeBannerDismissed(true);
                  }}
                  className="hidden sm:flex absolute top-3 right-3 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
                  aria-label="Dismiss banner"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 sm:pr-10">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
                      <Heart className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5 font-statement">
                        Want to help improve the Coach?
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                        Join our contributor program and help make training
                        plans even better for the cubing community!
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
                    <Link
                      href="/cube-lab/coach/contribute"
                      className="block w-full sm:w-auto text-center px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Learn More
                    </Link>
                    {/* Dismiss button shown on mobile only */}
                    <button
                      onClick={() => {
                        localStorage.setItem(
                          "coach-contribute-banner-dismissed",
                          "true",
                        );
                        setContributeBannerDismissed(true);
                      }}
                      className="sm:hidden w-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Tabs */}
          <div
            className="flex gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
            data-tour="coach-tabs"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const tourId =
                tab.id === "plan"
                  ? "training-plan-tab"
                  : tab.id === "journal"
                    ? "journal-tab"
                    : "progress-tab";

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  data-tour={tourId}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "plan" && (
              <div>
                {/* Show skeleton while query is loading AND no cached plan available */}
                {(isActivePlanLoading && !cachedPlan) || isGeneratingPlan ? (
                  <CoachTrainingPlanSkeleton />
                ) : activePlan ? (
                  <MemoizedCoachTrainingPlan
                    plan={activePlan}
                    onOpenJournal={(dayDate) => {
                      setSelectedJournalDate(dayDate);
                      setShowJournalModal(true);
                    }}
                  />
                ) : (
                  /* Only show "Generate Plan" when query has completed AND returned no plan */
                  !isActivePlanLoading && (
                    <div className="timer-card text-center py-12">
                      <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                        No Active Training Plan
                      </h3>
                      <p className="text-sm text-[var(--text-muted)] mb-4">
                        Generate your first weekly training plan to get started.
                      </p>
                      <button
                        onClick={handleGenerateNewWeek}
                        disabled={isGeneratingPlan}
                        className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                      >
                        {isGeneratingPlan ? "Generating..." : "Generate Plan"}
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === "journal" && (
              <div>
                {showJournalEntry ? (
                  <div className="timer-card">
                    <CoachJournalEntry
                      userId={userId}
                      profileId={profile._id}
                      planId={activePlan?._id}
                      onSave={() => setShowJournalEntry(false)}
                      onClose={() => setShowJournalEntry(false)}
                    />
                  </div>
                ) : (
                  <MemoizedCoachJournalCalendar
                    key={journalRefreshKey}
                    userId={userId}
                    onAddEntry={(date) => {
                      setSelectedJournalDate(date.getTime());
                      setShowJournalModal(true);
                    }}
                    onViewEntry={(entry) => {
                      setSelectedJournalEntry(entry as JournalEntry);
                      setShowViewEntryModal(true);
                    }}
                  />
                )}
              </div>
            )}

            {activeTab === "progress" && (
              <MemoizedCoachProgress
                profile={profile}
                snapshots={progressSnapshots || []}
              />
            )}
          </div>

          {/* Daily Journal Modal */}
          <DailyJournalModal
            isOpen={showJournalModal}
            onClose={() => {
              setShowJournalModal(false);
              setSelectedJournalDate(undefined);
              setEditingEntryId(undefined);
            }}
            userId={userId}
            profileId={profile._id}
            planId={activePlan?._id}
            activePlan={activePlan}
            date={selectedJournalDate}
            editingEntryId={editingEntryId}
            onSave={handleJournalSave}
          />

          {/* Journal Entry View Modal */}
          <JournalEntryViewModal
            isOpen={showViewEntryModal}
            onClose={() => {
              setShowViewEntryModal(false);
              setSelectedJournalEntry(null);
            }}
            entry={selectedJournalEntry}
            onEdit={(entry) => {
              setShowViewEntryModal(false);
              setSelectedJournalDate(entry.entryDate);
              setEditingEntryId(entry._id);
              setShowJournalModal(true);
            }}
            onDeleted={handleJournalDelete}
          />

          {/* Product Tour */}
          <CoachTour
            hasProfile={!!profile}
            hasActivePlan={!!activePlan}
            activeTab={activeTab}
            autoStart={walkthroughCompleted}
            showFloatingButton={true}
          />
        </div>
      )}
    </>
  );
}