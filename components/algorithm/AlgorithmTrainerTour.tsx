"use client";

import { useEffect } from "react";
import ProductTour, { TourStep, useTour } from "@/components/ProductTour";
import {
  Brain,
  Target,
  Calendar,
  Flame,
  TrendingUp,
  FolderPlus,
  Play,
  EyeOff,
  BarChart3,
  BookOpen,
  Layers,
  Sparkles,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

const TOUR_ID = "algorithm-trainer-tour";

const algorithmTrainerSteps: TourStep[] = [
  {
    target: "[data-tour='progress-section']",
    title: "YOUR PROGRESS",
    content:
      "Track your learning journey at a glance. See how many algorithms you've learned, mastered, and how many reviews are due today.",
    placement: "bottom",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    target: "[data-tour='total-learned']",
    title: "LEARNING TRACKER",
    content:
      "This shows the total number of algorithm cases you've started learning. Each case you practice gets added to your learning queue.",
    placement: "bottom",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    target: "[data-tour='mastered']",
    title: "MASTERY COUNT",
    content:
      "Cases you've completely mastered appear here. Mastery is achieved through consistent correct recalls using our spaced repetition system.",
    placement: "bottom",
    icon: <Target className="w-5 h-5" />,
  },
  {
    target: "[data-tour='due-today']",
    title: "DUE REVIEWS",
    content:
      "Reviews scheduled for today appear here. Completing these on time helps optimize your long-term retention through spaced repetition.",
    placement: "bottom",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    target: "[data-tour='reviewed-today']",
    title: "DAILY PROGRESS",
    content:
      "Track how many reviews you've completed today. Consistent daily practice is key to improving your algorithm knowledge.",
    placement: "bottom",
    icon: <Flame className="w-5 h-5" />,
  },
  {
    target: "[data-tour='srs-review-prompt']",
    title: "SRS REVIEW",
    content:
      "When you have due reviews, this prompt will appear. Spaced Repetition System (SRS) optimizes your review schedule based on your performance.",
    placement: "bottom",
    icon: <RefreshCw className="w-5 h-5" />,
  },
  {
    target: "[data-tour='practice-modes']",
    title: "PRACTICE MODES",
    content:
      "Multiple practice modes help you train different skills. Choose from recognition drills, execution practice, or blind recognition for complete mastery.",
    placement: "top",
    icon: <Play className="w-5 h-5" />,
  },
  {
    target: "[data-tour='recognition-drill']",
    title: "RECOGNITION DRILL",
    content:
      "Practice identifying algorithm cases quickly. You'll see a cube state and need to identify the correct case name.",
    placement: "right",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    target: "[data-tour='execution-drill']",
    title: "EXECUTION DRILL",
    content:
      "Improve your algorithm execution speed. Practice performing algorithms as fast as possible with timing.",
    placement: "right",
    icon: <Flame className="w-5 h-5" />,
  },
  {
    target: "[data-tour='blind-recognition']",
    title: "BLIND RECOGNITION",
    content:
      "Advanced mode: recall case names purely from memory without visual aids. Great for building pattern intuition.",
    placement: "left",
    icon: <EyeOff className="w-5 h-5" />,
  },
  {
    target: "[data-tour='algorithm-sets-header']",
    title: "ALGORITHM SETS",
    content:
      "Browse curated algorithm sets like OLL, PLL, F2L, and more. Each set contains related cases grouped by category.",
    placement: "bottom",
    icon: <Layers className="w-5 h-5" />,
  },
  {
    target: "[data-tour='custom-sets-button']",
    title: "CUSTOM SETS",
    content:
      "Create your own custom algorithm sets. Group specific cases you want to focus on, import sets from others, or share your own.",
    placement: "left",
    icon: <FolderPlus className="w-5 h-5" />,
  },
  {
    target: "[data-tour='algorithm-set-card']",
    title: "SET CARDS",
    content:
      "Each card shows a set's difficulty, total cases, and your progress. Click on a set to explore its individual cases.",
    placement: "top",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    target: "[data-tour='analytics-button']",
    title: "DETAILED ANALYTICS",
    content:
      "View comprehensive statistics about your learning. Track recognition times, mastery progression, and practice history.",
    placement: "bottom",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    target: "[data-tour='heatmap']",
    title: "ACTIVITY HEATMAP",
    content:
      "Visualize your practice consistency over time. The heatmap shows your review activity, helping you maintain a consistent practice schedule.",
    placement: "top",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

// Function to filter steps based on user data
const getApplicableSteps = (
  hasProgress: boolean,
  hasPracticeModes: boolean
): TourStep[] => {
  const steps = [...algorithmTrainerSteps];

  // Filter steps based on user data
  return steps.filter((step) => {
    // Always show core sections
    if (
      step.target === "[data-tour='progress-section']" ||
      step.target === "[data-tour='algorithm-sets-header']" ||
      step.target === "[data-tour='custom-sets-button']" ||
      step.target === "[data-tour='algorithm-set-card']"
    ) {
      return true;
    }

    // Learning stats always visible
    if (
      step.target === "[data-tour='total-learned']" ||
      step.target === "[data-tour='mastered']" ||
      step.target === "[data-tour='due-today']" ||
      step.target === "[data-tour='reviewed-today']"
    ) {
      return true;
    }

    // Practice modes only visible if user has them enabled
    if (
      step.target === "[data-tour='practice-modes']" ||
      step.target === "[data-tour='recognition-drill']" ||
      step.target === "[data-tour='execution-drill']" ||
      step.target === "[data-tour='blind-recognition']"
    ) {
      return hasPracticeModes;
    }

    // SRS review prompt only visible if user has progress
    if (step.target === "[data-tour='srs-review-prompt']") {
      return hasProgress;
    }

    // Analytics only visible if user has progress or practice modes
    if (step.target === "[data-tour='analytics-button']") {
      return hasPracticeModes;
    }

    // Heatmap only visible if user has progress
    if (step.target === "[data-tour='heatmap']") {
      return hasProgress;
    }

    return true;
  });
};

interface AlgorithmTrainerTourProps {
  hasProgress?: boolean;
  hasPracticeModes?: boolean;
  hasHeatmap?: boolean;
}

export default function AlgorithmTrainerTour({
  hasProgress = false,
  hasPracticeModes = false,
  hasHeatmap = false,
}: AlgorithmTrainerTourProps) {
  const { isOpen, hasCompletedTour, startTour, closeTour, completeTour } =
    useTour(TOUR_ID);

  // Auto-start the tour if not completed
  useEffect(() => {
    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, startTour]);

  const steps = getApplicableSteps(hasProgress || hasHeatmap, hasPracticeModes);

  return (
    <>
      <ProductTour
        steps={steps}
        isOpen={isOpen}
        onClose={closeTour}
        onComplete={completeTour}
        tourId={TOUR_ID}
      />

      {/* Tour restart button - shown when tour is completed */}
      {hasCompletedTour && !isOpen && (
        <button
          onClick={startTour}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all shadow-lg"
          title="How to use"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </button>
      )}
    </>
  );
}

// Function to render the walkthrough modal
export { TOUR_ID, algorithmTrainerSteps };