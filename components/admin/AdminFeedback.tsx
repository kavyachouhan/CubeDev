"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import {
  MessageSquare,
  Star,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Calendar,
  ThumbsUp,
  User,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Users,
  Percent,
  Clock,
  FileText,
  Plus,
  X,
  Settings,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { AdminSelect } from "./AdminDropdown";

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
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
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
  trend,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subValue?: string;
  trend?: { value: number; label: string };
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
          <div className="flex items-center gap-2">
            <div className="text-sm sm:text-lg font-bold text-(--text-primary) font-statement">
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
            <div className="text-xs text-(--text-muted) font-inter">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// NPS Gauge Component
function NPSGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 50) return "var(--success)";
    if (score >= 0) return "var(--warning)";
    return "var(--error)";
  };

  const getLabel = () => {
    if (score >= 50) return "Excellent";
    if (score >= 0) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
      <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
        Net Promoter Score
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--surface)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={getColor()}
              strokeWidth="8"
              strokeDasharray={`${((score + 100) / 200) * 251.2} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm sm:text-lg font-bold text-(--text-primary) font-statement">
              {score}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-lg font-bold text-(--text-primary) font-statement truncate">
            {getLabel()}
          </p>
          <p className="text-xs text-(--text-muted) font-inter">
            Range: -100 to 100
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Rating Bar
function FeatureRatingBar({
  feature,
  rating,
}: {
  feature: string;
  rating: number;
}) {
  const formatFeatureName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-20 sm:w-32 text-xs sm:text-sm text-(--text-secondary) font-inter truncate shrink-0">
        {formatFeatureName(feature)}
      </span>
      <div className="flex-1 h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
        <div
          className="h-full bg-(--primary) rounded-full transition-all"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
      <span className="w-10 text-sm font-medium text-(--text-primary) font-inter text-right">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// Custom Response Value Renderer
function CustomResponseValue({
  value,
  label,
}: {
  value: unknown;
  label: string;
}) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return (
      <div className="text-sm text-(--text-muted) italic font-inter">
        No response
      </div>
    );
  }

  // Handle boolean
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            value ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-(--text-primary) font-inter">
          {value ? "Yes" : "No"}
        </span>
      </div>
    );
  }

  // Handle number - check if it's a rating
  if (typeof value === "number") {
    // Check if it's a 1-5 rating
    if (value <= 5 && value >= 1) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= value
                    ? "text-amber-500 fill-amber-500"
                    : "text-(--text-muted)"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-(--text-primary) font-inter">
            {value}/5
          </span>
        </div>
      );
    }
    // Check if it's a 1-10 scale
    if (value <= 10 && value >= 1) {
      return (
        <span className="text-sm font-medium text-(--text-primary) font-inter">
          {value}/10
        </span>
      );
    }
    // Regular number
    return (
      <span className="text-sm font-medium text-(--text-primary) font-inter">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    );
  }

  // Handle string
  if (typeof value === "string") {
    // Check if it looks like JSON
    if (value.startsWith("{") || value.startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        return <CustomResponseValue value={parsed} label={label} />;
      } catch {
        // If parsing fails, treat as plain string
      }
    }
    return (
      <p className="text-sm text-(--text-primary) font-inter whitespace-pre-wrap wrap-break-word">
        {value}
      </p>
    );
  }

  // Handle array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="text-sm text-(--text-muted) italic font-inter">
          Empty list
        </div>
      );
    }
    return (
      <div className="space-y-1">
        {value.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-sm text-(--text-primary) font-inter"
          >
            <span className="text-(--text-muted)">•</span>
            <span>
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Handle object
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <div className="text-sm text-(--text-muted) italic font-inter">
          Empty object
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="bg-(--surface) rounded-lg p-2.5 border border-(--border)"
          >
            <p className="text-xs text-(--text-muted) font-inter mb-1 capitalize">
              {key
                .replace(/([A-Z])/g, " $1")
                .toLowerCase()
                .trim()}
            </p>
            <CustomResponseValue value={val} label={key} />
          </div>
        ))}
      </div>
    );
  }

  // Fallback
  return (
    <span className="text-sm text-(--text-primary) font-inter">
      {String(value)}
    </span>
  );
}

// Feedback Response Item
function FeedbackItem({
  feedback,
  isExpanded,
  onToggle,
}: {
  feedback: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-(--warning) fill-(--warning)" : "text-(--text-muted)"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="timer-card !p-0 overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-(--surface-elevated) transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-xs px-1.5 sm:px-2 py-0.5 bg-(--primary)/10 text-(--primary) rounded-full font-inter truncate max-w-[80px] sm:max-w-none">
              {feedback.surveyType || "general"}
            </span>
            <span className="text-xs text-(--text-muted) font-inter hidden xs:inline">
              v{feedback.surveyVersion || "1.0"}
            </span>
          </div>
          <div className="hidden sm:block">
            {feedback.uiuxRating && renderStars(feedback.uiuxRating)}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs sm:text-sm text-(--text-muted) font-inter hidden sm:inline">
            {formatDate(feedback.createdAt)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-(--text-muted)" />
          ) : (
            <ChevronDown className="w-4 h-4 text-(--text-muted)" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-(--border) space-y-3 sm:space-y-4">
          {/* Mobile date */}
          <p className="text-xs text-(--text-muted) font-inter sm:hidden">
            {formatDate(feedback.createdAt)}
          </p>
          {/* Ratings Row */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {feedback.uiuxRating && (
              <div className="bg-(--surface-elevated) rounded-lg p-3">
                <p className="text-xs text-(--text-muted) font-inter mb-1">
                  UI/UX Rating
                </p>
                <div className="flex items-center gap-2">
                  {renderStars(feedback.uiuxRating)}
                  <span className="text-sm font-medium text-(--text-primary)">
                    {feedback.uiuxRating}/5
                  </span>
                </div>
              </div>
            )}
            {feedback.recommendScore && (
              <div className="bg-(--surface-elevated) rounded-lg p-3">
                <p className="text-xs text-(--text-muted) font-inter mb-1">
                  Recommend Score
                </p>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-(--primary)" />
                  <span className="text-sm font-medium text-(--text-primary)">
                    {feedback.recommendScore}/10
                  </span>
                </div>
              </div>
            )}
            {feedback.userId && (
              <div className="bg-(--surface-elevated) rounded-lg p-3">
                <p className="text-xs text-(--text-muted) font-inter mb-1">
                  Submitted by
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-(--primary)" />
                  <span className="text-sm font-medium text-(--text-primary) truncate">
                    {feedback.userName ?? feedback.userId}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Stars */}
          {feedback.uiuxRating && (
            <div className="sm:hidden">{renderStars(feedback.uiuxRating)}</div>
          )}

          {/* Feature Ratings */}
          {feedback.featureRatings &&
            Object.keys(feedback.featureRatings).length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-(--text-secondary) font-inter mb-2">
                  Feature Ratings
                </p>
                <div className="bg-(--surface-elevated) rounded-lg p-2 sm:p-3 space-y-2">
                  {Object.entries(feedback.featureRatings).map(
                    ([feature, rating]) => (
                      <FeatureRatingBar
                        key={feature}
                        feature={feature}
                        rating={rating as number}
                      />
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Most Useful Feature */}
          {feedback.mostUsefulFeature && (
            <div>
              <p className="text-xs sm:text-sm font-medium text-(--text-secondary) font-inter mb-1">
                Most Useful Feature
              </p>
              <p className="text-xs sm:text-sm text-(--text-primary) font-inter bg-(--surface-elevated) rounded-lg p-2.5 sm:p-3">
                {feedback.mostUsefulFeature}
              </p>
            </div>
          )}

          {/* Feature Requests */}
          {feedback.featureRequests && (
            <div>
              <p className="text-xs sm:text-sm font-medium text-(--text-secondary) font-inter mb-1">
                Feature Requests
              </p>
              <p className="text-xs sm:text-sm text-(--text-primary) font-inter bg-(--surface-elevated) rounded-lg p-2.5 sm:p-3 whitespace-pre-wrap wrap-break-word">
                {feedback.featureRequests}
              </p>
            </div>
          )}

          {/* Additional Comments */}
          {feedback.additionalComments && (
            <div>
              <p className="text-xs sm:text-sm font-medium text-(--text-secondary) font-inter mb-1">
                Additional Comments
              </p>
              <p className="text-xs sm:text-sm text-(--text-primary) font-inter bg-(--surface-elevated) rounded-lg p-2.5 sm:p-3 whitespace-pre-wrap wrap-break-word">
                {feedback.additionalComments}
              </p>
            </div>
          )}

          {/* Custom Responses */}
          {feedback.customResponses &&
            typeof feedback.customResponses === "object" &&
            Object.keys(feedback.customResponses).length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-(--text-secondary) font-inter mb-2">
                  Custom Responses
                </p>
                <div className="space-y-2.5">
                  {Object.entries(feedback.customResponses).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="bg-(--surface-elevated) rounded-lg p-2.5 sm:p-3 border border-(--border)"
                      >
                        <p className="text-xs text-(--text-muted) font-inter mb-1.5 capitalize">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/_/g, " ")
                            .trim()}
                        </p>
                        <CustomResponseValue value={value} label={key} />
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Metadata */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-(--text-muted) font-inter pt-2 border-t border-(--border) flex-wrap">
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3" />
              {formatDate(feedback.createdAt)}
            </span>
            {feedback.userAgent && (
              <span className="sm:inline">{feedback.userAgent}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Bar Chart Component for response trends using Chart.js
function ResponseBarChart({
  data,
}: {
  data: Array<{ label: string; value: number; avgRating?: number }>;
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
          label: "Responses",
          data: data.map((d) => d.value),
          backgroundColor: primaryColor,
          borderRadius: 4,
          barThickness: 20,
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
          ticks: { color: textColor, font: { size: 10 } },
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
    <div className="h-40">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

// Rating Distribution Component
function RatingDistribution({
  distribution,
  maxRating,
}: {
  distribution: Record<number, number>;
  maxRating: number;
}) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-2">
      {Array.from({ length: maxRating }, (_, i) => maxRating - i).map(
        (rating) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-xs text-(--text-muted) font-inter w-6 text-right">
              {rating}
            </span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <div className="flex-1 h-2 bg-(--surface) rounded-full overflow-hidden">
              <div
                className="h-full bg-(--primary) rounded-full transition-all duration-500"
                style={{
                  width: `${maxCount > 0 ? ((distribution[rating] || 0) / maxCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-(--text-secondary) font-inter w-8 text-right">
              {distribution[rating] || 0}
            </span>
            <span className="text-xs text-(--text-muted) font-inter w-10 text-right">
              {total > 0
                ? (((distribution[rating] || 0) / total) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        ),
      )}
    </div>
  );
}

