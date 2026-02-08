"use client";

import {
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
  Brain,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import AppWalkthrough, {
  useWalkthrough,
  WalkthroughStep,
} from "@/components/AppWalkthrough";

const COACH_STEPS: WalkthroughStep[] = [
  {
    id: "welcome",
    title: "Welcome to Coach",
    description:
      "Your personal cubing coach that creates customized training plans based on your goals, skill level, and available practice time.",
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: "goals",
    title: "Set Your Goals",
    description:
      "Define your target time and deadline. Coach will create a plan to help you reach your goals efficiently.",
    icon: <Target className="w-6 h-6" />,
  },
  {
    id: "training-plan",
    title: "Weekly Training Plans",
    description:
      "Get personalized weekly schedules with specific activities like timed solves, algorithm drills, and focused practice sessions.",
    icon: <Calendar className="w-6 h-6" />,
  },
  {
    id: "smart-recommendations",
    title: "Smart Recommendations",
    description:
      "Our recommendation engine analyzes your solve times and practice patterns to suggest activities that target your weak areas and maximize improvement.",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: "journal",
    title: "Practice Journal",
    description:
      "Log your daily practice sessions, track your mood, and note what went well. This helps Coach understand your progress patterns.",
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: "progress",
    title: "Track Your Progress",
    description:
      "View detailed analytics showing your improvement over time, practice streaks, weekly summaries, and goal progress.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
];

interface CoachWalkthroughProps {
  onComplete?: () => void;
  showFloatingButton?: boolean;
}

export default function CoachWalkthrough({
  onComplete,
  showFloatingButton = false,
}: CoachWalkthroughProps) {
  const {
    isOpen,
    hasCompleted,
    openWalkthrough,
    closeWalkthrough,
    completeWalkthrough,
  } = useWalkthrough("coach-feature");

  const handleComplete = () => {
    completeWalkthrough();
    onComplete?.();
  };

  const handleClose = () => {
    closeWalkthrough();
    onComplete?.();
  };

  return (
    <>
      <AppWalkthrough
        steps={COACH_STEPS}
        isOpen={isOpen}
        onClose={handleClose}
        onComplete={handleComplete}
        walkthroughId="coach-feature"
        title="Personal Cubing Coach"
        subtitle="Personalized training to help you improve"
      />

      {/* Floating help button - shown only when explicitly enabled and not during walkthrough */}
      {showFloatingButton && !isOpen && (
        <button
          onClick={openWalkthrough}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all shadow-lg"
          title="Learn about Coach features"
          aria-label="Show coach introduction"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Guide</span>
        </button>
      )}
    </>
  );
}

// Export the hook for external use
export { useWalkthrough as useCoachWalkthrough };
