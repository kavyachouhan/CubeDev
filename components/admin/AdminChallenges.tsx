"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Trophy,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  Lock,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  BarChart3,
  Download,
  Search,
  X,
  Send,
  Bell,
  Target,
  Timer,
  Activity,
  Percent,
  Crown,
  Medal,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { AdminStatCard } from "./AdminStatCard";
import { AdminCollapsibleCard } from "./AdminCollapsibleCard";
import { useEffectiveTheme, useThemeColors } from "@/lib/hooks/useThemeColors";
import type { LucideIcon } from "lucide-react";
import { AdminSelect } from "./AdminDropdown";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Event names mapping
const EVENT_NAMES: Record<string, string> = {
  "333": "3x3x3",
  "222": "2x2x2",
  "444": "4x4x4",
  "555": "5x5x5",
  "666": "6x6x6",
  "777": "7x7x7",
  "333bf": "3x3 BLD",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  clock: "Clock",
  minx: "Megaminx",
};

// Format time in mm:ss.xx format
function formatTime(ms: number): string {
  if (!ms || !isFinite(ms)) return "-";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
}

// Format date
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Export helper function
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value ?? "");
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "bg-(--success)/10 text-(--success) border-(--success)/20";
      case "expired":
        return "bg-(--warning)/10 text-(--warning) border-(--warning)/20";
      case "archived":
        return "bg-(--text-muted)/10 text-(--text-muted) border-(--text-muted)/20";
      default:
        return "bg-(--surface-elevated) text-(--text-muted)";
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
      <span className="hidden xs:inline">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </span>
  );
}

