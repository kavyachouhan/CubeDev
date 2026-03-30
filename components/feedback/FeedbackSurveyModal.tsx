"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { X, Star, Send, MessageSquare, CircleCheck } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import FeedbackDropdown from "./FeedbackDropdown";

// Default features to rate - keep in sync with surveyConfig.ts
export const DEFAULT_FEATURES = [
  { key: "timer", label: "Timer" },
  { key: "algorithmTrainer", label: "Algorithm Trainer" },
  { key: "challenges", label: "Challenge Rooms" },
  { key: "statistics", label: "Statistics" },
  { key: "competitions", label: "Competition Simulator" },
  { key: "coach", label: "Coach" },
] as const;

// Survey configuration interface
export interface SurveyConfig {
  surveyType?: string;
  surveyVersion?: string;
  title?: string;
  successTitle?: string;
  successMessage?: string;
  features?: Array<{ key: string; label: string }>;
  showUiuxRating?: boolean;
  showFeatureRatings?: boolean;
  showNpsScore?: boolean;
  showFeatureRequests?: boolean;
  showAdditionalComments?: boolean;
  customQuestions?: Array<{
    id: string;
    question: string;
    type: "text" | "textarea" | "rating" | "select";
    options?: string[];
    required?: boolean;
  }>;
}

// Default configuration
const DEFAULT_CONFIG: Required<Omit<SurveyConfig, "customQuestions">> & {
  customQuestions?: SurveyConfig["customQuestions"];
} = {
  surveyType: "general",
  surveyVersion: "2.0", // Updated to 2.0 to include Coach
  title: "Share Your Feedback",
  successTitle: "Thank You!",
  successMessage:
    "Your feedback helps us make CubeDev better for everyone. We truly appreciate you taking the time to share your thoughts.",
  features: [...DEFAULT_FEATURES],
  showUiuxRating: true,
  showFeatureRatings: true,
  showNpsScore: true,
  showFeatureRequests: true,
  showAdditionalComments: true,
  customQuestions: undefined,
};

interface FeedbackSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: () => void;
  config?: SurveyConfig;
}

