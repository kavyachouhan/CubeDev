"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
} from "lucide-react";

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-[var(--primary)]",
  iconBgColor = "bg-[var(--primary)]/10",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate font-inter">
            {title}
          </div>
          <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
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
          className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
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
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
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
        return <Activity className="w-4 h-4 text-[var(--text-muted)]" />;
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
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="p-2 bg-[var(--surface-elevated)] rounded-lg shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] font-inter truncate">
          {description}
        </p>
        <p className="text-xs text-[var(--text-muted)] font-inter mt-0.5">
          {getTimeAgo(timestamp)}
        </p>
      </div>
    </div>
  );
}

// Loading Skeleton for stat cards
function StatCardSkeleton() {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)] animate-pulse">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-[var(--surface)] rounded-lg">
          <div className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-3 w-20 bg-[var(--surface)] rounded mb-1" />
          <div className="h-5 w-12 bg-[var(--surface)] rounded" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const systemStats = useQuery(api.admin.getSystemStats);
  const recentActivity = useQuery(api.admin.getRecentActivity, { limit: 15 });

  const isLoading = systemStats === undefined;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Primary Stats */}
      <CollapsibleCard
        title="System Overview"
        defaultOpen={true}
        storageKey="admin-dashboard-overview"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {isLoading ? (
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
            {isLoading ? (
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
            {isLoading ? (
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
                    <div className="w-8 h-8 bg-[var(--surface-elevated)] rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-[var(--surface-elevated)] rounded" />
                      <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm font-inter py-4 text-center">
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
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded" />
                    <div className="h-4 w-12 bg-[var(--surface-elevated)] rounded" />
                  </div>
                  <div className="h-2 bg-[var(--surface-elevated)] rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Today Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Active Today
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    {systemStats.users.activeDay} / {systemStats.users.total}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
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
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Active This Week
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    {systemStats.users.activeWeek} / {systemStats.users.total}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
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
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Active This Month
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    {systemStats.users.activeMonth} / {systemStats.users.total}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
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
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Active Challenge Rooms
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    {systemStats.challengeRooms.active} /{" "}
                    {systemStats.challengeRooms.total}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
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
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Completed Simulations
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    {systemStats.competitions.completed} /{" "}
                    {systemStats.competitions.total}
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
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
