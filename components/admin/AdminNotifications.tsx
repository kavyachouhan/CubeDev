"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bell,
  Filter,
  Send,
  XCircle,
  Clock,
  MousePointer,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// CollapsibleCard Component
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

// StatCard Component
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

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case "pending":
        return "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20";
      case "sent":
        return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20";
      case "failed":
        return "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20";
      case "clicked":
        return "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20";
      default:
        return "bg-[var(--surface-elevated)] text-[var(--text-muted)]";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "sent":
        return <Send className="w-3 h-3" />;
      case "failed":
        return <XCircle className="w-3 h-3" />;
      case "clicked":
        return <MousePointer className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}
    >
      {getIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Notification Log Item
function NotificationLogItem({ log }: { log: any }) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="timer-card hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={log.status} />
            <span className="text-xs px-2 py-0.5 bg-[var(--surface-elevated)] text-[var(--text-muted)] rounded-full font-inter">
              {log.type}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-statement truncate">
            {log.title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-inter line-clamp-2 mt-1">
            {log.body}
          </p>
          {log.error && (
            <p className="text-xs text-[var(--error)] font-inter mt-2 p-2 bg-[var(--error)]/5 rounded">
              Error: {log.error}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-[var(--text-muted)] font-inter">
            {formatDate(log.sentAt)}
          </p>
          {log.clickedAt && (
            <p className="text-xs text-[var(--success)] font-inter mt-1">
              Clicked: {formatDate(log.clickedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const logs = useQuery(api.admin.getPushNotificationLogs, {
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Calculate stats
  const stats = logs
    ? {
        total: logs.length,
        sent: logs.filter((l) => l.status === "sent").length,
        failed: logs.filter((l) => l.status === "failed").length,
        clicked: logs.filter((l) => l.status === "clicked").length,
        pending: logs.filter((l) => l.status === "pending").length,
      }
    : null;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
          Notifications
        </h1>
        <p className="mt-1 text-[var(--text-muted)] font-inter">
          Push notification logs and analytics
        </p>
      </div>

      {/* Stats Row */}
      <CollapsibleCard
        title="Statistics"
        storageKey="admin-notifications-stats-open"
        defaultOpen={true}
      >
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              title="Total Sent"
              value={stats.total}
              icon={Bell}
              iconColor="text-blue-500"
              iconBgColor="bg-blue-500/10"
            />
            <StatCard
              title="Delivered"
              value={stats.sent}
              icon={Send}
              iconColor="text-green-500"
              iconBgColor="bg-green-500/10"
            />
            <StatCard
              title="Failed"
              value={stats.failed}
              icon={XCircle}
              iconColor="text-red-500"
              iconBgColor="bg-red-500/10"
            />
            <StatCard
              title="Clicked"
              value={stats.clicked}
              icon={MousePointer}
              iconColor="text-purple-500"
              iconBgColor="bg-purple-500/10"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              iconColor="text-amber-500"
              iconBgColor="bg-amber-500/10"
            />
          </div>
        )}
      </CollapsibleCard>

      {/* Filter */}
      <div className="timer-card mt-6">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)] font-inter">
            Status:
          </span>
          <div className="flex flex-wrap gap-2">
            {["all", "sent", "failed", "clicked", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs rounded-lg font-inter transition-colors ${
                  statusFilter === status
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Logs */}
      <div className="mt-6">
        <CollapsibleCard
          title="Recent Logs"
          storageKey="admin-notifications-logs-open"
          defaultOpen={true}
        >
          {logs === undefined ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="timer-card animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                    <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded-full" />
                  </div>
                  <div className="h-4 w-48 bg-[var(--surface-elevated)] rounded mb-1" />
                  <div className="h-3 w-64 bg-[var(--surface-elevated)] rounded" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="timer-card text-center py-8">
              <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] font-inter">
                {statusFilter === "all"
                  ? "No notification logs yet"
                  : `No ${statusFilter} notifications`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <NotificationLogItem key={log._id} log={log} />
              ))}
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
