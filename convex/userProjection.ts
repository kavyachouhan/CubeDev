import { Doc } from "./_generated/dataModel";

const SECRET_FIELDS = [
  "accessToken",
  "refreshToken",
  "tokenExpiry",
] as const;

export type PublicUser = {
  _id: Doc<"users">["_id"];
  wcaId: string;
  wcaUserId: number;
  idSource?: Doc<"users">["idSource"];
  name: string;
  countryIso2: string;
  avatar?: string;
  gender?: string;
  createdAt: number;
  hideProfile?: boolean;
  hideChallengeStats?: boolean;
  isDeleted?: boolean;
};

export type OwnerUser = PublicUser & {
  email?: string;
  themeMode?: string;
  colorScheme?: string;
  timerFontSize?: string;
  timerFontFamily?: string;
  timerUpdateMode?: string;
  cubeViewMode?: string;
  reduceMotion?: boolean;
  disableGlow?: boolean;
  highContrast?: boolean;
  algorithmReminders?: boolean;
  coachingDailyPracticeReminder?: boolean;
  coachingDailyPracticeTime?: string;
  coachingStreakAlerts?: boolean;
  coachingWeeklySummary?: boolean;
  coachingGoalProgressUpdates?: boolean;
  notificationTimeZone?: string;
  dismissedNotifications?: Doc<"users">["dismissedNotifications"];
  timerImportOnboardingNextPromptAt?: number;
  timerImportOnboardingLastDismissedAt?: number;
  timerImportOnboardingCompletedAt?: number;
  lastLoginAt: number;
  updatedAt: number;
  convertedToWcaAt?: number;
};

export type AdminUser = OwnerUser & {
  gender?: string;
};

function withoutSecrets<T extends Record<string, unknown>>(user: T) {
  const copy = { ...user };
  for (const field of SECRET_FIELDS) {
    delete copy[field];
  }
  return copy;
}

export function toPublicUser(
  user: Doc<"users"> | null | undefined,
): PublicUser | null {
  if (!user) return null;
  return {
    _id: user._id,
    wcaId: user.wcaId,
    wcaUserId: user.wcaUserId,
    idSource: user.idSource,
    name: user.name,
    countryIso2: user.countryIso2,
    avatar: user.avatar,
    gender: user.gender,
    createdAt: user.createdAt,
    hideProfile: user.hideProfile,
    hideChallengeStats: user.hideChallengeStats,
    isDeleted: user.isDeleted,
  };
}

export function toOwnerUser(
  user: Doc<"users"> | null | undefined,
): OwnerUser | null {
  if (!user) return null;
  const publicUser = toPublicUser(user);
  if (!publicUser) return null;
  return {
    ...publicUser,
    email: user.email,
    themeMode: user.themeMode,
    colorScheme: user.colorScheme,
    timerFontSize: user.timerFontSize,
    timerFontFamily: user.timerFontFamily,
    timerUpdateMode: user.timerUpdateMode,
    cubeViewMode: user.cubeViewMode,
    reduceMotion: user.reduceMotion,
    disableGlow: user.disableGlow,
    highContrast: user.highContrast,
    algorithmReminders: user.algorithmReminders,
    coachingDailyPracticeReminder: user.coachingDailyPracticeReminder,
    coachingDailyPracticeTime: user.coachingDailyPracticeTime,
    coachingStreakAlerts: user.coachingStreakAlerts,
    coachingWeeklySummary: user.coachingWeeklySummary,
    coachingGoalProgressUpdates: user.coachingGoalProgressUpdates,
    notificationTimeZone: user.notificationTimeZone,
    dismissedNotifications: user.dismissedNotifications,
    timerImportOnboardingNextPromptAt: user.timerImportOnboardingNextPromptAt,
    timerImportOnboardingLastDismissedAt:
      user.timerImportOnboardingLastDismissedAt,
    timerImportOnboardingCompletedAt: user.timerImportOnboardingCompletedAt,
    lastLoginAt: user.lastLoginAt,
    updatedAt: user.updatedAt,
    convertedToWcaAt: user.convertedToWcaAt,
  };
}

export function toAdminUser(
  user: Doc<"users"> | null | undefined,
): AdminUser | null {
  if (!user) return null;
  const owner = toOwnerUser(user);
  if (!owner) return null;
  return {
    ...owner,
    gender: user.gender,
  };
}

export function stripUserSecrets<T extends Record<string, unknown> | null | undefined>(
  user: T,
): T {
  if (!user) return user;
  return withoutSecrets(user) as T;
}
