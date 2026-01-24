"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  Plus,
  RefreshCw,
  ChevronRight,
  Target
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CoachOnboardingModal from "./CoachOnboardingModal";
import CoachTrainingPlan from "./CoachTrainingPlan";
import CoachJournalEntry from "./CoachJournalEntry";
import CoachJournalList from "./CoachJournalList";
import CoachProgress from "./CoachProgress";
import DailyJournalModal from "./DailyJournalModal";

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
  const initialTab: TabId = tabFromUrl && ["plan", "journal", "progress"].includes(tabFromUrl) 
    ? tabFromUrl 
    : "plan";
  
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

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

  const profile = useQuery(api.coach.getCoachProfile, { userId });
  const activePlan = useQuery(api.coach.getActiveTrainingPlan, { userId });
  const journalEntries = useQuery(api.coach.getJournalEntries, { userId, limit: 10 });
  const progressSnapshots = useQuery(api.coach.getProgressSnapshots, { userId, limit: 10 });
  
  const generatePlan = useMutation(api.coach.generateTrainingPlan);

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
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Show loading state
  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check if onboarding is needed and show modal
  const needsOnboarding = !profile || !profile.onboardingCompleted;

  return (
    <>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Training Coach
          </h1>
          <p className="text-[var(--text-muted)]">
            Your personalized training plan and progress tracker
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === "journal" && (
            <button
              onClick={() => setShowJournalModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Entry</span>
            </button>
          )}
          {activeTab === "plan" && (
            <button
              onClick={handleGenerateNewWeek}
              disabled={isGeneratingPlan}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] text-[var(--text-secondary)] rounded-lg font-medium hover:bg-[var(--surface)] border border-[var(--border)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingPlan ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">New Week</span>
            </button>
          )}
        </div>
      </div>

      {/* Goal Summary Card */}
      <div className="timer-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)]">Your Goal</span>
              <span className="font-bold text-[var(--text-primary)] block">
                {profile.goalType === "competition-ready" 
                  ? "Competition Ready" 
                  : profile.goalType === "custom"
                  ? `Custom: ${profile.customGoalTime ? (profile.customGoalTime / 1000).toFixed(0) + "s" : "Set"}`
                  : profile.goalType.replace("-", " ").toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)]">Target Date</span>
            <span className="font-medium text-[var(--primary)] block">
              {new Date(profile.targetDate).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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
            {activePlan ? (
              <CoachTrainingPlan plan={activePlan} />
            ) : (
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
              <CoachJournalList
                entries={journalEntries || []}
                onNewEntry={() => setShowJournalModal(true)}
              />
            )}
          </div>
        )}

        {activeTab === "progress" && (
          <CoachProgress
            profile={profile}
            snapshots={progressSnapshots || []}
          />
        )}
      </div>

      {/* Daily Journal Modal */}
      <DailyJournalModal
        isOpen={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        userId={userId}
        profileId={profile._id}
        planId={activePlan?._id}
        activePlan={activePlan}
        onSave={() => setShowJournalModal(false)}
      />
    </div>
      )}
    </>
  );
}
