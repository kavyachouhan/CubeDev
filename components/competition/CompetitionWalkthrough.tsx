"use client";

import {
  Compass,
  History,
  Filter,
  Play,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import AppWalkthrough, {
  useWalkthrough,
  WalkthroughStep,
} from "@/components/AppWalkthrough";

const COMPETITION_STEPS: WalkthroughStep[] = [
  {
    id: "browse",
    title: "Browse Competitions",
    description:
      "Explore WCA competitions from around the world. Filter by events, region, and time to find competitions that interest you.",
    icon: <Compass className="w-6 h-6" />,
  },
  {
    id: "simulate",
    title: "Simulate Competition Rounds",
    description:
      "Practice competition solves with realistic round simulations. Experience the pressure and format of real WCA events.",
    icon: <Play className="w-6 h-6" />,
  },
  {
    id: "history",
    title: "Track Your Simulations",
    description:
      "View your simulation history to track progress and analyze your performance over time.",
    icon: <History className="w-6 h-6" />,
  },
  {
    id: "filters",
    title: "Smart Filtering",
    description:
      "Use event, region, and time filters to quickly find competitions. Search by name or city for specific events.",
    icon: <Filter className="w-6 h-6" />,
  },
  {
    id: "analytics",
    title: "Performance Analytics",
    description:
      "After simulations, review detailed analytics including averages, consistency metrics, and improvement trends.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
];

export default function CompetitionWalkthrough() {
  const {
    isOpen,
    hasCompleted,
    openWalkthrough,
    closeWalkthrough,
    completeWalkthrough,
  } = useWalkthrough("competition-browser");

  return (
    <>
      <AppWalkthrough
        steps={COMPETITION_STEPS}
        isOpen={isOpen}
        onClose={closeWalkthrough}
        onComplete={completeWalkthrough}
        walkthroughId="competition-browser"
        title="Competition Simulator"
        subtitle="Practice for real WCA competitions"
      />

      {/* Floating help button - shown when walkthrough is completed */}
      {hasCompleted && !isOpen && (
        <button
          onClick={openWalkthrough}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium bg-(--surface) hover:bg-(--surface-elevated) border border-(--border) hover:border-(--primary) text-(--text-secondary) hover:text-(--text-primary) rounded-lg transition-all shadow-lg"
          title="How to use"
          aria-label="Show walkthrough"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </button>
      )}
    </>
  );
}

// Custom hook for competition walkthrough
export { useWalkthrough as useCompetitionWalkthrough };