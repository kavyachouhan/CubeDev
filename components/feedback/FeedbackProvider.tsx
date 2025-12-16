"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import FeedbackSurveyModal, { type SurveyConfig } from "./FeedbackSurveyModal";
import FeedbackBanner from "./FeedbackBanner";
import type { Id } from "@/convex/_generated/dataModel";

const FEEDBACK_STORAGE_KEY = "cubedev-feedback-prompt";
const FEEDBACK_COOLDOWN_DAYS = 30;
const FEEDBACK_DELAY_MS = 180000; // 3 minutes

interface FeedbackDismissalData {
  dismissedAt: number;
  submittedAt?: number;
  surveyType?: string;
}

interface FeedbackContextType {
  openFeedbackModal: (config?: SurveyConfig) => void;
  closeFeedbackModal: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}

interface FeedbackProviderProps {
  children: ReactNode;
  /** Default survey configuration for the automatic banner prompt */
  defaultConfig?: SurveyConfig;
  /** Delay in milliseconds before showing the feedback banner (default: 3 minutes) */
  bannerDelayMs?: number;
  /** Disable the automatic banner prompt */
  disableAutoBanner?: boolean;
}

export function FeedbackProvider({
  children,
  defaultConfig,
  bannerDelayMs = FEEDBACK_DELAY_MS,
  disableAutoBanner = false,
}: FeedbackProviderProps) {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeConfig, setActiveConfig] = useState<SurveyConfig | undefined>(
    defaultConfig
  );

  // Check if user has recently submitted feedback
  const hasRecentFeedback = useQuery(
    api.feedbackResponses.hasRecentFeedback,
    user?.convexId
      ? {
          userId: user.convexId as Id<"users">,
          surveyType: defaultConfig?.surveyType,
        }
      : "skip"
  );

  // Determine if we should show the feedback prompt
  const shouldShowPrompt = useCallback(() => {
    if (typeof window === "undefined") return false;

    try {
      const surveyType = defaultConfig?.surveyType || "general";
      const storageKey = `${FEEDBACK_STORAGE_KEY}-${surveyType}`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return true;

      const data: FeedbackDismissalData = JSON.parse(stored);
      const cooldownMs = FEEDBACK_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // If submitted, use a longer cooldown
      if (data.submittedAt) {
        return now - data.submittedAt > cooldownMs;
      }

      // If just dismissed, use a shorter cooldown (7 days)
      if (data.dismissedAt) {
        const dismissCooldownMs = 7 * 24 * 60 * 60 * 1000;
        return now - data.dismissedAt > dismissCooldownMs;
      }

      return true;
    } catch {
      return true;
    }
  }, [defaultConfig?.surveyType]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || disableAutoBanner) return;

    // Don't show banner
    if (hasRecentFeedback || !shouldShowPrompt() || isModalOpen) {
      setShowBanner(false);
      return;
    }

    // Show the banner
    setShowBanner(true);
  }, [
    mounted,
    hasRecentFeedback,
    shouldShowPrompt,
    isModalOpen,
    disableAutoBanner,
  ]);

  const openFeedbackModal = useCallback(
    (config?: SurveyConfig) => {
      setShowBanner(false);
      setActiveConfig(config || defaultConfig);
      setIsModalOpen(true);
    },
    [defaultConfig]
  );

  const closeFeedbackModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleBannerDismiss = useCallback(() => {
    setShowBanner(false);

    // Store dismissal in localStorage
    try {
      const surveyType = defaultConfig?.surveyType || "general";
      const storageKey = `${FEEDBACK_STORAGE_KEY}-${surveyType}`;
      const data: FeedbackDismissalData = {
        dismissedAt: Date.now(),
        surveyType,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  }, [defaultConfig?.surveyType]);

  const handleSubmitSuccess = useCallback(() => {
    // Store submission in localStorage
    try {
      const surveyType =
        activeConfig?.surveyType || defaultConfig?.surveyType || "general";
      const storageKey = `${FEEDBACK_STORAGE_KEY}-${surveyType}`;
      const data: FeedbackDismissalData = {
        dismissedAt: Date.now(),
        submittedAt: Date.now(),
        surveyType,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  }, [activeConfig?.surveyType, defaultConfig?.surveyType]);

  const handleOpenSurveyFromBanner = useCallback(() => {
    setShowBanner(false);
    setActiveConfig(defaultConfig);
    setIsModalOpen(true);
  }, [defaultConfig]);

  const contextValue: FeedbackContextType = {
    openFeedbackModal,
    closeFeedbackModal,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      {/* Feedback Banner */}
      {showBanner && mounted && !disableAutoBanner && (
        <FeedbackBanner
          onOpenSurvey={handleOpenSurveyFromBanner}
          onDismiss={handleBannerDismiss}
          delayMs={bannerDelayMs}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackSurveyModal
        isOpen={isModalOpen}
        onClose={closeFeedbackModal}
        onSubmitSuccess={handleSubmitSuccess}
        config={activeConfig}
      />
    </FeedbackContext.Provider>
  );
}