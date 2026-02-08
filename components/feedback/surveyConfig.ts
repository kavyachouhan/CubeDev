// Centralized Survey Configuration
// This file defines all available surveys and their current versions.
// When adding a new feature, simply update the features list and bump the version.
// Users who haven't submitted feedback for the new version will see the survey again.

export const SURVEY_VERSIONS = {
  // Main general feedback survey
  general: "2.0", // Bumped to 2.0 to include Coach feature

  // Feature-specific surveys (optional)
  coach: "1.0",
  cubie: "1.0",
} as const;

export type SurveyType = keyof typeof SURVEY_VERSIONS;

// Features configuration - update this when adding new features
// The key should match what's stored in the database
export const SURVEY_FEATURES = {
  general: [
    { key: "timer", label: "Timer" },
    { key: "algorithmTrainer", label: "Algorithm Trainer" },
    { key: "challenges", label: "Challenge Rooms" },
    { key: "statistics", label: "Statistics" },
    { key: "competitions", label: "Competition Simulator" },
    { key: "coach", label: "Coach" }, // New feature added
  ],
  coach: [
    { key: "goalTracking", label: "Goal Tracking" },
    { key: "trainingPlan", label: "Training Plan" },
    { key: "progressAnalytics", label: "Progress Analytics" },
    { key: "journaling", label: "Practice Journal" },
  ],
  cubie: [
    { key: "chat", label: "Chat Experience" },
    { key: "accuracy", label: "Response Accuracy" },
    { key: "helpfulness", label: "Helpfulness" },
  ],
} as const;

// Default survey configurations for different contexts
export const DEFAULT_SURVEY_CONFIGS = {
  general: {
    surveyType: "general",
    surveyVersion: SURVEY_VERSIONS.general,
    title: "Share Your Feedback",
    successTitle: "Thank You!",
    successMessage:
      "Your feedback helps us make CubeDev better for everyone. We truly appreciate you taking the time to share your thoughts.",
    features: [...SURVEY_FEATURES.general],
    showUiuxRating: true,
    showFeatureRatings: true,
    showNpsScore: true,
    showFeatureRequests: true,
    showAdditionalComments: true,
  },
  coach: {
    surveyType: "coach",
    surveyVersion: SURVEY_VERSIONS.coach,
    title: "Coach Feedback",
    successTitle: "Thanks for your feedback!",
    successMessage:
      "Your feedback helps us improve the Coach feature and create better training experiences.",
    features: [...SURVEY_FEATURES.coach],
    showUiuxRating: true,
    showFeatureRatings: true,
    showNpsScore: false,
    showFeatureRequests: true,
    showAdditionalComments: true,
  },
  cubie: {
    surveyType: "cubie",
    surveyVersion: SURVEY_VERSIONS.cubie,
    title: "Cubie AI Feedback",
    successTitle: "Thanks for your feedback!",
    successMessage:
      "Your feedback helps us improve Cubie and make it more helpful for cubers.",
    features: [...SURVEY_FEATURES.cubie],
    showUiuxRating: true,
    showFeatureRatings: true,
    showNpsScore: false,
    showFeatureRequests: true,
    showAdditionalComments: true,
  },
};

// Helper to get the storage key for a specific survey
export function getSurveyStorageKey(surveyType: string): string {
  return `cubedev-feedback-prompt-${surveyType}`;
}

// Helper to check if a survey version has been updated since user's last submission
export function hasNewSurveyVersion(
  surveyType: SurveyType,
  lastSubmittedVersion?: string,
): boolean {
  const currentVersion = SURVEY_VERSIONS[surveyType];
  if (!lastSubmittedVersion) return true;

  // Parse versions (e.g., "1.0" -> [1, 0])
  const parseVersion = (v: string) => v.split(".").map(Number);
  const current = parseVersion(currentVersion);
  const last = parseVersion(lastSubmittedVersion);

  // Compare major version first, then minor
  if (current[0] > last[0]) return true;
  if (current[0] === last[0] && current[1] > last[1]) return true;

  return false;
}
