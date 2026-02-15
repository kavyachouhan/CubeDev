export { default as AdminLayout } from "./AdminLayout";
export { default as AdminProtectedRoute } from "./AdminProtectedRoute";
export { AdminProvider, useAdmin } from "./AdminContext";
export { default as AdminDashboard } from "./AdminDashboard";
export { default as AdminUsers } from "./AdminUsers";
export { default as AdminFeedback } from "./AdminFeedback";
export { default as AdminContact } from "./AdminContact";
export { default as AdminNotifications } from "./AdminNotifications";
export { default as AdminChallenges } from "./AdminChallenges";
export { default as AdminAlgorithms } from "./AdminAlgorithms";
export { default as AdminCoach } from "./AdminCoach";
export { default as AdminCompetitions } from "./AdminCompetitions";
export { default as AdminTimerStats } from "./AdminTimerStats";

// Shared skeleton components
export {
  SkeletonPulse,
  StatCardSkeleton,
  StatCardsRowSkeleton,
  CollapsibleCardSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  BadgeCardSkeleton,
  ChartSkeleton,
  FilterBarSkeleton,
  AdminPageSkeleton,
  EmptyState,
} from "./AdminSkeletons";

// Shared UI components
export {
  AdminDropdown,
  AdminSelect,
  AdminFilterDropdown,
  type DropdownOption,
} from "./AdminDropdown";