// Challenge Room Card
function ChallengeRoomCard({
  room,
  onClick,
}: {
  room: any;
  onClick?: () => void;
}) {
  const now = Date.now();
  const isExpired = room.expiresAt < now || room.status === "expired";
  const participantCount = room.participantCount || 0;
  const completedCount = room.completedCount || 0;
  const completionRate =
    participantCount > 0
      ? Math.round((completedCount / participantCount) * 100)
      : 0;

  return (
    <div
      className="bg-(--surface-elevated) border border-(--border) rounded-(--radius-card) p-3 sm:p-4 hover:border-(--border-hover) transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <StatusBadge status={isExpired ? "expired" : room.status} />
            {room.isPublic ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-(--text-muted)">
                <Globe className="w-3 h-3" />
                <span className="hidden xs:inline">Public</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-(--text-muted)">
                <Lock className="w-3 h-3" />
                <span className="hidden xs:inline">Private</span>
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-(--text-primary) font-statement truncate">
            {room.name}
          </h3>
          {room.creatorName && (
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter truncate">
              by {room.creatorName}{" "}
              {room.creatorWcaId && (
                <span className="text-(--primary)">({room.creatorWcaId})</span>
              )}
            </p>
          )}
        </div>
        <span className="text-[10px] sm:text-xs px-2 py-1 bg-(--primary)/10 text-(--primary) rounded-full font-inter shrink-0 ml-2">
          {EVENT_NAMES[room.event] || room.event}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
        <div>
          <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
            Format
          </p>
          <p className="font-medium text-(--text-primary) font-inter text-xs sm:text-sm">
            {room.format.toUpperCase()}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
            Participants
          </p>
          <p className="font-medium text-(--text-primary) font-inter text-xs sm:text-sm">
            {participantCount}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
            Completed
          </p>
          <p className="font-medium text-(--text-primary) font-inter text-xs sm:text-sm">
            {completedCount}{" "}
            <span className="text-(--text-muted)">({completionRate}%)</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
            Created
          </p>
          <p className="font-medium text-(--text-primary) font-inter text-xs sm:text-sm">
            {formatDate(room.createdAt)}
          </p>
        </div>
      </div>

      {(room.avgTime || room.bestTime) && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-(--border) grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {room.bestTime && (
            <div>
              <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                Best Time
              </p>
              <p className="font-medium text-(--success) font-inter text-xs sm:text-sm">
                {formatTime(room.bestTime)}
              </p>
            </div>
          )}
          {room.avgTime && (
            <div>
              <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                Avg Time
              </p>
              <p className="font-medium text-(--text-primary) font-inter text-xs sm:text-sm">
                {formatTime(room.avgTime)}
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
              Total Solves
            </p>
            <p className="font-medium text-(--text-primary) font-inter text-xs sm:text-sm">
              {room.totalSolves || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Room Detail Modal
function RoomDetailModal({
  isOpen,
  onClose,
  room,
}: {
  isOpen: boolean;
  onClose: () => void;
  room: any;
}) {
  const participants = useQuery(
    api.adminChallenges.getRoomParticipants,
    isOpen && room ? { roomId: room._id } : "skip",
  );

  if (!isOpen || !room) return null;

  const now = Date.now();
  const isExpired = room.expiresAt < now || room.status === "expired";

  return (
    <Modal open onClose={onClose} size="2xl" mobile="fullscreen">
      <Modal.Body>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement">
              {room.name}
            </h2>
            <StatusBadge status={isExpired ? "expired" : room.status} />
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-(--radius-control) hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-(--surface-elevated) rounded-(--radius-control) p-2 sm:p-3 border border-(--border)">
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
              Event
            </p>
            <p className="font-medium text-(--text-primary) font-inter text-sm sm:text-base">
              {EVENT_NAMES[room.event] || room.event}
            </p>
          </div>
          <div className="bg-(--surface-elevated) rounded-(--radius-control) p-2 sm:p-3 border border-(--border)">
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
              Format
            </p>
            <p className="font-medium text-(--text-primary) font-inter text-sm sm:text-base">
              {room.format.toUpperCase()}
            </p>
          </div>
          <div className="bg-(--surface-elevated) rounded-(--radius-control) p-2 sm:p-3 border border-(--border)">
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
              Room ID
            </p>
            <p className="font-medium text-(--primary) font-mono text-sm sm:text-base">
              {room.roomId}
            </p>
          </div>
          <div className="bg-(--surface-elevated) rounded-(--radius-control) p-2 sm:p-3 border border-(--border)">
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
              Visibility
            </p>
            <p className="font-medium text-(--text-primary) font-inter flex items-center gap-1 text-sm sm:text-base">
              {room.isPublic ? (
                <>
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4" /> Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" /> Private
                </>
              )}
            </p>
          </div>
        </div>

        {room.description && (
          <div className="mb-4 sm:mb-6 p-3 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border)">
            <p className="text-xs sm:text-sm text-(--text-secondary) font-inter">
              {room.description}
            </p>
          </div>
        )}

        {/* Participants */}
        <h3 className="text-sm sm:text-base font-semibold text-(--text-primary) font-statement mb-3">
          Participants ({participants?.length || 0})
        </h3>

        {participants === undefined ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-(--surface-elevated) rounded-(--radius-control) p-3 sm:p-4 border border-(--border) animate-pulse"
              >
                <div className="h-4 w-32 bg-(--surface) rounded mb-2" />
                <div className="h-3 w-24 bg-(--surface) rounded" />
              </div>
            ))}
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-6 sm:py-8 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border)">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-(--text-muted) mx-auto mb-2" />
            <p className="text-(--text-muted) font-inter text-sm">
              No participants yet
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {participants.map((participant: any, index: number) => (
              <div
                key={participant._id}
                className="bg-(--surface-elevated) rounded-(--radius-control) p-2 sm:p-3 border border-(--border) hover:border-(--border-hover) transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {participant.finalRank && participant.finalRank <= 3 && (
                      <div className="shrink-0">
                        {participant.finalRank === 1 && (
                          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-(--warning)" />
                        )}
                        {participant.finalRank === 2 && (
                          <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-muted)" />
                        )}
                        {participant.finalRank === 3 && (
                          <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-(--warning)" />
                        )}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-(--text-primary) font-inter text-sm">
                        {participant.userName}
                        <span className="text-(--text-muted) ml-1 sm:ml-2 text-xs">
                          ({participant.userWcaId})
                        </span>
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-(--text-muted) font-inter">
                        <span>
                          {participant.solvesCompleted}/
                          {participant.totalSolves} solves
                        </span>
                        {participant.average && (
                          <span>Avg: {formatTime(participant.average)}</span>
                        )}
                        {participant.bestSingle && (
                          <span>
                            Best: {formatTime(participant.bestSingle)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-(--success)" />
                    ) : (
                      <Clock className="w-4 h-4 text-(--warning)" />
                    )}
                    {participant.finalRank && (
                      <span className="text-xs font-bold text-(--primary)">
                        #{participant.finalRank}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 sm:mt-6 pt-4 border-t border-(--border) flex justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// Send Challenge Notification Modal
function SendChallengeNotificationModal({
  isOpen,
  onClose,
  users,
}: {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}) {
  const [notificationType, setNotificationType] = useState<
    "single" | "challenge-users" | "broadcast"
  >("challenge-users");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/cube-lab/challenge");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const sendCustomNotification = useAction(
    api.adminNotifications.sendCustomNotification,
  );
  const sendBroadcastNotification = useAction(
    api.adminNotifications.sendBroadcastNotification,
  );

  const filteredUsers =
    users?.filter(
      (u: any) =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.wcaId?.toLowerCase().includes(userSearch.toLowerCase()),
    ) || [];

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    if (notificationType === "single" && !selectedUserId) return;

    setIsSending(true);
    setResult(null);

    try {
      if (
        notificationType === "broadcast" ||
        notificationType === "challenge-users"
      ) {
        const res = await sendBroadcastNotification({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
        });
        setResult({
          success: res.success,
          message: `Sent to ${res.sentCount}/${res.totalUsers} users`,
        });
      } else {
        const res = await sendCustomNotification({
          userId: selectedUserId as Id<"users">,
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
        });
        setResult({
          success: res.success,
          message: res.success
            ? `Sent to ${res.sent}/${res.total} devices`
            : res.message || "Failed to send",
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setBody("");
    setUrl("/cube-lab/challenge");
    setSelectedUserId("");
    setUserSearch("");
    setResult(null);
    onClose();
  };

  // Preset notifications for quick sending
  const presets = [
    {
      name: "New Challenge",
      title: "New Challenge Room Available!",
      body: "A new challenge room has been created. Join now and compete with other cubers!",
    },
    {
      name: "Competition Ending",
      title: "Challenge Ending Soon",
      body: "Your active challenge room is about to expire. Complete your solves before it's too late!",
    },
    {
      name: "Weekly Challenge",
      title: "Weekly Challenge is Live",
      body: "This week's challenge is now available. Can you beat the competition?",
    },
  ];

  if (!isOpen) return null;

  return (
    <Modal open onClose={onClose} size="lg" mobile="fullscreen">
      <Modal.Body>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement">
            Send Challenge Notification
          </h2>
          <button
            onClick={handleClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-(--radius-control) hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Notification Type Selection */}
          <div>
            <label className="type-label block mb-2">Send To</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setNotificationType("single")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-(--radius-control) font-inter text-sm transition-colors ${
                  notificationType === "single"
                    ? "bg-(--primary) text-(--on-primary)"
                    : "bg-(--surface-elevated) text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                Single User
              </button>
              <button
                onClick={() => setNotificationType("challenge-users")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-(--radius-control) font-inter text-sm transition-colors ${
                  notificationType === "challenge-users"
                    ? "bg-(--primary) text-(--on-primary)"
                    : "bg-(--surface-elevated) text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                Challenge Users
              </button>
              <button
                onClick={() => setNotificationType("broadcast")}
                className={`flex-1 min-w-[100px] px-3 py-2 rounded-(--radius-control) font-inter text-sm transition-colors ${
                  notificationType === "broadcast"
                    ? "bg-(--primary) text-(--on-primary)"
                    : "bg-(--surface-elevated) text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                All Users
              </button>
            </div>
          </div>

          {/* User Selection (for single user) */}
          {notificationType === "single" && (
            <div>
              <label className="type-label block mb-2">Select User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search challenge participants..."
                  className="w-full pl-10 pr-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-(--radius-control) text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter text-sm"
                />
              </div>
              {userSearch && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-(--surface-elevated) border border-(--border) rounded-(--radius-control)">
                  {filteredUsers.slice(0, 10).map((user: any) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        setSelectedUserId(user._id);
                        setUserSearch("");
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-(--surface) transition-colors text-sm font-inter"
                    >
                      <span className="text-(--text-primary)">{user.name}</span>
                      <span className="text-(--text-muted) ml-2">
                        ({user.wcaId}) - {user.participationCount} rooms
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedUserId && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-(--primary)/10 rounded-(--radius-control)">
                  <span className="text-sm text-(--text-primary) font-inter flex-1">
                    {users.find((u: any) => u._id === selectedUserId)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedUserId("")}
                    className="text-(--text-muted) hover:text-(--error)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="type-label block mb-2">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setTitle(preset.title);
                    setBody(preset.body);
                  }}
                  className="px-3 py-1.5 text-xs bg-(--surface-elevated) text-(--text-secondary) rounded-full hover:bg-(--surface) hover:text-(--text-primary) transition-colors font-inter"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="type-label block mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              maxLength={100}
            />
          </div>

          {/* Body */}
          <div>
            <label className="type-label block mb-2">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message..."
              rows={3}
              maxLength={300}
            />
          </div>

          {/* URL */}
          <div>
            <label className="type-label block mb-2">Link URL (optional)</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/cube-lab/challenge"
            />
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`p-3 rounded-(--radius-control) text-sm font-inter ${
                result.success
                  ? "bg-(--success)/10 text-(--success) border border-(--success)/20"
                  : "bg-(--error)/10 text-(--error) border border-(--error)/20"
              }`}
            >
              {result.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 btn-secondary text-sm"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={
                isSending ||
                !title.trim() ||
                !body.trim() ||
                (notificationType === "single" && !selectedUserId)
              }
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSending ? (
                <>
                  <Spinner size="sm" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

// Leaderboard Item Component
function LeaderboardItem({
  rank,
  name,
  wcaId,
  value,
  valueLabel,
  secondaryValue,
}: {
  rank: number;
  name: string;
  wcaId: string;
  value: number;
  valueLabel: string;
  secondaryValue?: string;
}) {
  const getRankIcon = () => {
    if (rank === 1)
      return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-(--warning)" />;
    if (rank === 2)
      return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-muted)" />;
    if (rank === 3)
      return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-(--warning)" />;
    return (
      <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold text-(--text-muted)">
        {rank}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border) hover:border-(--border-hover) transition-colors">
      <div className="shrink-0">{getRankIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-(--text-primary) font-inter text-sm truncate">
          {name}
        </p>
        <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
          {wcaId}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-(--primary) font-statement text-sm sm:text-base">
          {value}
        </p>
        <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
          {valueLabel}
        </p>
        {secondaryValue && (
          <p className="text-[10px] text-(--success) font-inter">
            {secondaryValue}
          </p>
        )}
      </div>
    </div>
  );
}

// Main Admin Challenges Component
export default function AdminChallengesNew() {
  const theme = useEffectiveTheme();
  const primaryColor = useThemeColors()["--primary"];

  // State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Data Fetching
  const {
    data: analytics,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useCachedQuery(
    api.adminChallenges.getComprehensiveAnalytics,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.challengeAnalytics,
      ttl: ADMIN_CACHE_TTLS.challenges,
    },
  );
  const rooms = useQuery(api.adminChallenges.getDetailedRooms, {
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
    event: eventFilter !== "all" ? eventFilter : undefined,
  });
  const { data: challengeUsers } = useCachedQuery(
    api.adminChallenges.getChallengeUsers,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.challengeUsers,
      ttl: ADMIN_CACHE_TTLS.challenges,
    },
  );

  // Derived Data
  const filteredRooms = useMemo(() => {
    if (!rooms) return [];
    if (!searchQuery) return rooms;
    const query = searchQuery.toLowerCase();
    return rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(query) ||
        room.roomId.toLowerCase().includes(query) ||
        room.creatorName?.toLowerCase().includes(query) ||
        room.creatorWcaId?.toLowerCase().includes(query),
    );
  }, [rooms, searchQuery]);

  // Unique events for filter dropdown
  const uniqueEvents = useMemo(() => {
    if (!analytics?.eventDistribution) return [];
    return analytics.eventDistribution.map((e) => e.event);
  }, [analytics]);

  // Chart data
  const eventChartData = useMemo(() => {
    if (!analytics?.eventDistribution) return null;
    const isLight = theme === "light";
    return {
      labels: analytics.eventDistribution.map(
        (e) => EVENT_NAMES[e.event] || e.event,
      ),
      datasets: [
        {
          data: analytics.eventDistribution.map((e) => e.count),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(6, 182, 212, 0.8)",
            "rgba(132, 204, 22, 0.8)",
          ],
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, theme]);

  const formatChartData = useMemo(() => {
    if (!analytics?.formatDistribution) return null;
    const isLight = theme === "light";
    return {
      labels: ["Ao5", "Ao12"],
      datasets: [
        {
          data: [
            analytics.formatDistribution.ao5,
            analytics.formatDistribution.ao12,
          ],
          backgroundColor: [primaryColor, "rgba(139, 92, 246, 0.8)"],
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, primaryColor, theme]);

  const isLight = theme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "circle" as const,
          font: { size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: isLight
          ? "rgba(255,255,255,0.95)"
          : "rgba(30,30,30,0.95)",
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
    cutout: "60%",
  };

  // Handlers
  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
    setShowRoomModal(true);
  };

  // Export functions
  const handleExportRooms = () => {
    if (!rooms) return;
    const exportData = rooms.map((r) => ({
      roomId: r.roomId,
      name: r.name,
      event: r.event,
      format: r.format,
      status: r.status,
      isPublic: r.isPublic,
      creator: r.creatorName,
      creatorWcaId: r.creatorWcaId,
      participants: r.participantCount,
      completed: r.completedCount,
      totalSolves: r.totalSolves,
      avgTime: r.avgTime ? formatTime(r.avgTime) : "",
      bestTime: r.bestTime ? formatTime(r.bestTime) : "",
      createdAt: new Date(r.createdAt).toISOString(),
      expiresAt: new Date(r.expiresAt).toISOString(),
    }));
    exportToCSV(exportData, "challenge_rooms");
  };

  const handleExportAnalytics = () => {
    if (!analytics) return;
    exportToJSON(analytics, "challenge_analytics");
  };

  return (
    <div className="min-h-full p-3 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="btn-primary flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Notify</span>
          </button>
          <button
            onClick={handleExportAnalytics}
            className="btn-secondary flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm"
            disabled={!analytics}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Export Analytics</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        {/* Overview Statistics */}
        <AdminCollapsibleCard
          title="Overview Statistics"
          storageKey="admin-challenges-stats"
          defaultOpen={true}
        >
          {!analytics ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-(--surface-elevated) rounded-(--radius-card) p-3 sm:p-4 border border-(--border) animate-pulse"
                >
                  <div className="h-3 w-16 bg-(--surface) rounded mb-2" />
                  <div className="h-6 w-12 bg-(--surface) rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              <AdminStatCard
                title="Total Rooms"
                value={analytics.totalRooms}
                icon={Trophy}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <AdminStatCard
                title="Active Rooms"
                value={analytics.activeRooms}
                icon={Clock}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
              />
              <AdminStatCard
                title="Expired Rooms"
                value={analytics.expiredRooms}
                icon={XCircle}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
              />
              <AdminStatCard
                title="Total Participants"
                value={analytics.totalParticipants}
                icon={Users}
                iconColor="text-(--info)"
                iconBgColor="bg-(--info)/10"
                subValue={`${analytics.uniqueParticipants} unique`}
              />
              <AdminStatCard
                title="Completion Rate"
                value={`${analytics.completionRate}%`}
                icon={Percent}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
                subValue={`${analytics.completedParticipants} completed`}
              />
              <AdminStatCard
                title="Total Solves"
                value={analytics.totalSolves}
                icon={Timer}
                iconColor="text-(--primary)"
                iconBgColor="bg-(--primary)/10"
              />
              <AdminStatCard
                title="Avg Solve Time"
                value={formatTime(analytics.avgSolveTime)}
                icon={Activity}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <AdminStatCard
                title="Best Solve"
                value={formatTime(analytics.bestSolveTime)}
                icon={Zap}
                iconColor="text-(--warning)"
                iconBgColor="bg-(--warning)/10"
              />
              <AdminStatCard
                title="Avg Per Room"
                value={analytics.avgParticipants}
                icon={Target}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
                subValue="participants"
              />
              <AdminStatCard
                title="Empty Rooms"
                value={analytics.emptyRooms}
                icon={AlertCircle}
                iconColor="text-(--error)"
                iconBgColor="bg-(--error)/10"
              />
            </div>
          )}
        </AdminCollapsibleCard>

        {/* Weekly Activity */}
        {analytics?.weeklyActivity && (
          <AdminCollapsibleCard
            title="Weekly Activity"
            storageKey="admin-challenges-weekly"
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4">
              <AdminStatCard
                title="Rooms Created"
                value={analytics.weeklyActivity.rooms}
                icon={Trophy}
                iconColor="text-(--primary)"
                iconBgColor="bg-(--primary)/10"
                subValue="Last 7 days"
              />
              <AdminStatCard
                title="Participants"
                value={analytics.weeklyActivity.participants}
                icon={Users}
                iconColor="text-(--primary)"
                iconBgColor="bg-(--primary)/10"
                subValue="Last 7 days"
              />
              <AdminStatCard
                title="Solves"
                value={analytics.weeklyActivity.solves}
                icon={Timer}
                iconColor="text-(--primary)"
                iconBgColor="bg-(--primary)/10"
                subValue="Last 7 days"
              />
            </div>
          </AdminCollapsibleCard>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Event Distribution */}
          <AdminCollapsibleCard
            title="Event Distribution"
            storageKey="admin-challenges-event-dist"
            defaultOpen={true}
          >
            <div className="h-56 sm:h-64">
              {!analytics ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-32 h-32 rounded-full bg-(--surface) animate-pulse" />
                </div>
              ) : eventChartData &&
                analytics.eventDistribution &&
                analytics.eventDistribution.length > 0 ? (
                <Doughnut data={eventChartData} options={chartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-(--text-muted)">
                  <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-50" />
                  <p className="text-sm font-inter">No event data available</p>
                </div>
              )}
            </div>
          </AdminCollapsibleCard>

          {/* Format Distribution */}
          <AdminCollapsibleCard
            title="Format Distribution"
            storageKey="admin-challenges-format-dist"
            defaultOpen={true}
          >
            <div className="h-56 sm:h-64">
              {!analytics ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-32 h-32 rounded-full bg-(--surface) animate-pulse" />
                </div>
              ) : formatChartData &&
                analytics.formatDistribution &&
                (analytics.formatDistribution.ao5 > 0 ||
                  analytics.formatDistribution.ao12 > 0) ? (
                <Doughnut data={formatChartData} options={chartOptions} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-(--text-muted)">
                  <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-50" />
                  <p className="text-sm font-inter">No format data available</p>
                </div>
              )}
            </div>
          </AdminCollapsibleCard>
        </div>

        {/* Leaderboards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Creators */}
          <AdminCollapsibleCard
            title="Top Room Creators"
            storageKey="admin-challenges-top-creators"
            defaultOpen={true}
          >
            {!analytics ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-(--surface-elevated) rounded-(--radius-control) animate-pulse"
                  />
                ))}
              </div>
            ) : analytics.topCreators.length === 0 ? (
              <p className="text-(--text-muted) text-center py-8 font-inter">
                No creators yet
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.topCreators.map((creator, index) => (
                  <LeaderboardItem
                    key={creator.userId}
                    rank={index + 1}
                    name={creator.name}
                    wcaId={creator.wcaId}
                    value={creator.roomCount}
                    valueLabel="rooms"
                  />
                ))}
              </div>
            )}
          </AdminCollapsibleCard>

          {/* Top Participants */}
          <AdminCollapsibleCard
            title="Most Active Participants"
            storageKey="admin-challenges-top-participants"
            defaultOpen={true}
          >
            {!analytics ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-(--surface-elevated) rounded-(--radius-control) animate-pulse"
                  />
                ))}
              </div>
            ) : analytics.topParticipants.length === 0 ? (
              <p className="text-(--text-muted) text-center py-8 font-inter">
                No participants yet
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.topParticipants.map((participant, index) => (
                  <LeaderboardItem
                    key={participant.userId}
                    rank={index + 1}
                    name={participant.name}
                    wcaId={participant.wcaId}
                    value={participant.participationCount}
                    valueLabel="rooms joined"
                    secondaryValue={
                      participant.wins > 0
                        ? `${participant.wins} win${participant.wins > 1 ? "s" : ""}`
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </AdminCollapsibleCard>
        </div>

        {/* Rooms List */}
        <AdminCollapsibleCard
          title="Challenge Rooms"
          storageKey="admin-challenges-rooms"
          defaultOpen={true}
          headerExtra={
            <button
              onClick={handleExportRooms}
              className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
              title="Export Rooms"
              disabled={!rooms}
            >
              <Download className="w-4 h-4" />
            </button>
          }
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms..."
                className="w-full pl-10 pr-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-(--radius-control) text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter text-sm"
              />
            </div>

            {/* Status Filter */}
            <AdminSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "expired", label: "Expired" },
                { value: "archived", label: "Archived" },
              ]}
              compact
            />

            {/* Event Filter */}
            <AdminSelect
              value={eventFilter}
              onChange={(val) => setEventFilter(val)}
              options={[
                { value: "all", label: "All Events" },
                ...uniqueEvents.map((event) => ({
                  value: event,
                  label: EVENT_NAMES[event] || event,
                })),
              ]}
              compact
            />
          </div>

          {/* Rooms Grid */}
          {rooms === undefined ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-(--surface-elevated) border border-(--border) rounded-(--radius-card) p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-16 bg-(--surface) rounded-full" />
                    <div className="h-5 w-12 bg-(--surface) rounded-full" />
                  </div>
                  <div className="h-4 w-48 bg-(--surface) rounded mb-3" />
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j}>
                        <div className="h-3 w-12 bg-(--surface) rounded mb-1" />
                        <div className="h-4 w-8 bg-(--surface) rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-(--surface-elevated) border border-(--border) rounded-(--radius-card) p-8 text-center">
              <Trophy className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
              <p className="text-(--text-muted) font-inter">
                {searchQuery || statusFilter !== "all" || eventFilter !== "all"
                  ? "No rooms match your filters"
                  : "No challenge rooms yet"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-(--text-muted) mb-3 font-inter">
                Showing {filteredRooms.length} room
                {filteredRooms.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredRooms.map((room) => (
                  <ChallengeRoomCard
                    key={room._id}
                    room={room}
                    onClick={() => handleRoomClick(room)}
                  />
                ))}
              </div>
            </>
          )}
        </AdminCollapsibleCard>
      </div>

      {/* Modals */}
      <RoomDetailModal
        isOpen={showRoomModal}
        onClose={() => {
          setShowRoomModal(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
      />

      <SendChallengeNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        users={challengeUsers || []}
      />
    </div>
  );
}
