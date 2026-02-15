"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  Mail,
  Calendar,
  User,
  ExternalLink,
  Reply,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Users,
  Search,
  Send,
  Percent,
  Inbox,
  Filter,
  RefreshCw,
  FileText,
} from "lucide-react";
import Image from "next/image";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Theme detection hook
function useEffectiveTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;
      const dataTheme = root.getAttribute("data-theme");
      setTheme(dataTheme === "light" ? "light" : "dark");
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

// Primary color hook
function usePrimaryColor() {
  const [primaryColor, setPrimaryColor] = useState("#FA6900");

  useEffect(() => {
    const updateColor = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (color) setPrimaryColor(color);
    };

    updateColor();
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  return primaryColor;
}

// Type definitions
interface ContactMessage {
  _id: Id<"contactMessages">;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "resolved";
  createdAt: number;
  wcaId?: string;
  userId?: Id<"users">;
  adminNotes?: string;
  isRead?: boolean;
}

interface ContactAnalytics {
  statusCounts: {
    all: number;
    new: number;
    read: number;
    replied: number;
    resolved: number;
  };
  timeBasedCounts: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
    weekly: number;
  };
  responseRate: number;
  avgResponseTimeHours: number | null;
  subjectCategories: Record<string, number>;
  userBreakdown: {
    registered: number;
    anonymous: number;
  };
  senderStats: {
    unique: number;
    repeat: number;
  };
  dailyTrend: Array<{ date: string; count: number }>;
  weeklyTrendData: Array<{ week: string; count: number }>;
  hourDistribution: Record<number, number>;
  dayOfWeekDistribution: Record<string, number>;
}

interface ContactData {
  messages: ContactMessage[];
  analytics: ContactAnalytics;
}

// Export helper functions
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

