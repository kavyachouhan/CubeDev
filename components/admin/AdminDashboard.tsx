"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  Users,
  Timer,
  MessageSquare,
  Mail,
  Trophy,
  Bell,
  GraduationCap,
  Medal,
  TrendingUp,
  Activity,
  Clock,
  UserPlus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCardSkeleton, ListItemSkeleton } from "./AdminSkeletons";

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-(--primary)",
  iconBgColor = "bg-(--primary)/10",
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}) {
  return (
    <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-(--text-muted) uppercase tracking-wide truncate font-inter">
            {title}
          </div>
          <div className="text-sm sm:text-lg font-bold text-(--text-primary) font-statement">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible Card Component with show/hide functionality
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : defaultOpen;
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-1 text-(--text-muted) hover:text-(--primary) transition-colors"
        >
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
            {title}
          </h3>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={toggleOpen}
          className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
          title={isOpen ? "Hide" : "Show"}
        >
          {isOpen ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {isOpen && children}
    </div>
  );
}

// Recent Activity Item Component
function ActivityItem({
  type,
  description,
  timestamp,
}: {
  type: string;
  description: string;
  timestamp: number;
}) {
  const getIcon = () => {
    switch (type) {
      case "user_registration":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "feedback":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "contact":
        return <Mail className="w-4 h-4 text-yellow-500" />;
      case "challenge_room":
        return <Trophy className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-(--text-muted)" />;
    }
  };

  const getTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-(--border) last:border-0">
      <div className="p-2 bg-(--surface-elevated) rounded-lg shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-(--text-primary) font-inter truncate">
          {description}
        </p>
        <p className="text-xs text-(--text-muted) font-inter mt-0.5">
          {getTimeAgo(timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const {
    data: systemStats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    isFromCache: statsFromCache,
    refetch: refetchStats,
  } = useCachedQuery(
    api.admin.getSystemStats,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.systemStats,
      ttl: ADMIN_CACHE_TTLS.dashboard,
    },
  );

  const {
    data: recentActivity,
    isFetching: activityFetching,
    refetch: refetchActivity,
  } = useCachedQuery(
    api.admin.getRecentActivity,
    { limit: 15 },
    {
      cacheKey: ADMIN_CACHE_KEYS.recentActivity(15),
      ttl: ADMIN_CACHE_TTLS.activity,
    },
  );

  const isLoading = statsLoading;
  const isFetching = statsFetching || activityFetching;

  const handleRefresh = () => {
    refetchStats();
    refetchActivity();
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-lg transition-colors disabled:opacity-50"
          title={
            statsFromCache
              ? "Data loaded from cache - Click to refresh"
              : "Refresh data"
          }
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
          {isFetching ? "Refreshing..." : statsFromCache ? "Cached" : "Refresh"}
        </button>
      </div>

      {/* Primary Stats */}
      <CollapsibleCard
        title="System Overview"
        defaultOpen={true}
        storageKey="admin-dashboard-overview"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {isLoading || !systemStats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={systemStats.users.total}
                icon={Users}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                title="Active Today"
                value={systemStats.users.activeDay}
                icon={TrendingUp}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
              />
              <StatCard
                title="Total Solves"
                value={systemStats.solves.total}
                icon={Timer}
                iconColor="text-yellow-500"
                iconBgColor="bg-yellow-500/10"
              />
              <StatCard
                title="Sessions"
                value={systemStats.sessions.total}
                icon={Clock}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              />
            </>
          )}
        </div>
      </CollapsibleCard>

      {/* Secondary Stats */}
      <div className="mt-4 sm:mt-6">
        <CollapsibleCard
          title="Features Overview"
          defaultOpen={true}
          storageKey="admin-dashboard-features"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {isLoading || !systemStats ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Challenge Rooms"
                  value={systemStats.challengeRooms.total}
                  icon={Trophy}
                  iconColor="text-orange-500"
                  iconBgColor="bg-orange-500/10"
                />
                <StatCard
                  title="Feedback"
                  value={systemStats.feedback.total}
                  icon={MessageSquare}
                  iconColor="text-cyan-500"
                  iconBgColor="bg-cyan-500/10"
                />
                <StatCard
                  title="Contact Messages"
                  value={systemStats.contact.total}
                  icon={Mail}
                  iconColor="text-pink-500"
                  iconBgColor="bg-pink-500/10"
                />
                <StatCard
                  title="Push Subs"
                  value={systemStats.pushSubscriptions.active}
                  icon={Bell}
                  iconColor="text-indigo-500"
                  iconBgColor="bg-indigo-500/10"
                />
                <StatCard
                  title="Coach Profiles"
                  value={systemStats.coach.totalProfiles}
                  icon={GraduationCap}
                  iconColor="text-teal-500"
                  iconBgColor="bg-teal-500/10"
                />
              </>
            )}
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
            {isLoading || !systemStats ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Algorithm Progress"
                  value={systemStats.algorithms.totalProgress}
                  icon={BookOpen}
                  iconColor="text-rose-500"
                  iconBgColor="bg-rose-500/10"
                />
                <StatCard
                  title="Competition Sims"
                  value={systemStats.competitions.total}
                  icon={Medal}
                  iconColor="text-amber-500"
                  iconBgColor="bg-amber-500/10"
                />
                <StatCard
                  title="Active This Week"
                  value={systemStats.users.activeWeek}
                  icon={Activity}
                  iconColor="text-emerald-500"
                  iconBgColor="bg-emerald-500/10"
                />
              </>
            )}
          </div>
        </CollapsibleCard>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6 items-start">
        {/* Recent Activity */}
        <CollapsibleCard
          title="Recent Activity"
          defaultOpen={true}
          storageKey="admin-dashboard-activity"
        >
          <div className="max-h-80 overflow-y-auto -mx-1 px-1">
            {recentActivity === undefined ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3 animate-pulse"
                  >
                    <div className="w-8 h-8 bg-(--surface-elevated) rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-(--surface-elevated) rounded" />
                      <div className="h-3 w-16 bg-(--surface-elevated) rounded mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-(--text-muted) text-sm font-inter py-4 text-center">
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity, index) => (
                <ActivityItem
                  key={index}
                  type={activity.type}
                  description={activity.description}
                  timestamp={activity.timestamp}
                />
              ))
            )}
          </div>
        </CollapsibleCard>

        {/* User Activity Breakdown */}
        <CollapsibleCard
          title="User Activity Breakdown"
          defaultOpen={true}
          storageKey="admin-dashboard-breakdown"
        >
          {isLoading || !systemStats ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-24 bg-(--surface-elevated) rounded" />
                    <div className="h-4 w-12 bg-(--surface-elevated) rounded" />
                  </div>
                  <div className="h-2 bg-(--surface-elevated) rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Today Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-(--text-secondary) font-inter">
                    Active Today
                  </span>
                  <span className="text-sm font-medium text-(--text-primary) font-inter">
                    {systemStats.users.activeDay} / {systemStats.users.total}
                  </span>
                </div>
                <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${systemStats.users.total > 0 ? Math.min((systemStats.users.activeDay / systemStats.users.total) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Active This Week Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-(--text-secondary) font-inter">
                    Active This Week
                  </span>
                  <span className="text-sm font-medium text-(--text-primary) font-inter">
                    {systemStats.users.activeWeek} / {systemStats.users.total}
                  </span>
                </div>
                <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${systemStats.users.total > 0 ? Math.min((systemStats.users.activeWeek / systemStats.users.total) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Active This Month Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-(--text-secondary) font-inter">
                    Active This Month
                  </span>
                  <span className="text-sm font-medium text-(--text-primary) font-inter">
                    {systemStats.users.activeMonth} / {systemStats.users.total}
                  </span>
                </div>
                <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{
                      width: `${systemStats.users.total > 0 ? Math.min((systemStats.users.activeMonth / systemStats.users.total) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Challenge Room Activity */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-(--text-secondary) font-inter">
                    Active Challenge Rooms
                  </span>
                  <span className="text-sm font-medium text-(--text-primary) font-inter">
                    {systemStats.challengeRooms.active} /{" "}
                    {systemStats.challengeRooms.total}
                  </span>
                </div>
                <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{
                      width: `${systemStats.challengeRooms.total > 0 ? Math.min((systemStats.challengeRooms.active / systemStats.challengeRooms.total) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Competition Completion */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-(--text-secondary) font-inter">
                    Completed Simulations
                  </span>
                  <span className="text-sm font-medium text-(--text-primary) font-inter">
                    {systemStats.competitions.completed} /{" "}
                    {systemStats.competitions.total}
                  </span>
                </div>
                <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{
                      width: `${systemStats.competitions.total > 0 ? Math.min((systemStats.competitions.completed / systemStats.competitions.total) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
