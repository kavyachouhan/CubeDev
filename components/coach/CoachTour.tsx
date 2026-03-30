"use client";

import { useEffect, useCallback } from "react";
import ProductTour, { TourStep, useTour } from "@/components/ProductTour";
import {
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
  Sparkles,
  Brain,
  Clock,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

const TOUR_ID = "coach-tour";

const coachTourSteps: TourStep[] = [
  {
    target: "[data-tour='goal-summary']",
    title: "YOUR GOAL",
    content:
      "This is your personalized goal. Based on your current skill level and target date, we'll create a tailored training plan to help you improve.",
    placement: "bottom",
    icon: <Target className="w-5 h-5" />,
  },
  {
    target: "[data-tour='coach-tabs']",
    title: "NAVIGATION TABS",
    content:
      "Switch between Training Plan, Journal, and Progress views. Each section helps you stay organized and track your improvement journey.",
    placement: "bottom",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    target: "[data-tour='training-plan-tab']",
    title: "TRAINING PLAN",
    content:
      "Your personalized weekly training schedule. Our recommendation engine creates activities based on your skill gaps, available time, and learning pace.",
    placement: "bottom",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    target: "[data-tour='journal-tab']",
    title: "PRACTICE JOURNAL",
    content:
      "Log your daily practice sessions. Track your solves, session times, mood, and notes. This data helps our system understand your progress patterns.",
    placement: "bottom",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    target: "[data-tour='progress-tab']",
    title: "PROGRESS TRACKING",
    content:
      "View detailed analytics of your improvement over time. See your goal progress, practice streaks, weekly summaries, and historical performance.",
    placement: "bottom",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    target: "[data-tour='week-header']",
    title: "WEEKLY OVERVIEW",
    content:
      "See your current week's progress at a glance. Track how many training days you've completed and your overall weekly completion percentage.",
    placement: "bottom",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    target: "[data-tour='daily-plan']",
    title: "DAILY ACTIVITIES",
    content:
      "Each day has specific activities tailored to your needs. Click to expand and see timed solves, algorithm drills, and practice sessions.",
    placement: "top",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    target: "[data-tour='activity-item']",
    title: "TRACK ACTIVITIES",
    content:
      "Check off activities as you complete them. Each activity includes duration, target solves, and specific focus areas to maximize your improvement.",
    placement: "top",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    target: "[data-tour='recommendation-engine']",
    title: "SMART RECOMMENDATIONS",
    content:
      "Our recommendation engine analyzes your solve times, weak areas, and practice patterns to suggest the most effective training activities for you.",
    placement: "bottom",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    target: "[data-tour='goal-progress']",
    title: "GOAL PROGRESS",
    content:
      "Track how close you are to your target time. We compare your expected progress based on timeline vs actual improvement to keep you on track.",
    placement: "bottom",
    icon: <Target className="w-5 h-5" />,
  },
  {
    target: "[data-tour='practice-streak']",
    title: "PRACTICE STREAKS",
    content:
      "Build consistency with daily practice streaks. Maintaining a streak has been shown to significantly improve retention and skill development.",
    placement: "bottom",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

interface CoachTourProps {
  hasProfile?: boolean;
  hasActivePlan?: boolean;
  activeTab?: "plan" | "journal" | "progress";
  autoStart?: boolean;
  showFloatingButton?: boolean;
}

export default function CoachTour({
  hasProfile = false,
  hasActivePlan = false,
  activeTab = "plan",
  autoStart = false,
  showFloatingButton = false,
}: CoachTourProps) {
  const { isOpen, hasCompletedTour, startTour, closeTour, completeTour } =
    useTour(TOUR_ID);

  // Auto-start the tour only if autoStart prop is true
  useEffect(() => {
    if (autoStart && !hasCompletedTour && hasProfile && hasActivePlan) {
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoStart, hasCompletedTour, hasProfile, hasActivePlan, startTour]);

  // Filter steps based on available elements
  const getApplicableSteps = useCallback((): TourStep[] => {
    const steps = [...coachTourSteps];

    return steps.filter((step) => {
      // Always show goal and navigation steps
      if (
        step.target === "[data-tour='goal-summary']" ||
        step.target === "[data-tour='coach-tabs']"
      ) {
        return hasProfile;
      }

      // Tab navigation steps
      if (
        step.target === "[data-tour='training-plan-tab']" ||
        step.target === "[data-tour='journal-tab']" ||
        step.target === "[data-tour='progress-tab']"
      ) {
        return hasProfile;
      }

      // Training plan specific steps
      if (
        step.target === "[data-tour='week-header']" ||
        step.target === "[data-tour='daily-plan']" ||
        step.target === "[data-tour='activity-item']" ||
        step.target === "[data-tour='recommendation-engine']"
      ) {
        return hasActivePlan && activeTab === "plan";
      }

      // Progress specific steps
      if (
        step.target === "[data-tour='goal-progress']" ||
        step.target === "[data-tour='practice-streak']"
      ) {
        return hasProfile && activeTab === "progress";
      }

      return true;
    });
  }, [hasProfile, hasActivePlan, activeTab]);

  const steps = getApplicableSteps();

  if (!hasProfile || steps.length === 0) return null;

  return (
    <>
      <ProductTour
        steps={steps}
        isOpen={isOpen}
        onClose={closeTour}
        onComplete={completeTour}
        tourId={TOUR_ID}
      />

      {/* Floating help button - shown when tour is completed and explicitly enabled */}
      {showFloatingButton && hasCompletedTour && !isOpen && (
        <button
          onClick={startTour}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium bg-(--surface) hover:bg-(--surface-elevated) border border-(--border) hover:border-(--primary) text-(--text-secondary) hover:text-(--text-primary) rounded-lg transition-all shadow-lg"
          title="How to use"
          aria-label="How to use"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </button>
      )}
    </>
  );
}

export { TOUR_ID, coachTourSteps };