// CollapsibleCard Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
  headerExtra,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  headerExtra?: React.ReactNode;
  className?: string;
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
    <div className={`timer-card ${className}`}>
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
        <div className="flex items-center gap-2">
          {headerExtra}
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
  subValue,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  subValue?: string;
  trend?: { value: number; label: string };
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
          <div className="flex items-center gap-2">
            <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-0.5 text-xs ${
                  trend.value >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {subValue && (
            <div className="text-xs text-[var(--text-muted)] font-inter">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({
  label,
  value,
  total,
  color = "bg-[var(--primary)]",
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)] font-inter">{label}</span>
        <span className="text-[var(--text-primary)] font-medium font-inter">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Bar Chart Component using Chart.js
function BarChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
}) {
  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: "Messages",
          data: data.map((d) => d.value),
          backgroundColor: primaryColor,
          borderRadius: 4,
          barThickness: 16,
        },
      ],
    }),
    [data, primaryColor],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(0, 0, 0, 0.8)",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            font: { size: 9 },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, font: { size: 10 }, stepSize: 1 },
          grid: { color: gridColor },
          border: { display: false },
        },
      },
    }),
    [isLight, textColor, gridColor],
  );

  return (
    <div className="h-36">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

// Distribution Bar Component
function DistributionBar({
  items,
  total,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-[var(--surface)]">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`${item.color} transition-all duration-500`}
            style={{
              width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-[var(--text-secondary)] font-inter">
              {item.label}: {item.value} (
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status) {
      case "new":
        return "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20";
      case "read":
        return "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20";
      case "replied":
        return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20";
      case "resolved":
        return "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20";
      default:
        return "bg-[var(--surface-elevated)] text-[var(--text-muted)]";
    }
  };

  const getIcon = () => {
    switch (status) {
      case "new":
        return <AlertCircle className="w-3 h-3" />;
      case "read":
        return <Eye className="w-3 h-3" />;
      case "replied":
        return <Reply className="w-3 h-3" />;
      case "resolved":
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

// Reply Modal Component
function ReplyModal({
  message,
  onClose,
  onSent,
}: {
  message: {
    _id: Id<"contactMessages">;
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  onClose: () => void;
  onSent: () => void;
}) {
  const [replySubject, setReplySubject] = useState(`Re: ${message.subject}`);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordReply = useMutation(api.adminContact.recordReplySent);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Send email via API
      const response = await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: message.email,
          recipientName: message.name,
          subject: replySubject,
          message: replyMessage,
          originalSubject: message.subject,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reply");
      }

      // Record reply in database
      await recordReply({
        messageId: message._id,
        replyMessage: replyMessage,
      });

      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="timer-card max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-statement">
            Reply to Message
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Message */}
        <div className="bg-[var(--surface-elevated)] rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
            <span className="text-xs text-[var(--text-muted)] font-inter">
              Original message from:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                {message.name}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-inter truncate max-w-[150px] sm:max-w-none">
                ({message.email})
              </span>
            </div>
          </div>
          <div className="text-sm font-medium text-[var(--text-primary)] font-inter mb-2">
            {message.subject}
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-inter whitespace-pre-wrap max-h-24 sm:max-h-32 overflow-y-auto">
            {message.message}
          </p>
        </div>

        <form onSubmit={handleSend} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Subject
            </label>
            <input
              type="text"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Message
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={6}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm sm:text-base"
              placeholder="Type your reply..."
              required
            />
          </div>

          {error && (
            <div className="bg-[var(--error)]/10 text-[var(--error)] px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm font-inter">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-2.5 sm:py-3 text-sm sm:text-base"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 btn-primary py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Message Details Modal Component
function MessageDetailsModal({
  messageId,
  onClose,
  onReply,
}: {
  messageId: Id<"contactMessages">;
  onClose: () => void;
  onReply: () => void;
}) {
  const details = useQuery(api.adminContact.getMessageDetails, { messageId });
  const updateStatus = useMutation(api.adminContact.updateMessageStatus);

  const [adminNotes, setAdminNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSaveNotes = async () => {
    if (!details) return;
    await updateStatus({
      messageId,
      status: details.message.status,
      adminNotes,
    });
    setIsEditingNotes(false);
  };

  const handleStatusChange = async (
    status: "new" | "read" | "replied" | "resolved",
  ) => {
    await updateStatus({ messageId, status });
  };

  if (!details) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="timer-card max-w-2xl w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--surface-elevated)] rounded" />
            <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
            <div className="h-32 bg-[var(--surface-elevated)] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const { message, userInfo, previousMessages } = details;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="timer-card max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-statement break-words">
              {message.subject}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <StatusBadge status={message.status} />
              <span className="text-xs text-[var(--text-muted)] font-inter">
                {formatDate(message.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sender Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                {userInfo?.avatar ? (
                  <Image
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[var(--primary)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
                      {message.name}
                    </p>
                    {userInfo && (
                      <span className="px-1.5 py-0.5 text-xs bg-[var(--success)]/10 text-[var(--success)] rounded font-inter">
                        Registered
                      </span>
                    )}
                  </div>
                  <a
                    href={`mailto:${message.email}`}
                    className="text-xs text-[var(--primary)] hover:underline font-inter"
                  >
                    {message.email}
                  </a>
                </div>
              </div>
            </div>

            {message.wcaId && (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border)]">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <ExternalLink className="w-3 h-3" />
                  <span className="text-xs font-inter">WCA Profile</span>
                </div>
                <a
                  href={`https://www.worldcubeassociation.org/persons/${message.wcaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--primary)] hover:underline font-inter flex items-center gap-1"
                >
                  {message.wcaId}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div>
            <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2 font-inter uppercase tracking-wide">
              Message
            </h4>
            <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border)]">
              <p className="text-sm text-[var(--text-primary)] font-inter whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[var(--text-muted)] font-inter uppercase tracking-wide">
                Admin Notes
              </h4>
              {!isEditingNotes && (
                <button
                  onClick={() => {
                    setAdminNotes(message.adminNotes || "");
                    setIsEditingNotes(true);
                  }}
                  className="text-xs text-[var(--primary)] hover:underline font-inter"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] font-inter focus:outline-none focus:border-[var(--primary)] resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-inter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] font-inter transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-4 border border-[var(--border)] min-h-[60px]">
                <p className="text-sm text-[var(--text-primary)] font-inter whitespace-pre-wrap">
                  {message.adminNotes || (
                    <span className="text-[var(--text-muted)] italic">
                      No notes added
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Previous Messages */}
          {previousMessages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2 font-inter uppercase tracking-wide">
                Previous Messages ({previousMessages.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previousMessages.map((msg: ContactMessage) => (
                  <div
                    key={msg._id}
                    className="bg-[var(--surface-elevated)] rounded-lg p-3 border border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--text-primary)] font-inter">
                        {msg.subject}
                      </span>
                      <StatusBadge status={msg.status} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-inter">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="pt-3 sm:pt-4 border-t border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm text-[var(--text-muted)] font-inter">
                Update status:
              </span>
              <div className="flex flex-wrap gap-2">
                {(["read", "replied", "resolved"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={message.status === status}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs rounded-lg font-inter transition-colors ${
                      message.status === status
                        ? `bg-[var(--${status === "read" ? "warning" : status === "replied" ? "success" : "text-muted"})]/20 text-[var(--${status === "read" ? "warning" : status === "replied" ? "success" : "text-muted"})] cursor-not-allowed`
                        : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {status === "read" && <Eye className="w-3 h-3" />}
                    {status === "replied" && <Reply className="w-3 h-3" />}
                    {status === "resolved" && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex-1 btn-secondary text-sm sm:text-base py-2 sm:py-2.5"
              >
                Close
              </button>
              <button
                onClick={onReply}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Message Item Component
function ContactItem({
  message,
  onSelect,
}: {
  message: {
    _id: Id<"contactMessages">;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: number;
    wcaId?: string;
    userId?: Id<"users">;
    userAvatar?: string | null;
  };
  onSelect: () => void;
}) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getTimeAgo = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return formatDate(ts);
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full timer-card !p-0 overflow-hidden transition-all hover:border-[var(--primary)] text-left ${
        message.status === "new" ? "!border-[var(--info)]" : ""
      }`}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0">
          {message.userAvatar ? (
            <Image
              src={message.userAvatar}
              alt={message.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-[var(--primary)]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--primary)]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
              {message.name}
            </span>
            {message.userId && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[var(--success)]/10 text-[var(--success)] rounded font-inter">
                User
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-primary)] font-inter truncate font-medium">
            {message.subject}
          </p>
          <p className="text-xs text-[var(--text-muted)] font-inter truncate">
            {message.message.substring(0, 80)}
            {message.message.length > 80 ? "..." : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-[var(--text-muted)] font-inter">
            {getTimeAgo(message.createdAt)}
          </span>
          <StatusBadge status={message.status} />
        </div>
      </div>
    </button>
  );
}

// Main Admin Contact Component
export default function AdminContactNew() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] =
    useState<Id<"contactMessages"> | null>(null);
  const [replyMessage, setReplyMessage] = useState<{
    _id: Id<"contactMessages">;
    name: string;
    email: string;
    subject: string;
    message: string;
  } | null>(null);

  const data = useQuery(api.adminContact.getContactMessagesWithAnalytics, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  }) as ContactData | undefined;

  const updateStatus = useMutation(api.adminContact.updateMessageStatus);

  // Filter messages by search query
  const filteredMessages = data?.messages.filter((m: ContactMessage) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.subject.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    if (!data?.messages) return;
    const exportData = data.messages.map((m: ContactMessage) => ({
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message.replace(/\n/g, " "),
      status: m.status,
      wcaId: m.wcaId || "",
      createdAt: new Date(m.createdAt).toISOString(),
    }));
    exportToCSV(exportData, "contact_messages");
  };

  const handleExportJSON = () => {
    if (!data) return;
    exportToJSON(data, "contact_analytics");
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Analytics Overview */}
      <CollapsibleCard
        title="Contact Analytics"
        storageKey="admin-contact-analytics-open"
        defaultOpen={true}
        headerExtra={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportJSON}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
              title="Export JSON"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {data?.analytics ? (
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title="Total Messages"
                value={data.analytics.statusCounts.all}
                icon={Inbox}
                iconColor="text-[var(--primary)]"
                iconBgColor="bg-[var(--primary)]/10"
              />
              <StatCard
                title="New"
                value={data.analytics.statusCounts.new}
                icon={AlertCircle}
                iconColor="text-[var(--info)]"
                iconBgColor="bg-[var(--info)]/10"
              />
              <StatCard
                title="This Week"
                value={data.analytics.timeBasedCounts.lastWeek}
                icon={TrendingUp}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
                trend={
                  data.analytics.timeBasedCounts.weekly !== 0
                    ? {
                        value: data.analytics.timeBasedCounts.weekly,
                        label: "vs last week",
                      }
                    : undefined
                }
              />
              <StatCard
                title="Response Rate"
                value={`${data.analytics.responseRate}%`}
                icon={Percent}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              />
              <StatCard
                title="Unique Senders"
                value={data.analytics.senderStats.unique}
                icon={Users}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                title="Registered Users"
                value={data.analytics.userBreakdown.registered}
                icon={User}
                iconColor="text-emerald-500"
                iconBgColor="bg-emerald-500/10"
                subValue={`${data.analytics.userBreakdown.anonymous} anonymous`}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trend Chart */}
              <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4 font-statement">
                  Messages (Last 14 Days)
                </h4>
                <BarChart
                  data={data.analytics.dailyTrend.map(
                    (d: { date: string; count: number }) => ({
                      label: d.date,
                      value: d.count,
                    }),
                  )}
                />
              </div>

              {/* Subject Categories */}
              <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4 font-statement">
                  Message Categories
                </h4>
                <div className="space-y-3">
                  {(
                    Object.entries(data.analytics.subjectCategories) as Array<
                      [string, number]
                    >
                  ).map(([category, count]) => (
                    <ProgressBar
                      key={category}
                      label={category}
                      value={count}
                      total={data.analytics.statusCounts.all}
                      color={
                        category === "Bug Reports"
                          ? "bg-red-500"
                          : category === "Feature Requests"
                            ? "bg-blue-500"
                            : category === "Questions"
                              ? "bg-yellow-500"
                              : category === "Feedback"
                                ? "bg-green-500"
                                : "bg-[var(--text-muted)]"
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4 font-statement">
                Status Distribution
              </h4>
              <DistributionBar
                items={[
                  {
                    label: "New",
                    value: data.analytics.statusCounts.new,
                    color: "bg-[var(--info)]",
                  },
                  {
                    label: "Read",
                    value: data.analytics.statusCounts.read,
                    color: "bg-[var(--warning)]",
                  },
                  {
                    label: "Replied",
                    value: data.analytics.statusCounts.replied,
                    color: "bg-[var(--success)]",
                  },
                  {
                    label: "Resolved",
                    value: data.analytics.statusCounts.resolved,
                    color: "bg-[var(--text-muted)]",
                  },
                ]}
                total={data.analytics.statusCounts.all}
              />
            </div>

            {/* Day of Week Distribution */}
            <div className="bg-[var(--surface-elevated)] rounded-xl p-4 border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4 font-statement">
                Messages by Day of Week
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {(
                  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
                ).map((day) => (
                  <div
                    key={day}
                    className="text-center p-2 bg-[var(--surface)] rounded-lg"
                  >
                    <div className="text-xs text-[var(--text-muted)] font-inter mb-1">
                      {day}
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)] font-statement">
                      {data.analytics.dayOfWeekDistribution[day] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[var(--surface-elevated)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}
      </CollapsibleCard>

      {/* Status Filter Pills */}
      <CollapsibleCard
        title="Messages"
        storageKey="admin-contact-messages-open"
        defaultOpen={true}
        headerExtra={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-inter hidden sm:inline">
              {filteredMessages?.length || 0} messages
            </span>
          </div>
        }
      >
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                key: "all",
                label: "All",
                count: data?.analytics?.statusCounts.all,
              },
              {
                key: "new",
                label: "New",
                count: data?.analytics?.statusCounts.new,
              },
              {
                key: "read",
                label: "Read",
                count: data?.analytics?.statusCounts.read,
              },
              {
                key: "replied",
                label: "Replied",
                count: data?.analytics?.statusCounts.replied,
              },
              {
                key: "resolved",
                label: "Resolved",
                count: data?.analytics?.statusCounts.resolved,
              },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-1.5 text-xs rounded-lg font-inter transition-colors flex items-center gap-1.5 ${
                  statusFilter === filter.key
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                }`}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      statusFilter === filter.key
                        ? "bg-white/20"
                        : "bg-[var(--surface)]"
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] font-inter focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-2">
          {!data ? (
            // Loading state
            [...Array(5)].map((_, i) => (
              <div key={i} className="timer-card animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--surface-elevated)] rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded mb-2" />
                    <div className="h-3 w-48 bg-[var(--surface-elevated)] rounded mb-1" />
                    <div className="h-3 w-64 bg-[var(--surface-elevated)] rounded" />
                  </div>
                  <div className="h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
                </div>
              </div>
            ))
          ) : filteredMessages?.length === 0 ? (
            <div className="timer-card text-center py-12">
              <Mail className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] font-inter">
                {searchQuery
                  ? "No messages match your search"
                  : statusFilter === "all"
                    ? "No contact messages yet"
                    : `No ${statusFilter} messages`}
              </p>
            </div>
          ) : (
            filteredMessages?.map((message: ContactMessage) => (
              <ContactItem
                key={message._id}
                message={message}
                onSelect={() => {
                  setSelectedMessageId(message._id);
                  // Auto-mark as read when opened
                  if (message.status === "new") {
                    updateStatus({ messageId: message._id, status: "read" });
                  }
                }}
              />
            ))
          )}
        </div>
      </CollapsibleCard>

      {/* Message Details Modal */}
      {selectedMessageId && (
        <MessageDetailsModal
          messageId={selectedMessageId}
          onClose={() => setSelectedMessageId(null)}
          onReply={() => {
            const msg = data?.messages.find(
              (m: ContactMessage) => m._id === selectedMessageId,
            );
            if (msg) {
              setReplyMessage({
                _id: msg._id,
                name: msg.name,
                email: msg.email,
                subject: msg.subject,
                message: msg.message,
              });
            }
          }}
        />
      )}

      {/* Reply Modal */}
      {replyMessage && (
        <ReplyModal
          message={replyMessage}
          onClose={() => setReplyMessage(null)}
          onSent={() => {
            setSelectedMessageId(null);
          }}
        />
      )}
    </div>
  );
}