export default function FeedbackSurveyModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  config: userConfig,
}: FeedbackSurveyModalProps) {
  const { user } = useUser();

  // Merge user config with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...userConfig,
      features: userConfig?.features || DEFAULT_CONFIG.features,
    }),
    [userConfig],
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form state
  const [uiuxRating, setUiuxRating] = useState(0);
  const [featureRatings, setFeatureRatings] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      config.features.forEach((f) => {
        initial[f.key] = 0;
      });
      return initial;
    },
  );
  const [mostUsefulFeature, setMostUsefulFeature] = useState("");
  const [featureRequests, setFeatureRequests] = useState("");
  const [recommendScore, setRecommendScore] = useState(0);
  const [additionalComments, setAdditionalComments] = useState("");
  const [customResponses, setCustomResponses] = useState<
    Record<string, string | number>
  >({});

  const submitFeedback = useMutation(api.feedbackResponses.submitFeedback);

  // Calculate total steps based on config
  const steps = useMemo(() => {
    const s: string[] = [];
    if (config.showUiuxRating) s.push("uiux");
    if (config.showFeatureRatings) s.push("features");
    if (config.showNpsScore) s.push("nps");
    if (config.customQuestions && config.customQuestions.length > 0)
      s.push("custom");
    if (config.showAdditionalComments) s.push("comments");
    return s;
  }, [config]);

  const totalSteps = steps.length;

  const handleFeatureRating = (feature: string, rating: number) => {
    setFeatureRatings((prev) => ({ ...prev, [feature]: rating }));
  };

  const handleCustomResponse = (questionId: string, value: string | number) => {
    setCustomResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    const currentStepType = steps[currentStep - 1];
    switch (currentStepType) {
      case "uiux":
        return uiuxRating > 0;
      case "features":
        return Object.values(featureRatings).every((r) => r > 0);
      case "nps":
        return recommendScore > 0;
      case "custom":
        // Check required custom questions
        const requiredQuestions =
          config.customQuestions?.filter((q) => q.required) || [];
        return requiredQuestions.every((q) => {
          const response = customResponses[q.id];
          return response !== undefined && response !== "" && response !== 0;
        });
      case "comments":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId: user?.convexId as Id<"users"> | undefined,
        surveyType: config.surveyType,
        surveyVersion: config.surveyVersion,
        uiuxRating: config.showUiuxRating ? uiuxRating : undefined,
        featureRatings: config.showFeatureRatings ? featureRatings : undefined,
        mostUsefulFeature: mostUsefulFeature || undefined,
        featureRequests: config.showFeatureRequests
          ? featureRequests || undefined
          : undefined,
        recommendScore: config.showNpsScore ? recommendScore : undefined,
        additionalComments: config.showAdditionalComments
          ? additionalComments || undefined
          : undefined,
        customResponses: config.customQuestions ? customResponses : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      setIsSubmitted(true);
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setCurrentStep(1);
    setUiuxRating(0);
    const initialRatings: Record<string, number> = {};
    config.features.forEach((f) => {
      initialRatings[f.key] = 0;
    });
    setFeatureRatings(initialRatings);
    setMostUsefulFeature("");
    setFeatureRequests("");
    setRecommendScore(0);
    setAdditionalComments("");
    setCustomResponses({});
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  // Success state
  if (isSubmitted) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Spacebar") {
            e.stopPropagation();
          }
        }}
      >
        <div className="timer-card max-w-md w-full">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-(--success)/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CircleCheck className="w-8 h-8 text-(--success)" />
            </div>
            <h2 className="text-2xl font-bold text-(--text-primary) mb-3 font-statement">
              {config.successTitle}
            </h2>
            <p className="text-(--text-secondary) font-inter mb-6">
              {config.successMessage}
            </p>
            <button onClick={handleClose} className="btn-primary px-6 py-2">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepType = steps[currentStep - 1];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Spacebar") {
          e.stopPropagation();
        }
      }}
    >
      <div className="timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-(--text-primary) font-statement">
              {config.title}
            </h2>
            <p className="text-sm text-(--text-muted) font-inter mt-1">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-(--surface-elevated) rounded-full h-2 mb-6">
          <div
            className="bg-(--primary) h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step: UI/UX Rating */}
        {currentStepType === "uiux" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-inter">
                How would you rate the overall design and experience?
              </h3>
              <p className="text-sm text-(--text-muted) font-inter">
                Consider the visual design, ease of use, and overall feel of
                CubeDev.
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setUiuxRating(rating)}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    uiuxRating >= rating
                      ? "text-(--warning)"
                      : "text-(--text-muted) hover:text-(--text-secondary)"
                  }`}
                >
                  <Star
                    className="w-8 h-8"
                    fill={uiuxRating >= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-(--text-muted) font-inter px-2">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        )}

        {/* Step: Feature Ratings */}
        {currentStepType === "features" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-inter">
                Rate how useful each feature is to you
              </h3>
              <p className="text-sm text-(--text-muted) font-inter">
                Even if you haven't used a feature, rate how valuable you think
                it would be.
              </p>
            </div>

            <div className="space-y-4">
              {config.features.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 p-3 bg-(--surface-elevated) rounded-lg"
                >
                  <span className="text-sm font-medium text-(--text-primary) font-inter">
                    {label}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleFeatureRating(key, rating)}
                        className={`p-1.5 rounded transition-all duration-200 ${
                          (featureRatings[key] || 0) >= rating
                            ? "text-(--warning)"
                            : "text-(--text-muted) hover:text-(--text-secondary)"
                        }`}
                      >
                        <Star
                          className="w-5 h-5"
                          fill={
                            (featureRatings[key] || 0) >= rating
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <FeedbackDropdown
              label="Which feature do you find most useful? (Optional)"
              placeholder="Select a feature..."
              options={config.features.map(({ key, label }) => ({
                value: key,
                label: label,
              }))}
              value={mostUsefulFeature}
              onChange={setMostUsefulFeature}
            />
          </div>
        )}

        {/* Step: NPS Score */}
        {currentStepType === "nps" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-inter">
                How likely are you to recommend CubeDev to a friend?
              </h3>
              <p className="text-sm text-(--text-muted) font-inter">
                On a scale from 1 to 10, how likely would you recommend us?
              </p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => setRecommendScore(score)}
                  className={`py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 font-inter ${
                    recommendScore === score
                      ? "bg-(--primary) text-white"
                      : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border) hover:text-(--text-primary)"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-(--text-muted) font-inter px-1">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>

            {config.showFeatureRequests && (
              <div>
                <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                  What features would you like to see? (Optional)
                </label>
                <textarea
                  value={featureRequests}
                  onChange={(e) => setFeatureRequests(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
                  placeholder="Tell us about features you'd love to have..."
                  maxLength={500}
                />
              </div>
            )}
          </div>
        )}

        {/* Step: Custom Questions */}
        {currentStepType === "custom" && config.customQuestions && (
          <div className="space-y-6">
            {config.customQuestions.map((question) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                  {question.question}
                  {question.required && (
                    <span className="text-(--error) ml-1">*</span>
                  )}
                </label>

                {question.type === "text" && (
                  <input
                    type="text"
                    value={(customResponses[question.id] as string) || ""}
                    onChange={(e) =>
                      handleCustomResponse(question.id, e.target.value)
                    }
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                  />
                )}

                {question.type === "textarea" && (
                  <textarea
                    value={(customResponses[question.id] as string) || ""}
                    onChange={(e) =>
                      handleCustomResponse(question.id, e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
                  />
                )}

                {question.type === "rating" && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() =>
                          handleCustomResponse(question.id, rating)
                        }
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          (customResponses[question.id] as number) >= rating
                            ? "text-(--warning)"
                            : "text-(--text-muted) hover:text-(--text-secondary)"
                        }`}
                      >
                        <Star
                          className="w-6 h-6"
                          fill={
                            (customResponses[question.id] as number) >= rating
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "select" && question.options && (
                  <FeedbackDropdown
                    placeholder="Select an option..."
                    options={question.options.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                    value={(customResponses[question.id] as string) || ""}
                    onChange={(value) =>
                      handleCustomResponse(question.id, value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step: Additional Comments */}
        {currentStepType === "comments" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-inter">
                Anything else you'd like to share?
              </h3>
              <p className="text-sm text-(--text-muted) font-inter">
                Any additional feedback, suggestions, or comments are welcome.
              </p>
            </div>

            <div>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
                placeholder="Share your thoughts..."
                maxLength={1000}
              />
            </div>

            <div className="p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-(--primary) mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-(--text-primary) font-inter">
                    Have a question or issue?
                  </h4>
                  <p className="text-sm text-(--text-muted) font-inter mt-1">
                    For specific questions or issues, please use our{" "}
                    <Link
                      href="/contact"
                      className="text-(--primary) hover:underline"
                      onClick={handleClose}
                      target="_blank"
                    >
                      contact form
                    </Link>{" "}
                    for a direct response.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 btn-secondary py-3 sm:py-2"
            >
              Back
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 btn-primary py-3 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 btn-primary py-3 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
