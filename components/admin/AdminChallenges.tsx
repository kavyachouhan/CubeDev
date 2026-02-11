"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Trophy,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  BarChart3,
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
      case "active":
        return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20";
      case "expired":
        return "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20";
      case "archived":
        return "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20";
      default:
        return "bg-[var(--surface-elevated)] text-[var(--text-muted)]";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "active":
        return <Clock className="w-3 h-3" />;
      case "expired":
        return <XCircle className="w-3 h-3" />;
      case "archived":
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
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

// Challenge Room Card
function ChallengeRoomCard({ room }: { room: any }) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventName = (event: string) => {
    const events: Record<string, string> = {
      "333": "3x3x3",
      "222": "2x2x2",
      "444": "4x4x4",
      "555": "5x5x5",
      "666": "6x6x6",
      "777": "7x7x7",
      "333bf": "3x3 Blindfolded",
      "333oh": "3x3 One-Handed",
      pyram: "Pyraminx",
      skewb: "Skewb",
      sq1: "Square-1",
      clock: "Clock",
      minx: "Megaminx",
    };
    return events[event] || event;
  };

  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={room.status} />
            {room.isPublic && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Globe className="w-3 h-3" />
                Public
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-statement truncate">
            {room.name}
          </h3>
        </div>
        <span className="text-xs px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-inter shrink-0 ml-2">
          {getEventName(room.event)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">Format</p>
          <p className="font-medium text-[var(--text-primary)] font-inter">
            {room.format.toUpperCase()}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Participants
          </p>
          <p className="font-medium text-[var(--text-primary)] font-inter">
            {room.participantCount || 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Completed
          </p>
          <p className="font-medium text-[var(--text-primary)] font-inter">
            {room.completedCount || 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] font-inter">Created</p>
          <p className="font-medium text-[var(--text-primary)] font-inter">
            {formatDate(room.createdAt)}
          </p>
        </div>
      </div>

      {room.description && (
        <p className="text-xs text-[var(--text-muted)] font-inter mt-3 line-clamp-2">
          {room.description}
        </p>
      )}
    </div>
  );
}

export default function AdminChallenges() {
  const rooms = useQuery(api.admin.getChallengeRoomStats, { limit: 50 });

  // Calculate stats
  const stats = rooms
    ? {
        total: rooms.length,
        active: rooms.filter((r) => r.status === "active").length,
        expired: rooms.filter((r) => r.status === "expired").length,
        totalParticipants: rooms.reduce(
          (sum, r) => sum + (r.participantCount || 0),
          0,
        ),
        totalCompleted: rooms.reduce(
          (sum, r) => sum + (r.completedCount || 0),
          0,
        ),
      }
    : null;

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
          Challenge Rooms
        </h1>
        <p className="mt-1 text-[var(--text-muted)] font-inter">
          View and manage challenge room statistics
        </p>
      </div>

      {/* Stats Card */}
      <div className="space-y-6">
        <CollapsibleCard
          title="Overview Statistics"
          storageKey="admin-challenges-stats-open"
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {stats === null ? (
              [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 sm:p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--surface)] rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3 w-16 bg-[var(--surface)] rounded mb-1" />
                      <div className="h-5 w-10 bg-[var(--surface)] rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <StatCard
                  title="Total Rooms"
                  value={stats.total}
                  icon={Trophy}
                  iconColor="text-purple-500"
                  iconBgColor="bg-purple-500/10"
                />
                <StatCard
                  title="Active"
                  value={stats.active}
                  icon={Clock}
                  iconColor="text-green-500"
                  iconBgColor="bg-green-500/10"
                />
                <StatCard
                  title="Expired"
                  value={stats.expired}
                  icon={XCircle}
                  iconColor="text-orange-500"
                  iconBgColor="bg-orange-500/10"
                />
                <StatCard
                  title="Total Entries"
                  value={stats.totalParticipants}
                  icon={Users}
                  iconColor="text-blue-500"
                  iconBgColor="bg-blue-500/10"
                />
                <StatCard
                  title="Completed"
                  value={stats.totalCompleted}
                  icon={CheckCircle2}
                  iconColor="text-emerald-500"
                  iconBgColor="bg-emerald-500/10"
                />
              </>
            )}
          </div>
        </CollapsibleCard>

        {/* Rooms List */}
        <CollapsibleCard
          title="Recent Rooms"
          storageKey="admin-challenges-rooms-open"
          defaultOpen={true}
        >
          {rooms === undefined ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-16 bg-[var(--surface)] rounded-full" />
                    <div className="h-5 w-12 bg-[var(--surface)] rounded-full" />
                  </div>
                  <div className="h-4 w-48 bg-[var(--surface)] rounded mb-3" />
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j}>
                        <div className="h-3 w-12 bg-[var(--surface)] rounded mb-1" />
                        <div className="h-4 w-8 bg-[var(--surface)] rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-8 text-center">
              <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] font-inter">
                No challenge rooms yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
              {rooms.map((room) => (
                <ChallengeRoomCard key={room._id} room={room} />
              ))}
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
