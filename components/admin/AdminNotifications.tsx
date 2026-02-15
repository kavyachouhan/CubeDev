"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  Download,
  Search,
  X,
  CheckCircle,
  Percent,
  Activity,
  Smartphone,
  Monitor,
  Globe,
} from "lucide-react";

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

// Hook to detect current theme
function useEffectiveTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const checkTheme = () => {
      const dataTheme = document.documentElement.getAttribute("data-theme");
      setTheme((dataTheme as "light" | "dark") || "dark");
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

// Hook to get computed primary color for charts
function usePrimaryColor() {
  const [primaryColor, setPrimaryColor] = useState("rgba(59, 130, 246, 1)");

  useEffect(() => {
    const getColor = () => {
      if (typeof window === "undefined") return;
      const computed = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (computed) {
        setPrimaryColor(computed);
      }
    };

    getColor();

    const observer = new MutationObserver(getColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-color-scheme"],
    });

    return () => observer.disconnect();
  }, []);

  return primaryColor;
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

// CollapsibleCard Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
  headerExtra,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  headerExtra?: React.ReactNode;
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
          <h3 className="text-base sm:text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
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
            className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
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
  iconColor = "text-(--primary)",
  iconBgColor = "bg-(--primary)/10",
  subValue,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  subValue?: string;
}) {
  return (
    <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-(--text-muted) uppercase tracking-wide font-inter truncate">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement mt-0.5">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter mt-0.5 truncate">
              {subValue}
            </p>
          )}
        </div>
        <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconColor}`} />
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
        return "bg-(--warning)/10 text-(--warning) border-(--warning)/20";
      case "sent":
        return "bg-(--success)/10 text-(--success) border-(--success)/20";
      case "failed":
        return "bg-(--error)/10 text-(--error) border-(--error)/20";
      case "clicked":
        return "bg-(--primary)/10 text-(--primary) border-(--primary)/20";
      default:
        return "bg-(--surface-elevated) text-(--text-muted)";
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
      <span className="hidden xs:inline">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
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
    <div className="bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border border-(--border) hover:border-(--border-hover) transition-colors">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <StatusBadge status={log.status} />
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-(--surface) text-(--text-muted) rounded-full font-inter">
              {log.type.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-(--text-muted) font-inter shrink-0">
            {formatDate(log.sentAt)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary) font-statement line-clamp-1">
            {log.title}
          </h3>
          <p className="text-xs text-(--text-secondary) font-inter line-clamp-2 mt-0.5">
            {log.body}
          </p>
        </div>
        {log.error && (
          <p className="text-xs text-(--error) font-inter p-2 bg-(--error)/5 rounded line-clamp-2">
            {log.error}
          </p>
        )}
      </div>
    </div>
  );
}

// Send Notification Modal
function SendNotificationModal({
  isOpen,
  onClose,
  users,
}: {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}) {
  const [notificationType, setNotificationType] = useState<
    "single" | "broadcast"
  >("single");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
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
      if (notificationType === "broadcast") {
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
    setUrl("");
    setSelectedUserId("");
    setUserSearch("");
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement">
            Send Notification
          </h2>
          <button
            onClick={handleClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Notification Type Selection */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Send To
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setNotificationType("single")}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                  notificationType === "single"
                    ? "bg-(--primary) text-white"
                    : "bg-(--surface-elevated) text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                Single User
              </button>
              <button
                onClick={() => setNotificationType("broadcast")}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-inter text-sm transition-colors ${
                  notificationType === "broadcast"
                    ? "bg-(--primary) text-white"
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
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Select User
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or WCA ID..."
                  className="w-full pl-10 pr-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter text-sm"
                />
              </div>
              {userSearch && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-(--surface-elevated) border border-(--border) rounded-lg">
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
                        ({user.wcaId})
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedUserId && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-(--primary)/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-(--primary)" />
                  <span className="text-sm font-inter text-(--text-primary)">
                    {users?.find((u: any) => u._id === selectedUserId)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedUserId("")}
                    className="ml-auto text-(--text-muted) hover:text-(--error)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Broadcast Warning */}
          {notificationType === "broadcast" && (
            <div className="p-3 bg-(--warning)/10 border border-(--warning)/20 rounded-lg">
              <p className="text-sm text-(--warning) font-inter">
                This will send to all users with push notifications enabled.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              className="w-full px-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter text-sm"
              maxLength={100}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message..."
              rows={3}
              className="w-full px-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter text-sm"
              maxLength={300}
            />
          </div>

          {/* URL (optional) */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Link URL <span className="text-(--text-muted)">(optional)</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/cube-lab/timer"
              className="w-full px-4 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter text-sm"
            />
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-3 rounded-lg ${
                result.success
                  ? "bg-(--success)/10 border border-(--success)/20"
                  : "bg-(--error)/10 border border-(--error)/20"
              }`}
            >
              <p
                className={`text-sm font-inter ${
                  result.success ? "text-(--success)" : "text-(--error)"
                }`}
              >
                {result.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
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
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSendModal, setShowSendModal] = useState(false);

  const effectiveTheme = useEffectiveTheme();
  const primaryColor = usePrimaryColor();
  const isLight = effectiveTheme === "light";
  const textColor = isLight
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";

  // Queries
  const analytics = useQuery(api.adminNotifications.getNotificationAnalytics);
  const logs = useQuery(api.adminNotifications.getNotificationLogs, {
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    searchQuery: searchQuery.trim() || undefined,
  });
  const notificationTypes = useQuery(
    api.adminNotifications.getNotificationTypes,
  );
  const users = useQuery(api.admin.getAllUsersAdmin, { limit: 1000 });

  // 7-Day Trend Bar Chart Data
  const trendChartData = useMemo(() => {
    if (!analytics?.dailyTrend) return null;

    return {
      labels: analytics.dailyTrend.map((d) => {
        // Extract just the day abbreviation (e.g., "Sat", "Sun")
        const parts = d.date.split(",");
        return parts[0] || d.date;
      }),
      datasets: [
        {
          label: "Sent",
          data: analytics.dailyTrend.map((d) => d.sent),
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Failed",
          data: analytics.dailyTrend.map((d) => d.failed),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analytics]);

  const trendChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          align: "end" as const,
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: "circle" as const,
            padding: 12,
            font: { size: 10 },
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
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 10 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 } },
          beginAtZero: true,
        },
      },
    }),
    [isLight, textColor, gridColor],
  );

  // Notification Types Doughnut Chart Data
  const typesChartData = useMemo(() => {
    if (!analytics?.typeDistribution) return null;

    const entries = Object.entries(analytics.typeDistribution);
    if (entries.length === 0) return null;

    const colors = [
      "rgba(59, 130, 246, 0.8)", // blue
      "rgba(168, 85, 247, 0.8)", // purple
      "rgba(34, 197, 94, 0.8)", // green
      "rgba(249, 115, 22, 0.8)", // orange
      "rgba(236, 72, 153, 0.8)", // pink
      "rgba(14, 165, 233, 0.8)", // cyan
      "rgba(234, 179, 8, 0.8)", // yellow
      "rgba(107, 114, 128, 0.8)", // gray
    ];

    return {
      labels: entries.map(([type]) => type.replace(/_/g, " ")),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map((_, i) => colors[i % colors.length]),
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, isLight]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right" as const,
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: "circle" as const,
            padding: 8,
            font: { size: 10 },
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
    }),
    [isLight, textColor, gridColor],
  );

  // Device Distribution Doughnut Chart Data
  const deviceChartData = useMemo(() => {
    if (!analytics?.subscriptions?.byDevice) return null;

    const entries = Object.entries(analytics.subscriptions.byDevice);
    if (entries.length === 0) return null;

    const colors: Record<string, string> = {
      Chrome: "rgba(59, 130, 246, 0.8)",
      Firefox: "rgba(249, 115, 22, 0.8)",
      Safari: "rgba(14, 165, 233, 0.8)",
      Edge: "rgba(34, 197, 94, 0.8)",
      Mobile: "rgba(168, 85, 247, 0.8)",
      Other: "rgba(107, 114, 128, 0.8)",
      Unknown: "rgba(75, 85, 99, 0.8)",
    };

    return {
      labels: entries.map(([device]) => device),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map(
            ([device]) => colors[device] || "rgba(107, 114, 128, 0.8)",
          ),
          borderColor: isLight ? "rgba(255,255,255,1)" : "rgba(30,30,30,1)",
          borderWidth: 2,
        },
      ],
    };
  }, [analytics, isLight]);

  const handleExportLogs = () => {
    if (!logs) return;
    const exportData = logs.map((log) => ({
      status: log.status,
      type: log.type,
      title: log.title,
      body: log.body,
      sentAt: new Date(log.sentAt).toISOString(),
      error: log.error || "",
    }));
    exportToCSV(exportData, "notification_logs");
  };

  return (
    <div className="min-h-full p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header with Send Button */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => setShowSendModal(true)}
          className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Send Notification</span>
        </button>
      </div>

      {/* Analytics Overview */}
      <CollapsibleCard
        title="Analytics Overview"
        storageKey="admin-notifications-analytics-open"
        defaultOpen={true}
        headerExtra={
          analytics && (
            <span className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
              {analytics.uniqueUsers} users reached
            </span>
          )
        }
      >
        {analytics ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Stats - 2x3 grid on mobile, 6 columns on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <StatCard
                title="Total Sent"
                value={analytics.summary.total}
                icon={Bell}
                iconColor="text-(--primary)"
                iconBgColor="bg-(--primary)/10"
              />
              <StatCard
                title="Delivered"
                value={analytics.summary.sent}
                icon={CheckCircle}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
              />
              <StatCard
                title="Failed"
                value={analytics.summary.failed}
                icon={XCircle}
                iconColor="text-(--error)"
                iconBgColor="bg-(--error)/10"
              />
              <StatCard
                title="Clicked"
                value={analytics.summary.clicked}
                icon={MousePointer}
                iconColor="text-(--accent)"
                iconBgColor="bg-(--accent)/10"
              />
              <StatCard
                title="Delivery Rate"
                value={`${analytics.summary.deliveryRate}%`}
                icon={Percent}
                iconColor="text-(--success)"
                iconBgColor="bg-(--success)/10"
              />
              <StatCard
                title="Click Rate"
                value={`${analytics.summary.clickThroughRate}%`}
                icon={Activity}
                iconColor="text-(--info)"
                iconBgColor="bg-(--info)/10"
              />
            </div>

            {/* Charts Row - Stack on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* 7-Day Trend Bar Chart */}
              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <h4 className="text-sm font-medium text-(--text-primary) font-statement mb-3">
                  7-Day Trend
                </h4>
                <div className="h-40 sm:h-48">
                  {trendChartData ? (
                    <Bar data={trendChartData} options={trendChartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-(--text-muted) text-sm">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Subscriptions Stats */}
              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <h4 className="text-sm font-medium text-(--text-primary) font-statement mb-3">
                  Subscriptions
                </h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="text-center p-2 bg-(--surface) rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement">
                      {analytics.subscriptions.total}
                    </div>
                    <div className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                      Total
                    </div>
                  </div>
                  <div className="text-center p-2 bg-(--success)/10 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-(--success) font-statement">
                      {analytics.subscriptions.active}
                    </div>
                    <div className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                      Active
                    </div>
                  </div>
                  <div className="text-center p-2 bg-(--error)/10 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-(--error) font-statement">
                      {analytics.subscriptions.inactive}
                    </div>
                    <div className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                      Inactive
                    </div>
                  </div>
                </div>
                {/* Device Distribution */}
                <div className="h-28 sm:h-32">
                  {deviceChartData ? (
                    <Doughnut
                      data={deviceChartData}
                      options={doughnutOptions}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-(--text-muted) text-sm">
                      No device data
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notification Types Doughnut Chart */}
            <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
              <h4 className="text-sm font-medium text-(--text-primary) font-statement mb-3">
                Notification Types
              </h4>
              <div className="h-40 sm:h-48">
                {typesChartData ? (
                  <Doughnut data={typesChartData} options={doughnutOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-(--text-muted) text-sm">
                    No type data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Errors */}
            {analytics.recentErrors.length > 0 && (
              <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
                <h4 className="text-sm font-medium text-(--text-primary) font-statement mb-3">
                  Recent Errors
                </h4>
                <div className="space-y-2 max-h-28 sm:max-h-32 overflow-y-auto">
                  {analytics.recentErrors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 bg-(--error)/5 rounded text-(--error) font-inter"
                    >
                      <span className="font-medium">{err.type}:</span>{" "}
                      {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border) animate-pulse"
              >
                <div className="h-3 w-12 sm:w-16 bg-(--surface) rounded mb-2" />
                <div className="h-5 sm:h-6 w-8 sm:w-12 bg-(--surface) rounded" />
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>

      {/* Filters */}
      <div className="timer-card mt-4 sm:mt-6">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0 sm:min-w-50 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter text-sm"
            />
          </div>

          {/* Filter Row on Mobile */}
          <div className="flex gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter text-sm min-w-25"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="clicked">Clicked</option>
              <option value="pending">Pending</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter text-sm min-w-25"
            >
              <option value="all">All Types</option>
              {notificationTypes?.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportLogs}
              disabled={!logs || logs.length === 0}
              className="px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-hover) transition-colors font-inter text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Logs */}
      <div className="mt-4 sm:mt-6">
        <CollapsibleCard
          title="Notification Logs"
          storageKey="admin-notifications-logs-open"
          defaultOpen={true}
          headerExtra={
            logs && (
              <span className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                {logs.length} results
              </span>
            )
          }
        >
          {logs === undefined ? (
            <div className="space-y-2 sm:space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-(--surface-elevated) rounded-lg p-3 sm:p-4 border border-(--border) animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-14 sm:w-16 bg-(--surface) rounded-full" />
                    <div className="h-5 w-16 sm:w-20 bg-(--surface) rounded-full" />
                  </div>
                  <div className="h-4 w-32 sm:w-48 bg-(--surface) rounded mb-1" />
                  <div className="h-3 w-48 sm:w-64 bg-(--surface) rounded" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-(--text-muted) mx-auto mb-3" />
              <p className="text-(--text-muted) font-inter text-sm">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "No notifications match your filters"
                  : "No notification logs yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {logs.map((log) => (
                <NotificationLogItem key={log._id} log={log} />
              ))}
            </div>
          )}
        </CollapsibleCard>
      </div>

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        users={users || []}
      />
    </div>
  );
}