// NPS Breakdown Component
function NPSBreakdown({
  breakdown,
}: {
  breakdown: { promoters: number; passives: number; detractors: number };
}) {
  const total = breakdown.promoters + breakdown.passives + breakdown.detractors;
  const items = [
    {
      label: "Promoters (9-10)",
      value: breakdown.promoters,
      color: "bg-green-500",
    },
    {
      label: "Passives (7-8)",
      value: breakdown.passives,
      color: "bg-amber-500",
    },
    {
      label: "Detractors (1-6)",
      value: breakdown.detractors,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-(--surface)">
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
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-lg font-bold text-(--text-primary) font-statement">
                {item.value}
              </span>
            </div>
            <span className="text-xs text-(--text-muted) font-inter">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Feedback Form Modal Component

// Available survey types
const SURVEY_TYPES = [
  { value: "general", label: "General Feedback" },
  { value: "coach", label: "Coach / Volunteer" },
  { value: "cubie", label: "Cubie AI" },
  { value: "beta", label: "Beta Testing" },
  { value: "feature", label: "Feature Specific" },
  { value: "nps", label: "NPS Survey" },
  { value: "onboarding", label: "Onboarding" },
  { value: "exit", label: "Exit Survey" },
] as const;

// Dynamic features per survey type
const FEATURES_BY_TYPE: Record<
  string,
  Array<{ key: string; label: string }>
> = {
  general: [
    { key: "timer", label: "Timer" },
    { key: "algorithmTrainer", label: "Algorithm Trainer" },
    { key: "challenges", label: "Challenge Rooms" },
    { key: "statistics", label: "Statistics" },
    { key: "competitions", label: "Competition Simulator" },
    { key: "coach", label: "Coach" },
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
};

type CustomQuestionType = "text" | "textarea" | "rating" | "scale" | "select";

interface CustomQuestion {
  id: string;
  label: string;
  type: CustomQuestionType;
  options: string;
  required: boolean;
}

const QUESTION_TYPES: Array<{ value: CustomQuestionType; label: string }> = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "rating", label: "Rating (1-5)" },
  { value: "scale", label: "Scale (1-10)" },
  { value: "select", label: "Dropdown" },
];

// Form section toggle component
function FormSectionToggle({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-inter ${
        enabled
          ? "bg-(--primary)/10 border-(--primary) text-(--primary)"
          : "bg-(--surface-elevated) border-(--border) text-(--text-muted) hover:border-(--text-muted)"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-sm border transition-all ${
          enabled
            ? "bg-(--primary) border-(--primary)"
            : "border-(--text-muted)"
        }`}
      >
        {enabled && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 6L5 8L9 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label}
    </button>
  );
}

interface FeedbackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FeedbackFormModal({ isOpen, onClose }: FeedbackFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form configuration - which sections are enabled
  const [enabledSections, setEnabledSections] = useState({
    uiuxRating: true,
    featureRatings: true,
    recommendScore: true,
    mostUsefulFeature: true,
    featureRequests: true,
    additionalComments: true,
  });

  // Form data
  const [surveyType, setSurveyType] = useState("general");
  const [customSurveyType, setCustomSurveyType] = useState("");
  const [surveyVersion, setSurveyVersion] = useState("2.0");
  const [uiuxRating, setUiuxRating] = useState(0);

  // Dynamic features based on survey type
  const activeFeatures = useMemo(() => {
    const effectiveType =
      surveyType === "__custom" ? customSurveyType : surveyType;
    return FEATURES_BY_TYPE[effectiveType] || FEATURES_BY_TYPE.general;
  }, [surveyType, customSurveyType]);

  const [featureRatings, setFeatureRatings] = useState<Record<string, number>>(
    {},
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Sync features when survey type changes
  useEffect(() => {
    const initial: Record<string, number> = {};
    activeFeatures.forEach((f) => {
      initial[f.key] = 0;
    });
    setFeatureRatings(initial);
    setSelectedFeatures(activeFeatures.map((f) => f.key));
  }, [activeFeatures]);

  // Custom feature entries (admin can add new features beyond the presets)
  const [extraFeatures, setExtraFeatures] = useState<
    Array<{ key: string; label: string }>
  >([]);

  const allFeatures = useMemo(
    () => [
      ...activeFeatures,
      ...extraFeatures.filter((f) => f.key.trim() && f.label.trim()),
    ],
    [activeFeatures, extraFeatures],
  );

  const [mostUsefulFeature, setMostUsefulFeature] = useState("");
  const [featureRequests, setFeatureRequests] = useState("");
  const [recommendScore, setRecommendScore] = useState(0);
  const [additionalComments, setAdditionalComments] = useState("");

  // Custom questions builder
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [customAnswers, setCustomAnswers] = useState<
    Record<string, string | number>
  >({});

  const submitFeedback = useMutation(api.feedbackResponses.submitFeedback);

  const toggleSection = (section: keyof typeof enabledSections) => {
    setEnabledSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFeature = (featureKey: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureKey)
        ? prev.filter((f) => f !== featureKey)
        : [...prev, featureKey],
    );
  };

  // Extra feature management
  const addExtraFeature = () => {
    setExtraFeatures((prev) => [...prev, { key: "", label: "" }]);
  };

  const removeExtraFeature = (index: number) => {
    const removed = extraFeatures[index];
    setExtraFeatures((prev) => prev.filter((_, i) => i !== index));
    if (removed?.key) {
      setSelectedFeatures((prev) => prev.filter((f) => f !== removed.key));
      setFeatureRatings((prev) => {
        const next = { ...prev };
        delete next[removed.key];
        return next;
      });
    }
  };

  const updateExtraFeature = (
    index: number,
    field: "key" | "label",
    value: string,
  ) => {
    setExtraFeatures((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        // Auto-generate key from label
        if (field === "label") {
          updated.key = value
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-zA-Z0-9]/g, "");
        }
        return updated;
      }),
    );
  };

  // Custom question management
  const addCustomQuestion = () => {
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setCustomQuestions((prev) => [
      ...prev,
      {
        id,
        label: "",
        type: "text" as CustomQuestionType,
        options: "",
        required: false,
      },
    ]);
  };

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
    setCustomAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateCustomQuestion = (
    id: string,
    updates: Partial<CustomQuestion>,
  ) => {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    );
  };

  const updateCustomAnswer = (id: string, value: string | number) => {
    setCustomAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setSurveyType("general");
    setCustomSurveyType("");
    setSurveyVersion("2.0");
    setUiuxRating(0);
    setFeatureRatings({});
    setSelectedFeatures([]);
    setExtraFeatures([]);
    setMostUsefulFeature("");
    setFeatureRequests("");
    setRecommendScore(0);
    setAdditionalComments("");
    setCustomQuestions([]);
    setCustomAnswers({});
    setEnabledSections({
      uiuxRating: true,
      featureRatings: true,
      recommendScore: true,
      mostUsefulFeature: true,
      featureRequests: true,
      additionalComments: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const effectiveType =
        surveyType === "__custom" ? customSurveyType.trim() : surveyType;

      // Filter out zero ratings and only include enabled/selected features
      const validFeatureRatings = Object.fromEntries(
        Object.entries(featureRatings).filter(
          ([key, v]) => v > 0 && selectedFeatures.includes(key),
        ),
      );

      // Build custom responses from custom questions + answers
      const customResponses: Record<string, string | number> = {};
      customQuestions.forEach((q) => {
        if (
          q.label.trim() &&
          customAnswers[q.id] !== undefined &&
          customAnswers[q.id] !== ""
        ) {
          const safeKey = q.label.trim().replace(/\s+/g, "_").toLowerCase();
          customResponses[safeKey] = customAnswers[q.id];
        }
      });

      await submitFeedback({
        surveyType: effectiveType || "general",
        surveyVersion,
        uiuxRating:
          enabledSections.uiuxRating && uiuxRating > 0 ? uiuxRating : undefined,
        featureRatings:
          enabledSections.featureRatings &&
          Object.keys(validFeatureRatings).length > 0
            ? validFeatureRatings
            : undefined,
        mostUsefulFeature:
          enabledSections.mostUsefulFeature && mostUsefulFeature.trim()
            ? mostUsefulFeature.trim()
            : undefined,
        featureRequests:
          enabledSections.featureRequests && featureRequests.trim()
            ? featureRequests.trim()
            : undefined,
        recommendScore:
          enabledSections.recommendScore && recommendScore > 0
            ? recommendScore
            : undefined,
        additionalComments:
          enabledSections.additionalComments && additionalComments.trim()
            ? additionalComments.trim()
            : undefined,
        customResponses:
          Object.keys(customResponses).length > 0 ? customResponses : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="timer-card max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement">
              Create Feedback Form
            </h2>
            <p className="text-xs sm:text-sm text-(--text-muted) font-inter mt-1">
              Configure form fields and submit feedback entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Form Configuration */}
          <div className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border)">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-(--text-muted)" />
              <h3 className="text-sm font-medium text-(--text-primary) font-inter">
                Form Configuration
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <FormSectionToggle
                label="UI/UX Rating"
                enabled={enabledSections.uiuxRating}
                onToggle={() => toggleSection("uiuxRating")}
              />
              <FormSectionToggle
                label="Feature Ratings"
                enabled={enabledSections.featureRatings}
                onToggle={() => toggleSection("featureRatings")}
              />
              <FormSectionToggle
                label="NPS Score"
                enabled={enabledSections.recommendScore}
                onToggle={() => toggleSection("recommendScore")}
              />
              <FormSectionToggle
                label="Best Feature"
                enabled={enabledSections.mostUsefulFeature}
                onToggle={() => toggleSection("mostUsefulFeature")}
              />
              <FormSectionToggle
                label="Feature Requests"
                enabled={enabledSections.featureRequests}
                onToggle={() => toggleSection("featureRequests")}
              />
              <FormSectionToggle
                label="Comments"
                enabled={enabledSections.additionalComments}
                onToggle={() => toggleSection("additionalComments")}
              />
            </div>
          </div>

          {/* Survey Type & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Survey Type
              </label>
              <AdminSelect
                value={surveyType}
                onChange={(val) => setSurveyType(val)}
                options={[
                  ...SURVEY_TYPES.map((type) => ({
                    value: type.value,
                    label: type.label,
                  })),
                  { value: "__custom", label: "Custom Type..." },
                ]}
                fullWidth
              />
              {surveyType === "__custom" && (
                <input
                  type="text"
                  value={customSurveyType}
                  onChange={(e) => setCustomSurveyType(e.target.value)}
                  className="w-full mt-2 px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter"
                  placeholder="Enter custom survey type..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Version
              </label>
              <input
                type="text"
                value={surveyVersion}
                onChange={(e) => setSurveyVersion(e.target.value)}
                className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter"
                placeholder="2.0"
              />
            </div>
          </div>

          {/* UI/UX Rating */}
          {enabledSections.uiuxRating && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                UI/UX Rating (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setUiuxRating(uiuxRating === rating ? 0 : rating)
                    }
                    className="p-2 rounded-lg transition-colors hover:bg-(--surface-elevated)"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating <= uiuxRating
                          ? "text-amber-500 fill-amber-500"
                          : "text-(--text-muted)"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feature Ratings */}
          {enabledSections.featureRatings && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-(--text-primary) font-inter">
                  Feature Ratings
                </label>
                <span className="text-xs text-(--text-muted) font-inter">
                  {selectedFeatures.length} selected
                </span>
              </div>

              {/* Feature Selection */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {allFeatures.map((feature) => (
                  <button
                    key={feature.key}
                    type="button"
                    onClick={() => toggleFeature(feature.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-inter transition-colors ${
                      selectedFeatures.includes(feature.key)
                        ? "bg-(--primary)/10 text-(--primary) border border-(--primary)/30"
                        : "bg-(--surface-elevated) text-(--text-muted) border border-(--border)"
                    }`}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>

              {/* Add Extra Feature */}
              <div className="mb-3">
                {extraFeatures.map((ef, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ef.label}
                      onChange={(e) =>
                        updateExtraFeature(index, "label", e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter"
                      placeholder="Feature name..."
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraFeature(index)}
                      className="p-2 text-(--text-muted) hover:text-(--error) hover:bg-(--error)/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExtraFeature}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-md text-(--text-secondary) transition-colors font-inter"
                >
                  <Plus className="w-3 h-3" />
                  Add Feature
                </button>
              </div>

              {/* Ratings */}
              <div className="space-y-3 bg-(--surface-elevated) rounded-lg p-2 sm:p-3 border border-(--border)">
                {allFeatures
                  .filter((f) => selectedFeatures.includes(f.key))
                  .map((feature) => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs sm:text-sm text-(--text-secondary) font-inter truncate min-w-0">
                        {feature.label}
                      </span>
                      <div className="flex gap-0.5 sm:gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() =>
                              setFeatureRatings({
                                ...featureRatings,
                                [feature.key]:
                                  featureRatings[feature.key] === rating
                                    ? 0
                                    : rating,
                              })
                            }
                            className="p-0.5 sm:p-1 rounded transition-colors"
                          >
                            <Star
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                rating <= (featureRatings[feature.key] || 0)
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-(--text-muted)"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                {selectedFeatures.length === 0 && (
                  <p className="text-sm text-(--text-muted) text-center py-2 font-inter">
                    Select features above to rate
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recommend Score (NPS) */}
          {enabledSections.recommendScore && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Would Recommend (1-10 NPS)
              </label>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() =>
                      setRecommendScore(recommendScore === score ? 0 : score)
                    }
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      score === recommendScore
                        ? "bg-(--primary) text-white"
                        : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border)"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Most Useful Feature */}
          {enabledSections.mostUsefulFeature && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Most Useful Feature
              </label>
              <AdminSelect
                value={mostUsefulFeature}
                onChange={(val) => setMostUsefulFeature(val)}
                options={allFeatures.map((feature) => ({
                  value: feature.key,
                  label: feature.label,
                }))}
                placeholder="Select a feature..."
                fullWidth
              />
            </div>
          )}

          {/* Feature Requests */}
          {enabledSections.featureRequests && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Feature Requests
              </label>
              <textarea
                value={featureRequests}
                onChange={(e) => setFeatureRequests(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) resize-none font-inter"
                placeholder="Enter feature requests..."
              />
            </div>
          )}

          {/* Additional Comments */}
          {enabledSections.additionalComments && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                Additional Comments
              </label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) resize-none font-inter"
                placeholder="Enter additional comments..."
              />
            </div>
          )}

          {/* Custom Questions Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-(--text-primary) font-inter">
                Custom Questions
              </label>
              <button
                type="button"
                onClick={addCustomQuestion}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-md text-(--text-secondary) transition-colors font-inter"
              >
                <Plus className="w-3 h-3" />
                Add Question
              </button>
            </div>
            {customQuestions.length > 0 ? (
              <div className="space-y-4">
                {customQuestions.map((question, idx) => (
                  <div
                    key={question.id}
                    className="bg-(--surface-elevated) rounded-lg p-3 border border-(--border) space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-(--text-muted) font-inter">
                        Question {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCustomQuestion(question.id)}
                        className="p-1 text-(--text-muted) hover:text-(--error) hover:bg-(--error)/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Question Label */}
                    <input
                      type="text"
                      value={question.label}
                      onChange={(e) =>
                        updateCustomQuestion(question.id, {
                          label: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter"
                      placeholder="Enter question..."
                    />

                    {/* Question Type & Required */}
                    <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
                      <AdminSelect
                        value={question.type}
                        onChange={(val) =>
                          updateCustomQuestion(question.id, {
                            type: val as CustomQuestionType,
                          })
                        }
                        options={QUESTION_TYPES.map((t) => ({
                          value: t.value,
                          label: t.label,
                        }))}
                        className="flex-1"
                        compact
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateCustomQuestion(question.id, {
                            required: !question.required,
                          })
                        }
                        className={`px-2.5 py-2 rounded-lg text-xs font-inter border transition-colors text-center ${
                          question.required
                            ? "bg-(--primary)/10 border-(--primary) text-(--primary)"
                            : "bg-(--surface) border-(--border) text-(--text-muted)"
                        }`}
                      >
                        {question.required ? "Required" : "Optional"}
                      </button>
                    </div>

                    {/* Options for select type */}
                    {question.type === "select" && (
                      <input
                        type="text"
                        value={question.options}
                        onChange={(e) =>
                          updateCustomQuestion(question.id, {
                            options: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter"
                        placeholder="Comma-separated options (e.g. Option A, Option B, Option C)"
                      />
                    )}

                    {/* Answer Input */}
                    {question.label.trim() && (
                      <div className="pt-2 border-t border-(--border)">
                        <p className="text-xs text-(--text-muted) font-inter mb-1.5">
                          Answer:
                        </p>
                        {question.type === "text" && (
                          <input
                            type="text"
                            value={(customAnswers[question.id] as string) || ""}
                            onChange={(e) =>
                              updateCustomAnswer(question.id, e.target.value)
                            }
                            className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) font-inter"
                            placeholder="Enter answer..."
                          />
                        )}
                        {question.type === "textarea" && (
                          <textarea
                            value={(customAnswers[question.id] as string) || ""}
                            onChange={(e) =>
                              updateCustomAnswer(question.id, e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) resize-none font-inter"
                            placeholder="Enter answer..."
                          />
                        )}
                        {question.type === "rating" && (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() =>
                                  updateCustomAnswer(
                                    question.id,
                                    customAnswers[question.id] === r ? 0 : r,
                                  )
                                }
                                className="p-1 rounded transition-colors"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    r <=
                                    ((customAnswers[question.id] as number) ||
                                      0)
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-(--text-muted)"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                        {question.type === "scale" && (
                          <div className="flex gap-1 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  updateCustomAnswer(
                                    question.id,
                                    customAnswers[question.id] === s ? 0 : s,
                                  )
                                }
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                  s === customAnswers[question.id]
                                    ? "bg-(--primary) text-white"
                                    : "bg-(--surface) text-(--text-secondary) hover:bg-(--border)"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {question.type === "select" && (
                          <AdminSelect
                            value={((customAnswers[question.id] as string) || "")}
                            onChange={(val) =>
                              updateCustomAnswer(question.id, val)
                            }
                            options={question.options
                              .split(",")
                              .map((opt) => opt.trim())
                              .filter(Boolean)
                              .map((opt) => ({
                                value: opt,
                                label: opt,
                              }))}
                            placeholder="Select..."
                            fullWidth
                            compact
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-(--text-muted) font-inter">
                Add custom questions with different field types (text, rating,
                scale, dropdown)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-(--border)">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const [surveyTypeFilter, setSurveyTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const feedbackStats = useQuery(api.feedbackResponses.getFeedbackStats, {
    surveyType: surveyTypeFilter !== "all" ? surveyTypeFilter : undefined,
  });

  const detailedStats = useQuery(
    api.feedbackResponses.getDetailedFeedbackStats,
    {
      surveyType: surveyTypeFilter !== "all" ? surveyTypeFilter : undefined,
    },
  );

  const feedbackList = useQuery(api.feedbackResponses.getAllFeedback, {
    surveyType: surveyTypeFilter !== "all" ? surveyTypeFilter : undefined,
    limit: 50,
  });

  const { data: surveyTypes } = useCachedQuery(
    api.feedbackResponses.getSurveyTypes,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.surveyTypes,
      ttl: ADMIN_CACHE_TTLS.feedback,
    },
  );

  const isLoading = feedbackStats === undefined || feedbackList === undefined;

  // Merge known survey types with those found in DB
  const allSurveyTypes = useMemo(() => {
    const known = new Set(["general", "coach", "cubie"]);
    if (surveyTypes) {
      surveyTypes.forEach((t) => known.add(t));
    }
    return Array.from(known);
  }, [surveyTypes]);

  const handleExportStats = () => {
    if (detailedStats) {
      exportToJSON(detailedStats, "feedback_analytics");
    }
  };

  const handleExportFeedback = () => {
    if (!feedbackList || feedbackList.length === 0) return;

    const exportData = feedbackList.map((f) => ({
      type: f.surveyType || "general",
      version: f.surveyVersion || "1.0",
      uiuxRating: f.uiuxRating || "",
      recommendScore: f.recommendScore || "",
      mostUsefulFeature: f.mostUsefulFeature || "",
      featureRequests: f.featureRequests || "",
      additionalComments: f.additionalComments || "",
      customResponses: f.customResponses
        ? JSON.stringify(f.customResponses)
        : "",
      featureRatings: f.featureRatings ? JSON.stringify(f.featureRatings) : "",
      createdAt: new Date(f.createdAt).toISOString(),
      submittedBy: f.userName || (f.userId ? "Unknown User" : "Anonymous"),
    }));

    exportToCSV(exportData, "feedback_responses");
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Filter */}
      <div className="timer-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-(--text-muted)" />
            <span className="text-sm text-(--text-secondary) font-inter">
              Survey Type:
            </span>
            <AdminSelect
              value={surveyTypeFilter}
              onChange={(val) => setSurveyTypeFilter(val)}
              options={[
                { value: "all", label: "All Types" },
                ...allSurveyTypes.map((type) => ({
                  value: type,
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                })),
              ]}
              compact
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-sm bg-(--primary) hover:bg-(--primary-hover) rounded-lg text-white transition-colors font-inter"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Create Form</span>
              <span className="xs:hidden">Form</span>
            </button>
            <button
              onClick={handleExportStats}
              disabled={!detailedStats}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-sm bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-lg text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Analytics</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <CollapsibleCard
        title="Overview Statistics"
        defaultOpen={true}
        storageKey="admin-feedback-stats-open"
      >
        <div className="space-y-4">
          {/* Primary Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-(--surface-elevated) rounded-xl p-3 sm:p-4 border border-(--border) animate-pulse"
                >
                  <div className="h-4 w-24 bg-(--surface) rounded mb-2" />
                  <div className="h-8 w-16 bg-(--surface) rounded" />
                </div>
              ))
            ) : (
              <>
                <StatCard
                  title="Total Responses"
                  value={feedbackStats.totalResponses}
                  icon={MessageSquare}
                  iconColor="text-blue-500"
                  iconBgColor="bg-blue-500/10"
                />
                <StatCard
                  title="Avg UI/UX Rating"
                  value={`${feedbackStats.averageUiuxRating}/5`}
                  icon={Star}
                  iconColor="text-amber-500"
                  iconBgColor="bg-amber-500/10"
                />
                <StatCard
                  title="Avg Recommend Score"
                  value={`${feedbackStats.averageRecommendScore}/10`}
                  icon={ThumbsUp}
                  iconColor="text-green-500"
                  iconBgColor="bg-green-500/10"
                />
                <NPSGauge score={feedbackStats.npsScore} />
              </>
            )}
          </div>

          {/* Secondary Stats Row */}
          {detailedStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                title="This Week"
                value={detailedStats.responsesThisWeek}
                icon={TrendingUp}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
                trend={{
                  value: detailedStats.responseRate.weekly,
                  label: "vs last week",
                }}
              />
              <StatCard
                title="This Month"
                value={detailedStats.responsesThisMonth}
                icon={TrendingUp}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
                trend={{
                  value: detailedStats.responseRate.monthly,
                  label: "vs last month",
                }}
              />
              <StatCard
                title="With Comments"
                value={detailedStats.responsesWithComments}
                icon={FileText}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
                subValue={`${detailedStats.totalResponses > 0 ? ((detailedStats.responsesWithComments / detailedStats.totalResponses) * 100).toFixed(0) : 0}% of total`}
              />
              <StatCard
                title="Logged In Users"
                value={detailedStats.loggedInResponses ?? 0}
                icon={Users}
                iconColor="text-cyan-500"
                iconBgColor="bg-cyan-500/10"
                subValue={`${detailedStats.anonymousResponses ?? 0} anonymous`}
              />
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Analytics Grid */}
      {detailedStats && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Response Trend */}
          <CollapsibleCard
            title="Weekly Response Trend"
            defaultOpen={true}
            storageKey="admin-feedback-trend-open"
          >
            <ResponseBarChart
              data={detailedStats.weeklyTrend.map((w) => ({
                label: w.week,
                value: w.count,
                avgRating: w.avgRating,
              }))}
            />
          </CollapsibleCard>

          {/* NPS Breakdown */}
          <CollapsibleCard
            title="NPS Breakdown"
            defaultOpen={true}
            storageKey="admin-feedback-nps-breakdown-open"
          >
            <NPSBreakdown breakdown={detailedStats.npsBreakdown} />
          </CollapsibleCard>
        </div>
      )}

      {/* Rating Distributions */}
      {detailedStats && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* UI/UX Rating Distribution */}
          <CollapsibleCard
            title="UI/UX Rating Distribution"
            defaultOpen={true}
            storageKey="admin-feedback-uiux-dist-open"
          >
            <RatingDistribution
              distribution={detailedStats.uiuxRatingDistribution}
              maxRating={5}
            />
          </CollapsibleCard>

          {/* Survey Types Breakdown */}
          <CollapsibleCard
            title="Survey Type Breakdown"
            defaultOpen={true}
            storageKey="admin-feedback-survey-types-open"
          >
            <div className="space-y-2">
              {Object.entries(detailedStats.surveyTypeBreakdown).map(
                ([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm text-(--text-secondary) font-inter w-24 truncate capitalize">
                      {type}
                    </span>
                    <div className="flex-1 h-2 bg-(--surface) rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--primary) rounded-full transition-all duration-500"
                        style={{
                          width: `${detailedStats.totalResponses > 0 ? ((count as number) / detailedStats.totalResponses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-(--text-primary) font-inter w-10 text-right">
                      {count as number}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CollapsibleCard>
        </div>
      )}

      {/* Most Useful Features */}
      {detailedStats && detailedStats.mostUsefulFeatures.length > 0 && (
        <div className="mt-6">
          <CollapsibleCard
            title="Most Mentioned Features"
            defaultOpen={true}
            storageKey="admin-feedback-useful-features-open"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {detailedStats.mostUsefulFeatures.slice(0, 9).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-(--surface-elevated) rounded-lg p-2.5 border border-(--border)"
                >
                  <span className="text-sm text-(--text-secondary) font-inter truncate capitalize">
                    {item.feature}
                  </span>
                  <span className="text-sm font-semibold text-(--text-primary) font-statement ml-2">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        </div>
      )}

      {/* Feature Ratings Overview */}
      {!isLoading &&
        feedbackStats.featureAverages &&
        Object.keys(feedbackStats.featureAverages).length > 0 && (
          <div className="mt-6">
            <CollapsibleCard
              title="Feature Ratings Overview"
              defaultOpen={true}
              storageKey="admin-feedback-feature-ratings-open"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(feedbackStats.featureAverages).map(
                  ([feature, rating]) => (
                    <FeatureRatingBar
                      key={feature}
                      feature={feature}
                      rating={rating as number}
                    />
                  ),
                )}
              </div>
            </CollapsibleCard>
          </div>
        )}

      {/* Feedback List */}
      <div className="mt-6">
        <CollapsibleCard
          title={`Recent Submissions (${feedbackList?.length || 0})`}
          defaultOpen={true}
          storageKey="admin-feedback-submissions-open"
          headerExtra={
            <button
              onClick={handleExportFeedback}
              disabled={!feedbackList || feedbackList.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-md text-(--text-secondary) transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export feedback as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="timer-card animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-(--surface-elevated) rounded" />
                    <div className="h-4 w-24 bg-(--surface-elevated) rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
              <p className="text-(--text-muted) font-inter">
                No feedback submissions yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((feedback) => (
                <FeedbackItem
                  key={feedback._id}
                  feedback={feedback}
                  isExpanded={expandedId === feedback._id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === feedback._id ? null : feedback._id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleCard>
      </div>

      {/* Feedback Form Modal */}
      <FeedbackFormModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}
